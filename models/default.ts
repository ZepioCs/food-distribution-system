import { Layer, Network, Neuron } from 'synaptic';

interface IMeal {
    id: number;
    name: string;
    price: number;
    description: string;
    image: string;
    category?: string;
    type: number;
}

interface ICategory {
    id: number;
    name: string;
}

interface IProfile {
    id: string;
    user_id: string;
    username: string;
    email: string;
    role: EUserRole;
    created_at: string;
    options: IOptions;
    avatar_url?: string;
    dietary_preferences?: {
        vegetarian: boolean;
        vegan: boolean;
        gluten_free: boolean;
        dairy_free: boolean;
        nut_free: boolean;
    };
    is_approved: boolean;
}

interface IOptions {
    autoLogout: boolean;
    enableNotifications: boolean;
    enableDarkMode: boolean;
}

interface IPrediction {
    id: number;
    breakfast: number;
    lunch: number;
    dinner: number;
    date: Date;
}

interface IMealHistory {
    id: number;
    meal_id: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    date: string;
    quantity: number;
    cost: number;
    meal?: IMeal;
}

interface INotification {
    id: number;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    read: boolean;
    created_at: string;
}

enum EUserRole {
    TEACHER = "teacher",
    FOOD_PROVIDER = "food_provider",
    ADMIN = "admin",
}

interface IFeedback {
    id: number;
    user_id: string;
    message: string;
    resolved: boolean;
    created_at: string;
}

interface IRegisterRequest {
    id: string;
    email: string;
    username: string;
    role: string;
    user_id: string;
    created_at: string;
}

interface ModelInfo {
  architecture: {
    inputLayer: {
      total: number;
      weekday: number;
      month: number;
      temperature: number;
      rain: number;
      event: number;
    };
    hiddenLayers: {
      layer1Range: [number, number];
      layer2Range: [number, number];
    };
    outputLayer: number;
  };
  training: {
    current_config: string | null;
    current_epoch: number | null;
    total_epochs: number | null;
    current_fold: number | null;
    total_folds: number | null;
    train_accuracy: number | null;
    validation_accuracy: number | null;
    best_accuracy: number | null;
    last_training_session: string | null;
  };
  preprocessing: {
    weekday: string;
    month: string;
    temperature: string;
    rain: string;
    event: string;
  };
  features: string[];
  performance: {
    best_configuration: string | null;
    validation_error: number | null;
    average_prediction_time: number | null;
    total_parameters: number | null;
    memory_usage: number | null;
    best_accuracy: number | null;
    last_training_session: string | null;
  };
  usage: {
    inputRanges: {
      weekday: [number, number];
      month: [number, number];
      temperature: [number, number];
      rain: string;
      event: string;
    };
    outputRange: [number, number];
    roundingFactor: number;
  };
  limitations: string[];
  status: {
    is_trained: boolean;
    is_training: boolean;
    last_error: string | null;
    last_updated: string | null;
  };
}

interface TrainingDataPoint {
  input: number[];
  output: number[];
}

interface TrainingConfig {
  learningRate: number;
  hiddenLayer1Size: number;
  hiddenLayer2Size: number;
  momentum?: number;
}

interface ValidationResult {
  error: number;
  config: TrainingConfig;
  network: any;
}

interface NetworkLayer extends Layer {
  neurons(): Neuron[];
}

interface NeuralNetwork extends Network {
  layers: {
    input: NetworkLayer;
    hidden: NetworkLayer[];
    output: NetworkLayer;
  };
}

export { EUserRole }
export type { IMeal, ICategory, IProfile, IOptions, IPrediction, IMealHistory, INotification, IFeedback, IRegisterRequest, ModelInfo, TrainingDataPoint, TrainingConfig, ValidationResult, NetworkLayer, NeuralNetwork };