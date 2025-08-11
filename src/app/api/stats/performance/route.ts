import { NextRequest, NextResponse } from 'next/server';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '7d';
    
    // Calculate date range
    const now = new Date();
    const rangeMap: { [key: string]: number } = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
    };
    
    const daysBack = rangeMap[range] || 7;
    const startDate = startOfDay(subDays(now, daysBack));
    const endDate = endOfDay(now);
    
    // Fetch current period stats (today)
    const { data: currentData, error: currentError } = await supabaseAdmin
      .from('test_runs')
      .select('test_score, timestamp')
      .gte('timestamp', startOfDay(now).toISOString())
      .lte('timestamp', endDate.toISOString());
    
    if (currentError) throw currentError;
    
    // Calculate current average score
    const currentScores = currentData
      ?.map(d => d.test_score * 20) // Convert 0-5 to 0-100
      .filter(s => s !== null);
    
    const currentAvgScore = currentScores?.length > 0
      ? currentScores.reduce((sum, s) => sum + s, 0) / currentScores.length
      : 0;
    
    // Fetch historical comparisons
    const yesterday = startOfDay(subDays(now, 1));
    const lastWeek = startOfDay(subDays(now, 7));
    const lastMonth = startOfDay(subDays(now, 30));
    
    const { data: yesterdayData } = await supabaseAdmin
      .from('test_runs')
      .select('test_score')
      .gte('timestamp', yesterday.toISOString())
      .lt('timestamp', startOfDay(now).toISOString());
    
    const { data: lastWeekData } = await supabaseAdmin
      .from('test_runs')
      .select('test_score')
      .gte('timestamp', subDays(now, 14).toISOString())
      .lt('timestamp', lastWeek.toISOString());
    
    const { data: lastMonthData } = await supabaseAdmin
      .from('test_runs')
      .select('test_score')
      .gte('timestamp', subDays(now, 60).toISOString())
      .lt('timestamp', lastMonth.toISOString());
    
    // Calculate historical averages
    const calcAverage = (data: any[] | null) => {
      if (!data || data.length === 0) return 0;
      const scores = data
        .map(d => d.test_score * 20)
        .filter(s => s !== null);
      return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    };
    
    const yesterdayAvg = calcAverage(yesterdayData);
    const lastWeekAvg = calcAverage(lastWeekData);
    const lastMonthAvg = calcAverage(lastMonthData);
    
    // Get timeline data for charts
    const { data: timelineData } = await supabaseAdmin
      .from('test_runs')
      .select('test_score, timestamp')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true });
    
    // Group by day for timeline
    const timeline = [];
    for (let i = 0; i <= daysBack; i++) {
      const date = subDays(now, daysBack - i);
      const dayStart = startOfDay(date).toISOString();
      const dayEnd = endOfDay(date).toISOString();
      
      const dayTests = timelineData?.filter(t => 
        t.timestamp >= dayStart && t.timestamp <= dayEnd
      ) || [];
      
      const dayScores = dayTests
        .map(d => d.test_score * 20)
        .filter(s => s !== null);
      
      timeline.push({
        date: format(date, 'yyyy-MM-dd'),
        avgScore: dayScores.length > 0 
          ? dayScores.reduce((sum, s) => sum + s, 0) / dayScores.length 
          : 0,
        minScore: dayScores.length > 0 ? Math.min(...dayScores) : 0,
        maxScore: dayScores.length > 0 ? Math.max(...dayScores) : 0,
        count: dayScores.length,
      });
    }
    
    // Get test breakdown
    const { data: testDetails } = await supabaseAdmin
      .from('test_details')
      .select('test_id, test_name, score, passed, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    // Calculate test-by-test performance
    const testBreakdown = ['P1', 'P2', 'P3', 'P4', 'P5'].map(testId => {
      const testResults = testDetails?.filter(t => t.test_id === testId) || [];
      const currentTests = testResults.filter(t => 
        new Date(t.created_at || 0) >= startOfDay(now)
      );
      const historicalTests = testResults.filter(t => 
        new Date(t.created_at || 0) < startOfDay(now)
      );
      
      const currentAvg = currentTests.length > 0
        ? currentTests.reduce((sum, t) => sum + (t.score || 0), 0) / currentTests.length
        : 0;
      
      const historicalAvg = historicalTests.length > 0
        ? historicalTests.reduce((sum, t) => sum + (t.score || 0), 0) / historicalTests.length
        : 0;
      
      return {
        testId,
        name: testResults[0]?.test_name || testId,
        currentAvg,
        historicalAvg,
        change: currentAvg - historicalAvg,
      };
    });
    
    // Get recent tests for live feed
    const { data: recentTests } = await supabaseAdmin
      .from('test_runs')
      .select('id, test_score, timestamp, claude_version, region')
      .order('timestamp', { ascending: false })
      .limit(20);
    
    const recentTestsFormatted = recentTests?.map(t => ({
      id: t.id,
      timestamp: t.timestamp,
      score: t.test_score * 20,
      // Always show claude-code since all tests run in Claude Code
      version: 'claude-code',
      region: t.region || 'Unknown',
    })) || [];
    
    // Calculate score distribution
    const distribution = [
      { range: '0-20', current: 0, historical: 0 },
      { range: '21-40', current: 0, historical: 0 },
      { range: '41-60', current: 0, historical: 0 },
      { range: '61-80', current: 0, historical: 0 },
      { range: '81-100', current: 0, historical: 0 },
    ];
    
    timelineData?.forEach(t => {
      const score = t.test_score * 20;
      const isToday = new Date(t.timestamp) >= startOfDay(now);
      const idx = Math.min(Math.floor(score / 20), 4);
      
      if (isToday) {
        distribution[idx].current++;
      } else {
        distribution[idx].historical++;
      }
    });
    
    // Calculate percentile
    const allScores = timelineData
      ?.map(d => d.test_score * 20)
      .filter(s => s !== null)
      .sort((a, b) => a - b) || [];
    
    const percentile = allScores.length > 0
      ? Math.round((allScores.filter(s => s < currentAvgScore).length / allScores.length) * 100)
      : 50;
    
    // Determine trend
    const changePercent = yesterdayAvg > 0 
      ? ((currentAvgScore - yesterdayAvg) / yesterdayAvg) * 100 
      : 0;
    
    const trend = changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable';
    
    // Get total tests today from all users
    const { count: totalTestsToday } = await supabaseAdmin
      .from('test_runs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', startOfDay(now).toISOString())
      .lte('timestamp', endDate.toISOString());
    
    return NextResponse.json({
      current: {
        avgScore: currentAvgScore,
        testCount: currentScores?.length || 0,
        totalTestsToday: totalTestsToday || 0,
        percentile,
        trend,
        changePercent,
      },
      historical: {
        yesterday: yesterdayAvg,
        lastWeek: lastWeekAvg,
        lastMonth: lastMonthAvg,
      },
      timeline,
      testBreakdown,
      recentTests: recentTestsFormatted,
      distribution,
    });
    
  } catch (error) {
    console.error('Failed to fetch performance stats:', error);
    
    // Always return error details for debugging
    return NextResponse.json({
      error: 'Failed to fetch performance stats',
      details: error instanceof Error ? error.message : String(error),
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}