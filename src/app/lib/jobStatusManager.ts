// In-memory job status store (in production, use Redis or database)
const jobStatusStore = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}>();

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

// Get all jobs (for debugging)
export function getAllJobs() {
  return Array.from(jobStatusStore.entries()).map(([jobId, job]) => ({
    jobId,
    ...job
  }));
}
