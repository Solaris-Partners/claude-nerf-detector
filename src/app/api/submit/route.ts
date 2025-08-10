import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

// Validation schema
const TestSubmissionSchema = z.object({
  anonymous_user_id: z.string(),
  claude_version: z.string(),
  test_score: z.number().int().min(0).max(5),
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
    response_time_ms: z.number().optional(),
    output_quality: z.number().min(0).max(100).optional(),
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
    const { data: testRun, error: runError } = await supabase
      .from('test_runs')
      .insert({
        anonymous_user_id: data.anonymous_user_id,
        claude_version: data.claude_version,
        test_score: data.test_score,
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

      const { error: detailError } = await supabase
        .from('test_details')
        .insert(details);

      if (detailError) {
        console.error('Error inserting test details:', detailError);
        // Continue even if details fail
      }
    }

    // Get comparison stats
    const comparisonStats = await getComparisonStats(data.test_score, data.region);

    return NextResponse.json({
      success: true,
      run_id: testRun.id,
      comparison: comparisonStats,
      share_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://claude-nerf.com'}/run/${testRun.id}`,
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
    // Get global average
    const { data: globalStats } = await supabase
      .from('test_runs')
      .select('test_score, total_tests')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!globalStats || globalStats.length === 0) {
      return null;
    }

    const globalScores = globalStats.map(r => r.test_score / r.total_tests);
    const globalAvg = globalScores.reduce((a, b) => a + b, 0) / globalScores.length;
    
    // Calculate percentile
    const betterThan = globalScores.filter(s => s < userScore / 5).length;
    const percentile = Math.round((betterThan / globalScores.length) * 100);

    // Get regional average if region provided
    let regionAvg = null;
    if (region) {
      const { data: regionStats } = await supabase
        .from('test_runs')
        .select('test_score, total_tests')
        .eq('region', region)
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (regionStats && regionStats.length > 0) {
        const regionScores = regionStats.map(r => r.test_score / r.total_tests);
        regionAvg = regionScores.reduce((a, b) => a + b, 0) / regionScores.length;
      }
    }

    return {
      percentile,
      globalAvg: globalAvg * 5, // Convert back to score out of 5
      regionAvg: regionAvg ? regionAvg * 5 : null,
      totalUsers: globalStats.length,
    };

  } catch (error) {
    console.error('Error calculating comparison stats:', error);
    return null;
  }
}