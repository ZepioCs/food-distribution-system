import { Architect, Network } from "synaptic";
import * as fs from "fs";
import path from "path";
import trainingData from './training_data.json';
import { updateModelTrainingProgress, updateModelInfo } from './updateModelInfo';
import { initializeTrainingProgress, updateTrainingProgress as updateNewProgress, clearTrainingProgress } from './training-progress';
import { addTrainingLog, clearTrainingLogs } from './training-log';
import { NeuralNetwork, TrainingConfig, TrainingDataPoint, ValidationResult } from "@/models/default";

function oneHotEncode(value: number, categories: number): number[] {
  const encoded = new Array(categories).fill(0);
  encoded[value - 1] = 1;
  return encoded;
}

function normalizeAndEncode(input: number[]): number[] {
  // Extract values from input array
  const [weekday, month, temperature, rain, event] = input;
  
  // One-hot encode weekday (5 categories for Monday-Friday)
  const weekdayEncoded = oneHotEncode(weekday, 5);
  
  // One-hot encode month (12 categories)
  const monthEncoded = oneHotEncode(month, 12);
  
  // Normalize temperature with seasonal adjustment
  const season = Math.floor(((month % 12) / 12) * 4);
  const seasonalRanges = [
    { min: -30, max: 15 },  // Winter
    { min: -10, max: 25 },  // Spring
    { min: 5, max: 50 },    // Summer
    { min: -10, max: 25 }   // Fall
  ];
  const range = seasonalRanges[season];
  const normalizedTemp = (temperature - range.min) / (range.max - range.min);
  
  // Combine all features
  return [
    ...weekdayEncoded,
    ...monthEncoded,
    normalizedTemp,
    rain,
    event
  ];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function splitDataset(data: TrainingDataPoint[], folds: number): TrainingDataPoint[][] {
  const shuffledData = shuffleArray(data);
  const foldSize = Math.floor(data.length / folds);
  const splits: TrainingDataPoint[][] = [];
  
  for (let i = 0; i < folds; i++) {
    const start = i * foldSize;
    const end = i === folds - 1 ? data.length : start + foldSize;
    splits.push(shuffledData.slice(start, end));
  }
  
  return splits;
}

function validateTrainingData(data: TrainingDataPoint[]): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    console.error('Error: Training data is empty or not an array');
    return false;
  }

  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    if (!point.input || !Array.isArray(point.input) || point.input.length !== 5) {
      console.error(`Error: Invalid input at index ${i}. Expected array of length 5`);
      console.error('Got:', point.input);
      return false;
    }

    const [weekday, month, temperature, rain, event] = point.input;
    
    // Validate weekday (1-5)
    if (weekday < 1 || weekday > 5) {
      console.error(`Error: Invalid weekday ${weekday} at index ${i}. Must be between 1 and 5`);
      return false;
    }
    
    // Validate month (1-12)
    if (month < 1 || month > 12) {
      console.error(`Error: Invalid month ${month} at index ${i}. Must be between 1 and 12`);
      return false;
    }
    
    // Validate temperature (reasonable range)
    if (temperature < -30 || temperature > 50) {
      console.error(`Error: Invalid temperature ${temperature} at index ${i}. Must be between -30 and 50`);
      return false;
    }
    
    // Validate rain (0 or 1)
    if (rain !== 0 && rain !== 1) {
      console.error(`Error: Invalid rain value ${rain} at index ${i}. Must be 0 or 1`);
      return false;
    }
    
    // Validate event (0 or 1)
    if (event !== 0 && event !== 1) {
      console.error(`Error: Invalid event value ${event} at index ${i}. Must be 0 or 1`);
      return false;
    }

    // Validate output
    if (!point.output || !Array.isArray(point.output) || point.output.length !== 1) {
      console.error(`Error: Invalid output at index ${i}. Expected array of length 1`);
      console.error('Got:', point.output);
      return false;
    }

    // Validate output value (should be a number between 0 and 1)
    if (typeof point.output[0] !== 'number' || point.output[0] < 0 || point.output[0] > 1) {
      console.error(`Error: Invalid output value ${point.output[0]} at index ${i}. Must be between 0 and 1`);
      return false;
    }
  }
  return true;
}

