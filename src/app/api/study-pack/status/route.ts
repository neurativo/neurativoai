import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// In-memory job status store (in production, use Redis or database)
const jobStatusStore = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const jobStatus = jobStatusStore.get(jobId);

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

    const existingJob = jobStatusStore.get(jobId);
    const now = new Date();

    if (existingJob) {
      // Update existing job
      jobStatusStore.set(jobId, {
        ...existingJob,
        status: status || existingJob.status,
        progress: progress !== undefined ? progress : existingJob.progress,
        downloadUrl: downloadUrl || existingJob.downloadUrl,
        error: error || existingJob.error,
        updatedAt: now
      });
    } else {
      // Create new job
      jobStatusStore.set(jobId, {
        status: status || 'pending',
        progress: progress || 0,
        downloadUrl,
        error,
        createdAt: now,
        updatedAt: now
      });
    }

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

// Helper function to update job status (can be called from other modules)
export function updateJobStatus(
  jobId: string,
  updates: {
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    downloadUrl?: string;
    error?: string;
  }
) {
  const existingJob = jobStatusStore.get(jobId);
  const now = new Date();

  if (existingJob) {
    jobStatusStore.set(jobId, {
      ...existingJob,
      ...updates,
      updatedAt: now
    });
  } else {
    jobStatusStore.set(jobId, {
      status: 'pending',
      progress: 0,
      createdAt: now,
      updatedAt: now,
      ...updates
    });
  }
}

// Helper function to get job status
export function getJobStatus(jobId: string) {
  return jobStatusStore.get(jobId);
}

// Cleanup old jobs (run periodically)
export function cleanupOldJobs(maxAgeHours = 24) {
  const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  
  for (const [jobId, job] of jobStatusStore.entries()) {
    if (job.updatedAt < cutoffTime) {
      jobStatusStore.delete(jobId);
    }
  }
}
