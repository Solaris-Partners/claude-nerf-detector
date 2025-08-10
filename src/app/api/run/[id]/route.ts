import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch test run
    const { data: testRun, error: runError } = await supabase
      .from('test_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (runError || !testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      );
    }

    // Fetch test details
    const { data: testDetails, error: detailsError } = await supabase
      .from('test_details')
      .select('*')
      .eq('run_id', id)
      .order('test_id');

    return NextResponse.json({
      ...testRun,
      test_details: testDetails || []
    });

  } catch (error) {
    console.error('Error fetching test run:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}