function trainAndValidate(
  trainingSet: TrainingDataPoint[],
  validationSet: TrainingDataPoint[],
  config: TrainingConfig,
  epochs: number
): ValidationResult {
  const net = new Architect.Perceptron(
    20, // Input layer size
    config.hiddenLayer1Size,
    config.hiddenLayer2Size,
    1  // Output layer size
  );
  
  let bestError = Infinity;
  let bestNetwork = null;
  let plateauCount = 0;
  
  try {
    for (let epoch = 0; epoch < epochs; epoch++) {
      // Training phase
      let trainingError = 0;
      const shuffledTraining = shuffleArray(trainingSet);
      
      shuffledTraining.forEach((data, index) => {
        try {
          const encodedInput = normalizeAndEncode(data.input);
          const output = net.activate(encodedInput);
          trainingError += Math.pow(output[0] - data.output[0], 2);
          
          const learningRate = config.momentum ? 
            config.learningRate * (1 + config.momentum * (epoch / epochs)) :
            config.learningRate;
          
          net.propagate(learningRate, data.output);
        } catch (err) {
          console.error(`Error during training sample ${index}:`, err);
          console.error('Input:', data.input);
          throw err;
        }
      });
      
      trainingError /= shuffledTraining.length;
      const trainAccuracy = 1 - trainingError;
      
      // Validation phase
      let validationError = 0;
      let validSamples = 0;
      
      validationSet.forEach((data, index) => {
        try {
          const encodedInput = normalizeAndEncode(data.input);
          const output = net.activate(encodedInput);
          
          if (Number.isFinite(output[0])) {
            validationError += Math.pow(output[0] - data.output[0], 2);
            validSamples++;
          }
        } catch (err) {
          console.error(`Error during validation sample ${index}:`, err);
        }
      });
      
      if (validSamples > 0) {
        validationError /= validSamples;
        const validationAccuracy = 1 - validationError;
        
        // Update both progress tracking systems
        updateModelTrainingProgress(epoch, epochs, trainAccuracy, validationAccuracy);
        updateNewProgress({
          currentEpoch: epoch,
          totalEpochs: epochs,
          trainAccuracy: trainAccuracy,
          validationAccuracy: validationAccuracy,
          isTraining: true,
          currentFold: 0,
          totalFolds: 1,
          configNumber: 0,
          totalConfigs: 0,
          currentConfig: {
            learningRate: 0,
            hiddenLayer1Size: 0,
            hiddenLayer2Size: 0,
            momentum: 0
          }
        });

        // Update model info with current epoch progress
        updateModelInfo({
          training: {
            current_epoch: epoch,
            total_epochs: epochs,
            train_accuracy: trainAccuracy,
            validation_accuracy: validationAccuracy
          }
        });
        
        if (validationError < bestError) {
          bestError = validationError;
          bestNetwork = net.toJSON();
          plateauCount = 0;
          
          updateNewProgress({
            bestAccuracy: validationAccuracy
          });

          // Update model info with best accuracy
          updateModelInfo({
            training: {
              best_accuracy: validationAccuracy
            }
          });
        } else {
          plateauCount++;
          if (plateauCount >= 10) {
            console.log(`Early stopping at epoch ${epoch} due to validation error plateau`);
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error during training:', err);
    throw err;
  }
  
  return {
    error: bestError,
    config,
    network: bestNetwork
  };
}

interface TrainingOptions {
  epochs: number;
  folds: number;
  maxConfigurations: number;
  learningRates: number[];
  hiddenLayer1Sizes: number[];
  hiddenLayer2Sizes: number[];
  momentumValues: number[];
}

const DEFAULT_TRAINING_OPTIONS: TrainingOptions = {
  epochs: 1000,
  folds: 5,
  maxConfigurations: 10,
  learningRates: [0.01, 0.05, 0.1],
  hiddenLayer1Sizes: [16, 24, 32],
  hiddenLayer2Sizes: [8, 12, 16],
  momentumValues: [0.8, 0.9]
};

function testPredictionSpeed(network: any): number {
  const testInput = [1, 1, 20, 0, 0]; // Example input: Monday, January, 20°C, no rain, no event
  const encodedInput = normalizeAndEncode(testInput);
  
  const startTime = performance.now();
  network.activate(encodedInput);
  const endTime = performance.now();
  
  return endTime - startTime;
}

async function autoTrain(options: Partial<TrainingOptions> = {}): Promise<void> {
  console.log('Starting automated training process...');
  
  // Clear previous logs and progress
  clearTrainingLogs();
  clearTrainingProgress();
  
  const trainingOptions = { ...DEFAULT_TRAINING_OPTIONS, ...options };
  
  if (!validateTrainingData(trainingData)) {
    addTrainingLog({
      type: 'error',
      message: 'Invalid training data'
    });
    throw new Error('Invalid training data');
  }
  
  // Generate configurations
  const configs: TrainingConfig[] = [];
  for (const lr of trainingOptions.learningRates) {
    for (const h1 of trainingOptions.hiddenLayer1Sizes) {
      for (const h2 of trainingOptions.hiddenLayer2Sizes) {
        for (const m of trainingOptions.momentumValues) {
          configs.push({
            learningRate: lr,
            hiddenLayer1Size: h1,
            hiddenLayer2Size: h2,
            momentum: m
          });
        }
      }
    }
  }
  
  // Randomly select configurations if we have more than maxConfigurations
  if (configs.length > trainingOptions.maxConfigurations) {
    configs.sort(() => Math.random() - 0.5);
    configs.length = trainingOptions.maxConfigurations;
  }
  
  // Initialize model info for training
  updateModelInfo({
    training: {
      current_epoch: 0,
      total_epochs: trainingOptions.epochs,
      train_accuracy: null,
      validation_accuracy: null,
      best_accuracy: null,
      last_training_session: new Date().toISOString(),
      current_fold: null,
      total_folds: trainingOptions.folds,
      current_config: null
    },
    status: {
      is_trained: false,
      is_training: true,
      last_error: null,
      last_updated: new Date().toISOString()
    }
  });
  
  // Initialize training progress
  initializeTrainingProgress(trainingOptions.epochs, trainingOptions.folds, configs.length);
  
  addTrainingLog({
    type: 'start',
    message: `Starting training with ${configs.length} configurations and ${trainingOptions.folds}-fold cross-validation`
  });
  
  let bestResult: ValidationResult | null = null;
  const totalConfigs = configs.length;
  
  // Cross-validation
  const dataSplits = splitDataset(trainingData, trainingOptions.folds);
  
  try {
    for (let configIndex = 0; configIndex < configs.length; configIndex++) {
      const config = configs[configIndex];
      let totalError = 0;
      let currentTrainAccuracy = 0;
      
      addTrainingLog({
        type: 'progress',
        message: `Starting configuration ${configIndex + 1}/${totalConfigs}`,
        config: {
          learningRate: config.learningRate,
          hiddenLayer1Size: config.hiddenLayer1Size,
          hiddenLayer2Size: config.hiddenLayer2Size,
          momentum: config.momentum || 0
        }
      });
      
      // Update progress tracking
      updateNewProgress({
        currentEpoch: 0,
        totalEpochs: trainingOptions.epochs,
        trainAccuracy: 0,
        validationAccuracy: 0,
        isTraining: true,
        currentFold: 0,
        totalFolds: trainingOptions.folds,
        configNumber: configIndex + 1,
        totalConfigs: configs.length,
        currentConfig: {
          learningRate: config.learningRate,
          hiddenLayer1Size: config.hiddenLayer1Size,
          hiddenLayer2Size: config.hiddenLayer2Size,
          momentum: config.momentum || 0
        }
      });
      
      // Update model info with current training configuration
      updateModelInfo({
        training: {
          current_config: JSON.stringify({
            learningRate: config.learningRate,
            hiddenLayer1Size: config.hiddenLayer1Size,
            hiddenLayer2Size: config.hiddenLayer2Size,
            momentum: config.momentum || 0
          }),
          current_epoch: 0,
          total_epochs: trainingOptions.epochs,
          current_fold: 0,
          total_folds: trainingOptions.folds,
          train_accuracy: null,
          validation_accuracy: null,
          best_accuracy: null,
          last_training_session: new Date().toISOString()
        },
        status: {
          is_trained: false,
          is_training: true,
          last_error: null,
          last_updated: new Date().toISOString()
        }
      });
      
      for (let i = 0; i < trainingOptions.folds; i++) {
        updateNewProgress({
          currentFold: i + 1
        });
        
        // Update model info with current fold
        updateModelInfo({
          training: {
            current_fold: i + 1,
            total_folds: trainingOptions.folds
          }
        });
        
        const validationSet = dataSplits[i];
        const trainingSet = dataSplits.filter((_, index: number) => index !== i).flat();
        
        const result = trainAndValidate(trainingSet, validationSet, config, trainingOptions.epochs);
        totalError += result.error;
        currentTrainAccuracy = 1 - (totalError / (i + 1));
        
        if (!bestResult || result.error < bestResult.error) {
          bestResult = result;
          
          // Save best model
          const modelPath = path.join(process.cwd(), 'ai', 'model.json');
          fs.writeFileSync(modelPath, JSON.stringify(bestResult.network));
          
          const bestAccuracy = Math.min(0.99, (1 / (1 + result.error))); // Sigmoid-like scaling, capped at 99%
          
          // Log best result
          addTrainingLog({
            type: 'best',
            message: `New best model found! Accuracy: ${(bestAccuracy * 100).toFixed(2)}%`,
            config: {
              learningRate: config.learningRate,
              hiddenLayer1Size: config.hiddenLayer1Size,
              hiddenLayer2Size: config.hiddenLayer2Size,
              momentum: config.momentum || 0
            },
            metrics: {
              trainAccuracy: currentTrainAccuracy,
              validationAccuracy: bestAccuracy,
              error: result.error
            }
          });
        }
      }
      
      const averageError = totalError / trainingOptions.folds;
      addTrainingLog({
        type: 'progress',
        message: `Configuration ${configIndex + 1}/${totalConfigs} completed`,
        metrics: {
          error: averageError,
          validationAccuracy: 1 - averageError
        }
      });
    }
    
    if (bestResult) {
      // Test prediction speed
      const network = Network.fromJSON(bestResult.network);
      
      addTrainingLog({
        type: 'complete',
        message: 'Training completed successfully',
        metrics: {
          error: bestResult.error,
          validationAccuracy: 1 - bestResult.error
        }
      });

      // Call finishTraining with the best network and its original config
      const finalConfig = {
        hiddenLayer1Size: bestResult.config.hiddenLayer1Size,
        hiddenLayer2Size: bestResult.config.hiddenLayer2Size,
        learningRate: bestResult.config.learningRate,
        momentum: bestResult.config.momentum,
        validationError: bestResult.error,
        trainAccuracy: 1 - bestResult.error,
        validationAccuracy: 1 - bestResult.error
      };

      console.log('Final network architecture:', {
        inputNeurons: 20,
        hiddenLayer1: finalConfig.hiddenLayer1Size,
        hiddenLayer2: finalConfig.hiddenLayer2Size,
        outputNeurons: 1
      });

      await finishTraining(network, finalConfig);
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    addTrainingLog({
      type: 'error',
      message: `Training error: ${errorMessage}`
    });
    throw err;
  } finally {
    // Always clear progress when done
    updateNewProgress({
      isTraining: false,
      currentEpoch: 0,
      totalEpochs: 0,
      currentFold: 0,
      totalFolds: 0,
      configNumber: 0,
      totalConfigs: 0,
      currentConfig: {
        learningRate: 0,
        hiddenLayer1Size: 0,
        hiddenLayer2Size: 0,
        momentum: 0
      }
    });
  }
}

export { autoTrain };
export type { TrainingOptions };

// Allow running directly from command line with custom options
if (require.main === module) {
  const options: Partial<TrainingOptions> = {
    epochs: parseInt(process.env.EPOCHS || '1000'),
    maxConfigurations: parseInt(process.env.MAX_CONFIGS || '10'),
    folds: parseInt(process.env.FOLDS || '5')
  };
  
  autoTrain(options).catch(console.error);
}

function generateModelInfo(modelConfig: any, modelInfo: any): string {
  const config = modelConfig;
  const info = modelInfo;
  
  return `Neural Network Model for Meal Count Prediction
===========================================

Architecture
-----------
Input Layer: ${config.architecture.input.size} neurons
- Weekday (${config.architecture.input.features.weekday} neurons, one-hot encoded)
- Month (${config.architecture.input.features.month} neurons, one-hot encoded)
- Temperature (${config.architecture.input.features.temperature} neuron, seasonally normalized)
- Rain (${config.architecture.input.features.rain} neuron, binary)
- Event (${config.architecture.input.features.event} neuron, binary)

Hidden Layers:
1. ${config.architecture.hidden[0].size_range[0]}-${config.architecture.hidden[0].size_range[1]} neurons (${config.architecture.hidden[0].activation})
2. ${config.architecture.hidden[1].size_range[0]}-${config.architecture.hidden[1].size_range[1]} neurons (${config.architecture.hidden[1].activation})

Output Layer: ${config.architecture.output.size} neuron (${config.architecture.output.activation})

Training Configuration
--------------------
Learning Rate Range: ${config.training.hyperparameters.learning_rate.min}-${config.training.hyperparameters.learning_rate.max}
Momentum Range: ${config.training.hyperparameters.momentum.min}-${config.training.hyperparameters.momentum.max}
Batch Size: ${config.training.hyperparameters.batch_size}
Maximum Epochs: ${config.training.hyperparameters.epochs}
Early Stopping Patience: ${config.training.early_stopping.patience}
Cross-validation Folds: ${config.training.cross_validation.folds}

Current Performance
-----------------
Best Accuracy: ${info.training.best_accuracy !== null ? (info.training.best_accuracy * 100).toFixed(2) + '%' : 'Not trained'}
Validation Error: ${info.performance.validation_error !== null ? info.performance.validation_error.toFixed(4) : 'Not trained'}
Average Prediction Time: ${info.performance.average_prediction_time !== null ? info.performance.average_prediction_time.toFixed(2) + 'ms' : 'Not measured'}
Total Parameters: ${info.performance.total_parameters !== null ? info.performance.total_parameters.toLocaleString() : 'Not calculated'}

Best Configuration
----------------
${info.performance.best_configuration ? JSON.stringify(JSON.parse(info.performance.best_configuration), null, 2) : 'Not determined'}

Input Ranges
-----------
Weekday: 1-5 (Monday to Friday)
Month: 1-12
Temperature: ${config.preprocessing.features.temperature.ranges[0].min}°C to ${config.preprocessing.features.temperature.ranges[2].max}°C
Rain: Yes/No
Event: Yes/No

Output Range
-----------
Meal Count: ${config.preprocessing.output.range[0]}-${config.preprocessing.output.range[1]}
Rounding Factor: ${config.preprocessing.output.rounding}

Last Updated: ${info.status.last_updated ? new Date(info.status.last_updated).toLocaleString() : 'Never'}
Training Status: ${info.status.is_trained ? 'Trained' : 'Not trained'}

Notes
-----
- Model uses seasonal temperature normalization for better accuracy
- Early stopping prevents overfitting
- Cross-validation ensures robust performance
- Momentum-based learning for faster convergence
- Predictions are rounded to nearest ${config.preprocessing.output.rounding} meals
`;
}

async function updateModelInfoFile(): Promise<void> {
  try {
    const modelConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'ai', 'model-config.json'), 'utf8'));
    const modelInfo = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'ai', 'model-info.json'), 'utf8'));
    const infoText = generateModelInfo(modelConfig, modelInfo);
    fs.writeFileSync(path.join(process.cwd(), 'ai', 'Model.info.txt'), infoText);
  } catch (error) {
    console.error('Error updating Model.info.txt:', error);
  }
}

