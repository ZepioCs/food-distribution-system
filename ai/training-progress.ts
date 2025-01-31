import fs from 'fs';
import path from 'path';

interface TrainingProgress {
  isTraining: boolean;
  configNumber: number;
  totalConfigs: number;
  currentFold: number;
  totalFolds: number;
  currentConfig: {
    learningRate: number;
    hiddenLayer1Size: number;
    hiddenLayer2Size: number;
    momentum: number;
  } | null;
  currentEpoch: number;
  totalEpochs: number;
  trainAccuracy: number;
  validationAccuracy: number;
  bestAccuracy: number;
  lastUpdate: string;
}

const PROGRESS_FILE = path.join(process.cwd(), 'ai', 'training-progress.json');

// Initialize with default values
const defaultProgress: TrainingProgress = {
  isTraining: false,
  configNumber: 0,
  totalConfigs: 0,
  currentFold: 0,
  totalFolds: 0,
  currentConfig: null,
  currentEpoch: 0,
  totalEpochs: 0,
  trainAccuracy: 0,
  validationAccuracy: 0,
  bestAccuracy: 0,
  lastUpdate: new Date().toISOString()
};

export function initializeTrainingProgress(
  totalEpochs: number,
  totalFolds: number,
  totalConfigs: number
): void {
  const progress = {
    ...defaultProgress,
    totalEpochs,
    totalFolds,
    totalConfigs,
    lastUpdate: new Date().toISOString()
  };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

export function updateTrainingProgress(updates: Partial<TrainingProgress>): void {
  try {
    let currentProgress: TrainingProgress;
    
    if (fs.existsSync(PROGRESS_FILE)) {
      currentProgress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } else {
      currentProgress = defaultProgress;
    }

    const updatedProgress = {
      ...currentProgress,
      ...updates,
      lastUpdate: new Date().toISOString()
    };

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(updatedProgress, null, 2));
  } catch (error) {
    console.error('Error updating training progress:', error);
  }
}

export function getTrainingProgress(): TrainingProgress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
    return defaultProgress;
  } catch (error) {
    console.error('Error reading training progress:', error);
    return defaultProgress;
  }
}

export function clearTrainingProgress(): void {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(defaultProgress, null, 2));
  } catch (error) {
    console.error('Error clearing training progress:', error);
  }
}

export type { TrainingProgress }; 