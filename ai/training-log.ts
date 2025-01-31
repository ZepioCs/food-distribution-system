import fs from 'fs';
import path from 'path';

interface TrainingLogEntry {
  timestamp?: string;
  type: 'start' | 'progress' | 'best' | 'complete' | 'error';
  message: string;
  config?: {
    learningRate: number;
    hiddenLayer1Size: number;
    hiddenLayer2Size: number;
    momentum: number;
  };
  metrics?: {
    trainAccuracy?: number;
    validationAccuracy?: number;
    error?: number;
  };
}

const LOG_FILE = path.join(process.cwd(), 'ai', 'training-log.json');

export function addTrainingLog(log: Omit<TrainingLogEntry, 'timestamp'>): void {
  try {
    let logs: TrainingLogEntry[] = [];
    
    if (fs.existsSync(LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
    
    logs.push({
      ...log,
      timestamp: new Date().toISOString()
    });
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error adding training log:', error);
  }
}

export function getTrainingLogs(): TrainingLogEntry[] {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error('Error reading training logs:', error);
    return [];
  }
}

export function clearTrainingLogs(): void {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
  } catch (error) {
    console.error('Error clearing training logs:', error);
  }
}

export type { TrainingLogEntry }; 