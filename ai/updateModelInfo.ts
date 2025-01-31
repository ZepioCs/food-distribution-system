import { ModelInfo } from '@/models/default';
import fs from 'fs';
import path from 'path';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const MODEL_INFO_PATH = path.join(process.cwd(), 'ai', 'model-info.json');

export function getModelInfo(): ModelInfo {
  try {
    const data = fs.readFileSync(MODEL_INFO_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading model info:', error);
    throw error;
  }
}

export function updateModelInfo(updates: DeepPartial<ModelInfo>): void {
  try {
    const currentInfo = getModelInfo();
    const updatedInfo = {
      ...currentInfo,
      ...updates,
      training: {
        ...currentInfo.training,
        ...(updates.training || {})
      },
      performance: {
        ...currentInfo.performance,
        ...(updates.performance || {})
      }
    };

    fs.writeFileSync(MODEL_INFO_PATH, JSON.stringify(updatedInfo, null, 2));
  } catch (error) {
    console.error('Error updating model info:', error);
    throw error;
  }
}

export function updateModelTrainingProgress(epoch: number, totalEpochs: number, trainAccuracy: number, validationAccuracy: number): void {
  const timestamp = new Date().toISOString();
  const updates: DeepPartial<ModelInfo> = {
    training: {
      current_epoch: epoch,
      total_epochs: totalEpochs,
      train_accuracy: trainAccuracy,
      validation_accuracy: validationAccuracy,
      best_accuracy: validationAccuracy,
      last_training_session: timestamp
    },
    performance: {
      validation_error: 1 - validationAccuracy,
      best_accuracy: validationAccuracy,
      last_training_session: timestamp
    },
    status: {
      last_updated: timestamp
    }
  };

  updateModelInfo(updates);
}