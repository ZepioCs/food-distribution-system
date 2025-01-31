'use server';

import { ModelInfo } from '@/models/default';
import fs from 'fs';
import path from 'path';

export async function getModelInfo(): Promise<ModelInfo | null> {
  try {
    const modelInfoPath = path.join(process.cwd(), 'ai', 'model-info.json');
    const modelInfo: ModelInfo = JSON.parse(fs.readFileSync(modelInfoPath, 'utf8'));
    return modelInfo;
  } catch (error) {
    console.error('Error reading model info:', error);
    return null;
  }
} 