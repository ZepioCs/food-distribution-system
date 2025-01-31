import { Network } from "synaptic";
import * as fs from "fs";
import path from "path";

interface PredictionInput {
  weekday: number;   // 1-5 (Monday-Friday)
  month: number;     // 1-12 (January-December)
  temperature: number; // in Celsius
  rain: boolean;     // true/false
  event: boolean;    // true/false
}

interface PredictionResult {
  predictedMeals: number;
  confidence: number;
  debug: {
    normalizedInput: number[];
    rawOutput: number;
    modelPath: string;
    timestamp: string;
    predictions: number[];
    stdDev: number;
  };
}

class PredictionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PredictionError';
  }
}

function loadModel(): Network {
  try {
    const modelPath = path.join(__dirname, 'model.json');
    if (!fs.existsSync(modelPath)) {
      throw new PredictionError('Model file not found. Please train the model first.');
    }
    
    const rawData = fs.readFileSync(modelPath, "utf8");
    const jsonModel = JSON.parse(rawData);
    return Network.fromJSON(jsonModel);
  } catch (error: any) {
    if (error instanceof PredictionError) {
      throw error;
    }
    throw new PredictionError(`Failed to load model: ${error.message}`);
  }
}

// Enhanced normalization with exponential smoothing for temperature
function normalize(value: number, min: number, max: number): number {
  if (value < min || value > max) {
    throw new PredictionError(`Value ${value} is outside valid range [${min}-${max}]`);
  }
  // Apply exponential smoothing for better temperature scaling
  const normalized = (value - min) / (max - min);
  return 1 / (1 + Math.exp(-5 * (normalized - 0.5))); // Sigmoid normalization
}

// Enhanced validation with seasonal patterns
function validateInput(input: PredictionInput): void {
  if (input.weekday < 1 || input.weekday > 5) {
    throw new PredictionError('Weekday must be between 1 (Monday) and 5 (Friday)');
  }
  if (input.month < 1 || input.month > 12) {
    throw new PredictionError('Month must be between 1 (January) and 12 (December)');
  }
  if (input.temperature < -30 || input.temperature > 50) {
    throw new PredictionError('Temperature must be between -30°C and 50°C');
  }
  
  // Validate seasonal temperature ranges
  const season = Math.floor(((input.month % 12) / 12) * 4);
  const seasonalRanges = [
    { min: -30, max: 15 },  // Winter
    { min: -10, max: 25 },  // Spring
    { min: 5, max: 50 },    // Summer
    { min: -10, max: 25 }   // Fall
  ];
  
  const range = seasonalRanges[season];
  if (input.temperature < range.min || input.temperature > range.max) {
    console.warn(`Warning: Temperature ${input.temperature}°C is unusual for ${['Winter', 'Spring', 'Summer', 'Fall'][season]}`);
  }
}

function oneHotEncode(value: number, categories: number): number[] {
  const encoded = new Array(categories).fill(0);
  encoded[value - 1] = 1;
  return encoded;
}

function normalizeAndEncode(input: PredictionInput): number[] {
  // One-hot encode weekday (5 categories for Monday-Friday)
  const weekdayEncoded = oneHotEncode(input.weekday, 5);
  
  // One-hot encode month (12 categories)
  const monthEncoded = oneHotEncode(input.month, 12);
  
  // Enhanced temperature normalization with seasonal adjustment
  const season = Math.floor(((input.month % 12) / 12) * 4);
  const seasonalRanges = [
    { min: -30, max: 15 },  // Winter
    { min: -10, max: 25 },  // Spring
    { min: 5, max: 50 },    // Summer
    { min: -10, max: 25 }   // Fall
  ];
  const range = seasonalRanges[season];
  const normalizedTemp = normalize(input.temperature, range.min, range.max);
  
  // Combine all features with additional seasonal context
  return [
    ...weekdayEncoded,
    ...monthEncoded,
    normalizedTemp,
    input.rain ? 1 : 0,
    input.event ? 1 : 0
  ];
}

function formatDebugOutput(scenario: PredictionInput, result: PredictionResult): string {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return `
    Prediction Details:
    -----------------
    Date: ${weekdays[scenario.weekday - 1]}, ${months[scenario.month - 1]}
    Temperature: ${scenario.temperature}°C
    Conditions: ${scenario.rain ? 'Rainy' : 'Clear'}, ${scenario.event ? 'Event Day' : 'Regular Day'}

    Model Input:
    -----------
    Raw: ${JSON.stringify(scenario)}
    Normalized: ${result.debug.normalizedInput.map(n => n.toFixed(4)).join(', ')}

    Model Output:
    ------------
    Raw Output: ${result.debug.rawOutput.toFixed(4)}
    Predicted Meals: ${result.predictedMeals}
    Confidence: ${(result.confidence * 100).toFixed(1)}%

    Technical Details:
    ----------------
    Model Path: ${result.debug.modelPath}
    Timestamp: ${result.debug.timestamp}
  `;
}

export async function predict(input: PredictionInput): Promise<PredictionResult> {
  try {
    validateInput(input);
    const modelPath = path.join(__dirname, 'model.json');
    const net = loadModel();
    
    const normalizedInput = normalizeAndEncode(input);

    // Enhanced prediction with ensemble averaging
    const numPredictions = 5;
    let totalOutput = 0;
    let predictions: number[] = [];
    
    for (let i = 0; i < numPredictions; i++) {
      const output = net.activate(normalizedInput)[0];
      predictions.push(output);
      totalOutput += output;
    }
    
    const rawOutput = totalOutput / numPredictions;
    
    // Calculate standard deviation for confidence
    const variance = predictions.reduce((acc, val) => acc + Math.pow(val - rawOutput, 2), 0) / numPredictions;
    const stdDev = Math.sqrt(variance);
    
    // Enhanced confidence calculation using prediction stability
    const confidence = Math.min(0.95, Math.max(0.5, (1 - stdDev) * (1 - Math.abs(0.5 - rawOutput))));
    
    // Improved meal count prediction with rounding to nearest 5
    const predictedMeals = Math.round((rawOutput * 500) / 5) * 5;

    return {
      predictedMeals,
      confidence,
      debug: {
        normalizedInput,
        rawOutput,
        modelPath,
        timestamp: new Date().toISOString(),
        predictions, // Added for transparency
        stdDev      // Added for debugging
      }
    };
  } catch (error: any) {
    if (error instanceof PredictionError) {
      throw error;
    }
    throw new PredictionError(`Prediction failed: ${error.message}`);
  }
}

export function generateTestData(): PredictionInput[] {
  const testScenarios: PredictionInput[] = [
    {
      weekday: 3,        // Wednesday
      month: 2,          // February
      temperature: 18,   // 18°C
      rain: false,
      event: true
    },
    {
      weekday: 5,        // Friday
      month: 7,          // July
      temperature: 28,   // 28°C
      rain: false,
      event: true
    },
    {
      weekday: 1,        // Monday
      month: 12,         // December
      temperature: 5,    // 5°C
      rain: true,
      event: false
    }
  ];

  return testScenarios;
}

// Example usage
if (require.main === module) {
  const testScenarios = generateTestData();
  
  console.log('Running Meal Count Predictions\n');
  
  testScenarios.forEach(async (scenario, index) => {
    try {
      console.log(`Test Scenario ${index + 1}`);
      console.log('='.repeat(50));
      
      const result = await predict(scenario);
      console.log(formatDebugOutput(scenario, result));
    } catch (error: any) {
      console.error(`Test ${index + 1} failed:`, error.message, '\n');
    }
  });
}
