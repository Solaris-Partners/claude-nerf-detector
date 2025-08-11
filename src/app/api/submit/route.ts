import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const TestSubmissionSchema = z.object({
  anonymous_user_id: z.string(),
  claude_version: z.string(),
  test_score: z.number().int().min(0).max(5),
  continuous_score: z.number().min(0).max(100).optional(), // New continuous score
  total_tests: z.number().int().default(5),
  ttft_ms: z.number().optional(),
  tokens_per_second: z.number().optional(),
  avg_output_length: z.number().optional(),
  error_rate: z.number().min(0).max(1).optional(),
  region: z.string().optional(),
  test_details: z.array(z.object({
    test_id: z.string(),
    test_name: z.string(),
    passed: z.boolean(),
    score: z.number().min(0).max(100).optional(), // New continuous score per test
    response_time_ms: z.number().optional(),
    output_quality: z.number().min(0).max(100).optional(),
    metrics: z.object({  // New detailed metrics
      correctness: z.number(),
      completeness: z.number(),
      performance: z.number(),
      style: z.number(),
      edgeCases: z.number(),
    }).optional(),
    error_message: z.string().optional(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = TestSubmissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    
    // Insert test run
    const { data: testRun, error: runError } = await supabaseAdmin
      .from('test_runs')
      .insert({
        anonymous_user_id: data.anonymous_user_id,
        claude_version: data.claude_version,
        test_score: data.test_score,
        continuous_score: data.continuous_score, // Add continuous score
        total_tests: data.total_tests,
        ttft_ms: data.ttft_ms,
        tokens_per_second: data.tokens_per_second,
        avg_output_length: data.avg_output_length,
        error_rate: data.error_rate,
        region: data.region,
      })
      .select()
      .single();

    if (runError || !testRun) {
      console.error('Error inserting test run:', runError);
      return NextResponse.json(
        { error: 'Failed to save test run' },
        { status: 500 }
      );
    }

    // Insert test details if provided
    if (data.test_details && data.test_details.length > 0) {
      const details = data.test_details.map(detail => ({
        run_id: testRun.id,
        ...detail,
      }));

      const { error: detailError } = await supabaseAdmin
        .from('test_details')
        .insert(details);

      if (detailError) {
        console.error('Error inserting test details:', detailError);
        // Continue even if details fail
      }
    }

    // Get comparison stats
    const comparisonStats = await getComparisonStats(
      data.continuous_score || (data.test_score * 20), // Use continuous score if available
      data.region
    );
    
    // Get performance insights
    const insights = await getPerformanceInsights();

    return NextResponse.json({
      success: true,
      run_id: testRun.id,
      comparison: comparisonStats,
      insights: insights,
      share_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://claude-nerf-detector.vercel.app'}/run/${testRun.id}`,
    });

  } catch (error) {
    console.error('Submit endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getComparisonStats(userScore: number, region?: string) {
  try {
    // Get global average (now using continuous_score)
    const { data: globalStats } = await supabaseAdmin
      .from('test_runs')
      .select('test_score, continuous_score, total_tests')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!globalStats || globalStats.length === 0) {
      return null;
    }

    const globalScores = globalStats.map(r => 
      r.continuous_score || (r.test_score / r.total_tests * 100)
    );
    const globalAvg = globalScores.reduce((a, b) => a + b, 0) / globalScores.length;
    
    // Calculate percentile
    const betterThan = globalScores.filter(s => s < userScore).length;
    const percentile = Math.round((betterThan / globalScores.length) * 100);

    // Get regional average if region provided
    let regionAvg = null;
    if (region) {
      const { data: regionStats } = await supabaseAdmin
        .from('test_runs')
        .select('test_score, continuous_score, total_tests')
        .eq('region', region)
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (regionStats && regionStats.length > 0) {
        const regionScores = regionStats.map(r => 
          r.continuous_score || (r.test_score / r.total_tests * 100)
        );
        regionAvg = regionScores.reduce((a, b) => a + b, 0) / regionScores.length;
      }
    }

    return {
      percentile,
      globalAvg: globalAvg / 20, // Convert to 0-5 for backwards compatibility
      regionAvg: regionAvg ? regionAvg / 20 : null,
      totalUsers: globalStats.length,
    };

  } catch (error) {
    console.error('Error calculating comparison stats:', error);
    return null;
  }
}

async function getPerformanceInsights() {
  try {
    // Get today's test count
    const { count: todayCount } = await supabaseAdmin
      .from('test_runs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
    
    // Get unique users today
    const { data: uniqueUsers } = await supabaseAdmin
      .from('test_runs')
      .select('anonymous_user_id')
      .gte('timestamp', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
    
    const uniqueUserCount = new Set(uniqueUsers?.map(u => u.anonymous_user_id) || []).size;
    
    // Get performance trend (comparing today vs yesterday)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: yesterdayStats } = await supabaseAdmin
      .from('test_runs')
      .select('continuous_score, test_score')
      .gte('timestamp', new Date(yesterday.setHours(0, 0, 0, 0)).toISOString())
      .lt('timestamp', new Date(yesterday.setHours(23, 59, 59, 999)).toISOString());
    
    const { data: todayStats } = await supabaseAdmin
      .from('test_runs')
      .select('continuous_score, test_score')
      .gte('timestamp', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
    
    let trending = 'stable';
    if (yesterdayStats && todayStats && yesterdayStats.length > 0 && todayStats.length > 0) {
      const yesterdayAvg = yesterdayStats.reduce((sum, s) => 
        sum + (s.continuous_score || s.test_score * 20), 0
      ) / yesterdayStats.length;
      
      const todayAvg = todayStats.reduce((sum, s) => 
        sum + (s.continuous_score || s.test_score * 20), 0
      ) / todayStats.length;
      
      const diff = todayAvg - yesterdayAvg;
      if (diff > 2) trending = 'better';
      else if (diff < -2) trending = 'worse';
    }
    
    return {
      testCount: todayCount || 0,
      uniqueUsers: uniqueUserCount,
      trending,
    };
    
  } catch (error) {
    console.error('Error getting performance insights:', error);
    return null;
  }
}