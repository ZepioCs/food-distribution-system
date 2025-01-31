'use server';

import { getTrainingLogs } from '@/ai/training-log';

export async function getTrainingLogsAction() {
  return getTrainingLogs();
} 