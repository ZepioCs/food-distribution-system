import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Create a stop signal file that the training process will check
    const stopSignalPath = path.join(process.cwd(), 'ai', 'stop-training');
    fs.writeFileSync(stopSignalPath, '');

    return NextResponse.json({ message: 'Stop signal sent' });
  } catch (error) {
    console.error('Error stopping training:', error);
    return NextResponse.json({ error: 'Failed to stop training' }, { status: 500 });
  }
} 