// Call this after training completes
export async function finishTraining(bestNetwork: any, bestConfig: any): Promise<void> {
  try {
    // Calculate metrics
    const predictionTime = testPredictionSpeed(bestNetwork);
    const totalParams = calculateTotalParameters(bestConfig);
    const memoryUsage = calculateMemoryUsage(bestConfig);
    const timestamp = new Date().toISOString();
    const bestAccuracy = bestConfig.validationAccuracy || (1 - bestConfig.validationError) || 0;

    console.log('Debug metrics:', {
      totalParams,
      memoryUsage,
      predictionTime,
      bestAccuracy,
      config: bestConfig
    });

    const updates = {
      status: {
        is_trained: true,
        is_training: false,
        last_updated: timestamp,
        last_error: null
      },
      performance: {
        best_configuration: JSON.stringify(bestConfig),
        total_parameters: totalParams,
        average_prediction_time: predictionTime,
        validation_error: bestConfig.validationError || 0,
        memory_usage: memoryUsage,
        best_accuracy: bestAccuracy,
        last_training_session: timestamp
      },
      training: {
        current_config: JSON.stringify({
          learningRate: bestConfig.learningRate,
          hiddenLayer1Size: bestConfig.hiddenLayer1Size,
          hiddenLayer2Size: bestConfig.hiddenLayer2Size,
          momentum: bestConfig.momentum
        }),
        train_accuracy: bestConfig.trainAccuracy || 0,
        validation_accuracy: bestConfig.validationAccuracy || 0,
        best_accuracy: bestAccuracy,
        last_training_session: timestamp
      }
    };
    
    updateModelInfo(updates);
    await updateModelInfoFile();
    
    console.log('Training completed successfully');
  } catch (error) {
    console.error('Error finishing training:', error);
    throw error;
  }
}

function calculateTotalParameters(config: TrainingConfig): number {
  const inputNeurons = 20;
  const hiddenLayer1 = config.hiddenLayer1Size;
  const hiddenLayer2 = config.hiddenLayer2Size;
  const outputNeurons = 1;
  const weights = (inputNeurons * hiddenLayer1) + 
                 (hiddenLayer1 * hiddenLayer2) + 
                 (hiddenLayer2 * outputNeurons);
  const biases = hiddenLayer1 + hiddenLayer2 + outputNeurons;
  return weights + biases;
}

function calculateMemoryUsage(config: TrainingConfig): number {
  const totalParams = calculateTotalParameters(config);
  const BYTES_PER_PARAMETER = 4;
  const OVERHEAD_BYTES = 1024;
  const totalMemoryBytes = (totalParams * BYTES_PER_PARAMETER) + OVERHEAD_BYTES;
  return totalMemoryBytes;
}
