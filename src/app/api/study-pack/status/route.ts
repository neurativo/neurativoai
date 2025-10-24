import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { updateJobStatus, getJobStatus } from '@/app/lib/jobStatusManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const jobStatus = getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: jobStatus.status,
      progress: jobStatus.progress,
      downloadUrl: jobStatus.downloadUrl,
      error: jobStatus.error,
      createdAt: jobStatus.createdAt,
      updatedAt: jobStatus.updatedAt
    });

  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jobId, status, progress, downloadUrl, error } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    updateJobStatus(jobId, {
      status,
      progress,
      downloadUrl,
      error
    });

    return NextResponse.json({
      success: true,
      message: 'Job status updated successfully'
    });

  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { error: 'Failed to update job status' },
      { status: 500 }
    );
  }
}

