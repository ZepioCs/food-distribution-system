'use server';

import { getTrainingProgress } from '@/ai/training-progress';

export async function getTrainingProgressAction() {
  return getTrainingProgress();
} 