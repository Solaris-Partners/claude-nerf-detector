import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get test runs for the period
    const { data: testRuns, error } = await supabaseAdmin
      .from('test_runs')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching test runs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    if (!testRuns || testRuns.length === 0) {
      return NextResponse.json({
        period,
        totalRuns: 0,
        uniqueUsers: 0,
        avgScore: 0,
        avgTtft: 0,
        avgTokensPerSecond: 0,
        avgErrorRate: 0,
        trends: [],
      });
    }

    // Calculate statistics
    const uniqueUsers = new Set(testRuns.map(r => r.anonymous_user_id)).size;
    const avgScore = testRuns.reduce((sum, r) => sum + (r.test_score / r.total_tests), 0) / testRuns.length;
    const avgTtft = testRuns.filter(r => r.ttft_ms).reduce((sum, r) => sum + r.ttft_ms!, 0) / testRuns.filter(r => r.ttft_ms).length || 0;
    const avgTokensPerSecond = testRuns.filter(r => r.tokens_per_second).reduce((sum, r) => sum + r.tokens_per_second!, 0) / testRuns.filter(r => r.tokens_per_second).length || 0;
    const avgErrorRate = testRuns.filter(r => r.error_rate !== null).reduce((sum, r) => sum + r.error_rate!, 0) / testRuns.filter(r => r.error_rate !== null).length || 0;

    // Calculate trends (hourly for 24h, daily for 7d/30d)
    const trendInterval = period === '24h' ? 'hour' : 'day';
    const trends = calculateTrends(testRuns, trendInterval);

    // Get regional distribution
    const regionalDistribution = calculateRegionalDistribution(testRuns);

    return NextResponse.json({
      period,
      totalRuns: testRuns.length,
      uniqueUsers,
      avgScore: avgScore * 5, // Convert to score out of 5
      avgTtft,
      avgTokensPerSecond,
      avgErrorRate,
      trends,
      regionalDistribution,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Global stats endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateTrends(testRuns: any[], interval: 'hour' | 'day') {
  const trends: any[] = [];
  const grouped = new Map<string, any[]>();

  testRuns.forEach(run => {
    const date = new Date(run.timestamp);
    const key = interval === 'hour' 
      ? `${date.toISOString().slice(0, 13)}:00`
      : date.toISOString().slice(0, 10);
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(run);
  });

  grouped.forEach((runs, timestamp) => {
    const avgScore = runs.reduce((sum, r) => sum + (r.test_score / r.total_tests), 0) / runs.length;
    const avgTtft = runs.filter(r => r.ttft_ms).reduce((sum, r) => sum + r.ttft_ms, 0) / runs.filter(r => r.ttft_ms).length || 0;
    
    trends.push({
      timestamp,
      avgScore: avgScore * 5,
      avgTtft,
      totalRuns: runs.length,
      uniqueUsers: new Set(runs.map(r => r.anonymous_user_id)).size,
    });
  });

  return trends.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function calculateRegionalDistribution(testRuns: any[]) {
  const regional = new Map<string, number>();
  
  testRuns.forEach(run => {
    if (run.region) {
      regional.set(run.region, (regional.get(run.region) || 0) + 1);
    }
  });

  return Array.from(regional.entries())
    .map(([region, count]) => ({ region, count, percentage: (count / testRuns.length) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 regions
}