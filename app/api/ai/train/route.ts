import { NextResponse } from 'next/server';
import { autoTrain } from '@/ai/train';

let trainingProcess: Promise<void> | null = null;

export async function POST() {
  try {
    if (trainingProcess) {
      return NextResponse.json({ error: 'Training already in progress' }, { status: 409 });
    }

    // Start training in the background
    trainingProcess = autoTrain().finally(() => {
      trainingProcess = null;
    });

    return NextResponse.json({ message: 'Training started' });
  } catch (error) {
    console.error('Error starting training:', error);
    return NextResponse.json({ error: 'Failed to start training' }, { status: 500 });
  }
} 