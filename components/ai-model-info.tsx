'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  InfoIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  BrainCircuitIcon,
  NetworkIcon,
  BarChart4Icon,
  Settings2Icon,
  ClockIcon,
  ActivityIcon,
  LayersIcon,
  ThermometerIcon,
  CalendarIcon,
  CloudRainIcon,
  PartyPopperIcon,
  AlertCircleIcon,
  GaugeIcon,
  Brain,
  Activity,
  Settings,
  Zap,
  Database,
  Clock,
  ScrollTextIcon,
  PlayIcon,
  TrophyIcon,
  FilterIcon,
  PercentIcon,
  Download,
  Play,
  Square
} from "lucide-react";
import { getModelInfo } from "@/app/actions/get-model-info";
import { getTrainingProgressAction } from '@/app/actions/get-training-progress';
import { getTrainingLogsAction } from '@/app/actions/get-training-logs';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

interface ModelMetrics {
  trainAccuracy: number | null;
  validationAccuracy: number | null;
  bestAccuracy: number | null;
  currentEpoch: number | null;
  totalEpochs: number | null;
  lastTrainingSession: string | null;
  predictionTime: number | null;
}

interface TrainingConfig {
  learningRate: number;
  hiddenLayer1Size: number;
  hiddenLayer2Size: number;
  momentum: number;
}

interface TrainingProgress {
  isTraining: boolean;
  configNumber: number;
  totalConfigs: number;
  currentFold: number;
  totalFolds: number;
  currentConfig: TrainingConfig | null;
  currentEpoch: number;
  totalEpochs: number;
  trainAccuracy: number;
  validationAccuracy: number;
  bestAccuracy: number;
}

interface TrainingLogEntry {
  timestamp?: string;  // Make timestamp optional
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

const formatAccuracy = (value: number | null) => {
  if (value === null) return 'N/A';
  // Handle both 0-1 range and percentage inputs
  const normalizedValue = value > 1 ? value / 100 : value;
  return `${(normalizedValue * 100).toFixed(2)}%`;
};

const formatDate = (timestamp: string | undefined | null): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString();
};

const POLLING_INTERVAL = 1000; // 1 second for active training
const IDLE_POLLING_INTERVAL = 5000; // 5 seconds when not training

const AIModelInfo: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<ModelMetrics>({
    trainAccuracy: null,
    validationAccuracy: null,
    bestAccuracy: null,
    currentEpoch: null,
    totalEpochs: null,
    lastTrainingSession: null,
    predictionTime: null
  });
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLogEntry[]>([]);
  const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'start' | 'progress' | 'best' | 'complete' | 'error'>('all');
  const [minAccuracy, setMinAccuracy] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [isNewestFirst, setIsNewestFirst] = useState(true);
  const [isTrainingEnabled, setIsTrainingEnabled] = useState(false);

  // Filter logs based on selected criteria
  const filteredLogs = useMemo(() => {
    return trainingLogs.filter(log => {
      // Filter by type
      if (logTypeFilter !== 'all' && log.type !== logTypeFilter) {
        return false;
      }

      // Filter by accuracy
      if (minAccuracy !== null) {
        const accuracy = log.metrics?.validationAccuracy;
        if (!accuracy || accuracy * 100 < minAccuracy) {
          return false;
        }
      }

      // Filter by time
      if (timeFilter !== 'all') {
        const logDate = log.timestamp ? new Date(log.timestamp) : new Date();
        const now = new Date();
        const diff = now.getTime() - logDate.getTime();
        const hours = diff / (1000 * 60 * 60);

        switch (timeFilter) {
          case '1h':
            if (hours > 1) return false;
            break;
          case '24h':
            if (hours > 24) return false;
            break;
          case '7d':
            if (hours > 24 * 7) return false;
            break;
          case '30d':
            if (hours > 24 * 30) return false;
            break;
        }
      }

      return true;
    });
  }, [trainingLogs, logTypeFilter, minAccuracy, timeFilter]);

  useEffect(() => {
    let modelInfoInterval: NodeJS.Timeout;
    let trainingProgressInterval: NodeJS.Timeout;
    let trainingLogsInterval: NodeJS.Timeout;
    let isComponentMounted = true;

    const fetchData = async () => {
      try {
        const [progress, logs] = await Promise.all([
          getTrainingProgressAction(),
          getTrainingLogsAction()
        ]);

        if (!isComponentMounted) return;

        setTrainingProgress(progress);
        setTrainingLogs(logs);

        // Determine if training is active
        const isTraining = progress?.isTraining ?? false;

        // Update polling intervals based on training status
        clearInterval(trainingProgressInterval);
        clearInterval(trainingLogsInterval);

        trainingProgressInterval = setInterval(
          () => getTrainingProgressAction().then(p => isComponentMounted && setTrainingProgress(p)),
          isTraining ? POLLING_INTERVAL : IDLE_POLLING_INTERVAL
        );

        trainingLogsInterval = setInterval(
          () => getTrainingLogsAction().then(l => isComponentMounted && setTrainingLogs(l)),
          isTraining ? POLLING_INTERVAL : IDLE_POLLING_INTERVAL
        );

        if (progress) {
          setMetrics(prev => ({
            ...prev,
            currentEpoch: progress.currentEpoch,
            totalEpochs: progress.totalEpochs,
            trainAccuracy: progress.trainAccuracy,
            validationAccuracy: progress.validationAccuracy,
            bestAccuracy: Math.max(prev.bestAccuracy || 0, progress.bestAccuracy),
            lastTrainingSession: progress.isTraining ? new Date().toISOString() : prev.lastTrainingSession
          }));
        }
      } catch (err) {
        console.error('Error fetching training data:', err);
        if (isComponentMounted) {
          setError('Failed to load training data');
        }
      }
    };

    const fetchModelInfo = async () => {
      try {
        const info = await getModelInfo();
        if (!isComponentMounted) return;

        if (info) {
          setModelInfo(info);
          setMetrics(prev => ({
            ...prev,
            bestAccuracy: info.performance.best_accuracy !== undefined ? info.performance.best_accuracy : 
            info.performance.validation_error !== undefined && info.performance.validation_error !== null ? 1 - info.performance.validation_error : null,
            lastTrainingSession: info.performance.last_training_session || null,
            predictionTime: info.performance.average_prediction_time || null
          }));
        } else {
          setError('Failed to load model information');
        }
      } catch (err) {
        console.error('Error fetching model info:', err);
        if (isComponentMounted) {
          setError('Failed to load model information');
        }
      } finally {
        if (isComponentMounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();
    fetchModelInfo();

    // Set up polling for model info (less frequent)
    modelInfoInterval = setInterval(fetchModelInfo, IDLE_POLLING_INTERVAL);

    return () => {
      isComponentMounted = false;
      clearInterval(modelInfoInterval);
      clearInterval(trainingProgressInterval);
      clearInterval(trainingLogsInterval);
    };
  }, []);

  const handleStartTraining = async () => {
    try {
      setIsTrainingEnabled(true);
      const response = await fetch('/api/ai/train', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to start training');
      }
    } catch (error) {
      console.error('Error starting training:', error);
      setError('Failed to start training');
    }
  };

  const handleStopTraining = async () => {
    try {
      setIsTrainingEnabled(false);
      const response = await fetch('/api/ai/train/stop', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to stop training');
      }
    } catch (error) {
      console.error('Error stopping training:', error);
      setError('Failed to stop training');
    }
  };

  const handleExportModel = async () => {
    try {
      const response = await fetch('/api/ai/model/export');
      if (!response.ok) {
        throw new Error('Failed to export model');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'model-export.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting model:', error);
      setError('Failed to export model');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-lg font-medium">Loading Model Information...</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-1/4 bg-muted rounded" />
            <div className="h-8 w-3/4 bg-muted rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!modelInfo) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-lg font-medium">Loading Model Information...</p>
        </div>
      </Card>
    );
  }

  const modelAccuracy = modelInfo.performance.validation_error !== null
    ? 1 - modelInfo.performance.validation_error 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BrainCircuitIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">AI Model Dashboard</h1>
            <p className="text-muted-foreground">Monitor and analyze your AI model's performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!trainingProgress?.isTraining ? (
            <Button
              onClick={handleStartTraining}
              disabled={isTrainingEnabled}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Training
            </Button>
          ) : (
            <Button
              onClick={handleStopTraining}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Training
            </Button>
          )}
          <Button
            onClick={handleExportModel}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!modelInfo?.status.is_trained}
          >
            <Download className="h-4 w-4" />
            Export Model
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Model Accuracy</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{formatAccuracy(modelAccuracy)}</div>
              <Progress value={modelAccuracy ? modelAccuracy * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Overall validated accuracy across all cross-validation folds
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.currentEpoch !== null && metrics.totalEpochs !== null ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-medium">
                      {metrics.currentEpoch}/{metrics.totalEpochs}
                    </span>
                  </div>
                  <Progress 
                    value={(metrics.currentEpoch / metrics.totalEpochs) * 100} 
                    className="h-2"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Training</span>
                      <div className="text-lg font-bold">
                        {formatAccuracy(metrics.trainAccuracy)}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Validation</span>
                      <div className="text-lg font-bold">
                        {formatAccuracy(metrics.validationAccuracy)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Not currently training</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Architecture</CardTitle>
            <NetworkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Input Features</span>
                <span className="text-lg font-bold">{modelInfo.architecture.inputLayer.total}</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hidden Layers</span>
                  <span className="text-lg font-bold">{Object.keys(modelInfo.architecture.hiddenLayers).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Layer Sizes</span>
                  <span className="text-lg font-bold">
                    {modelInfo.architecture.hiddenLayers.layer1Range[0]}/{modelInfo.architecture.hiddenLayers.layer2Range[0]}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Output Layers</span>
                <span className="text-lg font-bold">{modelInfo.architecture.outputLayer}</span>
              </div>
            </div>
          </CardContent>

        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediction Range</CardTitle>
            <GaugeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {modelInfo.usage.outputRange[0]}-{modelInfo.usage.outputRange[1]}
              </div>
              <p className="text-xs text-muted-foreground">
                Meals per day (±{modelInfo.usage.roundingFactor})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {trainingProgress?.isTraining && (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse" />
              Training in Progress
            </CardTitle>
            <CardDescription>
              Configuration {trainingProgress.configNumber}/{trainingProgress.totalConfigs},
              Fold {trainingProgress.currentFold}/{trainingProgress.totalFolds}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Current Configuration</span>
                  <span>
                    LR: {trainingProgress.currentConfig?.learningRate?.toFixed(4) ?? 'N/A'},
                    H1: {trainingProgress.currentConfig?.hiddenLayer1Size ?? 'N/A'},
                    H2: {trainingProgress.currentConfig?.hiddenLayer2Size ?? 'N/A'},
                    M: {trainingProgress.currentConfig?.momentum?.toFixed(2) ?? 'N/A'}
                  </span>
                </div>
                <Progress 
                  value={(trainingProgress.configNumber / trainingProgress.totalConfigs) * 100}
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Current Epoch</span>
                  <span>{trainingProgress.currentEpoch}/{trainingProgress.totalEpochs}</span>
                </div>
                <Progress 
                  value={(trainingProgress.currentEpoch / trainingProgress.totalEpochs) * 100}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Training Accuracy</span>
                  <div className="text-2xl font-bold">
                    {formatAccuracy(trainingProgress.trainAccuracy)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Validation Accuracy</span>
                  <div className="text-2xl font-bold">
                    {formatAccuracy(trainingProgress.validationAccuracy)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="architecture" className="flex items-center gap-2">
            <NetworkIcon className="h-4 w-4" />
            Architecture
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <BarChart4Icon className="h-4 w-4" />
            Training
          </TabsTrigger>
          <TabsTrigger value="training-logs" className="flex items-center gap-2">
            <ScrollTextIcon className="h-4 w-4" />
            Training Logs
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Settings2Icon className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="limitations" className="flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4" />
            Limitations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Overview</CardTitle>
              <CardDescription>Neural network model for meal count prediction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Input Features</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        <span>Weekday ({modelInfo.architecture.inputLayer.weekday} neurons)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-green-500" />
                        <span>Month ({modelInfo.architecture.inputLayer.month} neurons)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThermometerIcon className="h-4 w-4 text-red-500" />
                        <span>Temperature ({modelInfo.architecture.inputLayer.temperature} neuron)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CloudRainIcon className="h-4 w-4 text-blue-500" />
                        <span>Rain ({modelInfo.architecture.inputLayer.rain} neuron)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PartyPopperIcon className="h-4 w-4 text-yellow-500" />
                        <span>Event ({modelInfo.architecture.inputLayer.event} neuron)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Performance & Resources</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TrophyIcon className="h-4 w-4 text-yellow-500" />
                        <span>Best Accuracy: {formatAccuracy(modelInfo.performance.best_accuracy)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>Average Prediction: {modelInfo.performance.average_prediction_time?.toFixed(2)}ms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        <span>Parameters: {modelInfo.performance.total_parameters?.toLocaleString() || 'Not calculated'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-500" />
                        <span>Memory Usage: {modelInfo.performance.memory_usage ? `${modelInfo.performance.memory_usage.toFixed(2)}MB` : 'Not measured'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-green-500" />
                        <span>Configuration: {modelInfo.performance.best_configuration ? 
                          `LR=${JSON.parse(modelInfo.performance.best_configuration).learningRate}, M=${JSON.parse(modelInfo.performance.best_configuration).momentum}` 
                          : 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Neural Network Architecture</CardTitle>
              <CardDescription>Detailed structure of the model's neural network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <LayersIcon className="h-5 w-5 text-primary" />
                    Layer Structure
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Layer</TableHead>
                        <TableHead>Neurons</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Input Layer</TableCell>
                        <TableCell>{modelInfo.architecture.inputLayer.total}</TableCell>
                        <TableCell>Feature inputs</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Hidden Layer 1</TableCell>
                        <TableCell>{modelInfo.architecture.hiddenLayers.layer1Range[0]}-{modelInfo.architecture.hiddenLayers.layer1Range[1]}</TableCell>
                        <TableCell>Variable size based on configuration</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Hidden Layer 2</TableCell>
                        <TableCell>{modelInfo.architecture.hiddenLayers.layer2Range[0]}-{modelInfo.architecture.hiddenLayers.layer2Range[1]}</TableCell>
                        <TableCell>Variable size based on configuration</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Output Layer</TableCell>
                        <TableCell>{modelInfo.architecture.outputLayer}</TableCell>
                        <TableCell>Predicted meal count (scaled 0-1)</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Configuration</CardTitle>
              <CardDescription>Model training parameters and preprocessing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold">Training Parameters</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Best Configuration</TableCell>
                        <TableCell>{modelInfo.performance.best_configuration ? JSON.parse(modelInfo.performance.best_configuration).learningRate : 'Not set'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Total Epochs</TableCell>
                        <TableCell>{modelInfo.training.total_epochs || 'Not set'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Cross-validation</TableCell>
                        <TableCell>{modelInfo.training.total_folds}-fold</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Data Preprocessing</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Weekday</TableCell>
                        <TableCell>{modelInfo.preprocessing.weekday}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Month</TableCell>
                        <TableCell>{modelInfo.preprocessing.month}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Temperature</TableCell>
                        <TableCell>{modelInfo.preprocessing.temperature}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Rain</TableCell>
                        <TableCell>{modelInfo.preprocessing.rain}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Event</TableCell>
                        <TableCell>{modelInfo.preprocessing.event}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Progress</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.currentEpoch !== null && metrics.totalEpochs !== null ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">
                        {metrics.currentEpoch}/{metrics.totalEpochs}
                      </span>
                    </div>
                    <Progress 
                      value={(metrics.currentEpoch / metrics.totalEpochs) * 100} 
                      className="h-2"
                    />
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Training</span>
                        <div className="text-lg font-bold">
                          {formatAccuracy(metrics.trainAccuracy)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Validation</span>
                        <div className="text-lg font-bold">
                          {formatAccuracy(metrics.validationAccuracy)}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Not currently training</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Performance</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {formatAccuracy(metrics.bestAccuracy)}
                </div>
                {metrics.bestAccuracy && (
                  <Progress 
                    value={metrics.bestAccuracy * 100} 
                    className="h-2"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Best accuracy achieved during training
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {metrics.lastTrainingSession 
                    ? new Date(metrics.lastTrainingSession).toLocaleString()
                    : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last training session completed
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training-logs" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ScrollTextIcon className="h-5 w-5" />
                        Training History
                    </CardTitle>
                    <CardDescription>
                        Recent training events and progress
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4 pb-4">
                            <div className="flex items-center gap-2">
                                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                                <Select
                                    value={logTypeFilter}
                                    onValueChange={(value) => setLogTypeFilter(value as 'all' | 'start' | 'progress' | 'best' | 'complete' | 'error')}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select event type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            <span className="flex items-center gap-2">
                                                <FilterIcon className="h-4 w-4" />
                                                All Events
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="start">Start</SelectItem>
                                        <SelectItem value="progress">Progress</SelectItem>
                                        <SelectItem value="best">Best</SelectItem>
                                        <SelectItem value="complete">Complete</SelectItem>
                                        <SelectItem value="error">Error</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <PercentIcon className="h-4 w-4 text-muted-foreground" />
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="w-[100px]"
                                        placeholder="Min %"
                                        value={minAccuracy === null ? '' : minAccuracy}
                                        onChange={(e) => setMinAccuracy(e.target.value ? parseFloat(e.target.value) : null)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                                <Select
                                    value={timeFilter}
                                    onValueChange={setTimeFilter}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select time range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Time</SelectItem>
                                        <SelectItem value="1h">Last Hour</SelectItem>
                                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                                        <SelectItem value="7d">Last 7 Days</SelectItem>
                                        <SelectItem value="30d">Last 30 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                <Switch
                                    id="sort-order"
                                    checked={isNewestFirst}
                                    onCheckedChange={setIsNewestFirst}
                                    className="data-[state=checked]:bg-primary"
                                />
                                <Label htmlFor="sort-order" className="text-sm">
                                    {isNewestFirst ? 'Newest First' : 'Oldest First'}
                                </Label>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto space-y-4">
                            {[...trainingLogs]
                                .filter(log => {
                                    // Apply type filter
                                    if (logTypeFilter !== 'all' && log.type !== logTypeFilter) {
                                        return false;
                                    }

                                    // Apply accuracy filter
                                    if (minAccuracy !== null) {
                                        const accuracy = log.metrics?.validationAccuracy;
                                        if (!accuracy || accuracy * 100 < minAccuracy) {
                                            return false;
                                        }
                                    }

                                    // Apply time filter
                                    if (timeFilter !== 'all' && log.timestamp) {
                                        const logDate = new Date(log.timestamp);
                                        const now = new Date();
                                        const diff = now.getTime() - logDate.getTime();
                                        const hours = diff / (1000 * 60 * 60);

                                        switch (timeFilter) {
                                            case '1h':
                                                if (hours > 1) return false;
                                                break;
                                            case '24h':
                                                if (hours > 24) return false;
                                                break;
                                            case '7d':
                                                if (hours > 24 * 7) return false;
                                                break;
                                            case '30d':
                                                if (hours > 24 * 30) return false;
                                                break;
                                        }
                                    }

                                    return true;
                                })
                                .sort((a, b) => {
                                    const timeA = new Date(a.timestamp || 0).getTime();
                                    const timeB = new Date(b.timestamp || 0).getTime();
                                    return isNewestFirst ? timeB - timeA : timeA - timeB;
                                })
                                .map((log, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "p-4 rounded-lg border",
                                        log.type === 'error' && "bg-destructive/10 border-destructive/20",
                                        log.type === 'best' && "bg-green-500/10 border-green-500/20",
                                        log.type === 'complete' && "bg-blue-500/10 border-blue-500/20"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {log.type === 'start' && <PlayIcon className="h-4 w-4 text-blue-500" />}
                                            {log.type === 'progress' && <ActivityIcon className="h-4 w-4 text-yellow-500" />}
                                            {log.type === 'best' && <TrophyIcon className="h-4 w-4 text-green-500" />}
                                            {log.type === 'complete' && <CheckCircleIcon className="h-4 w-4 text-blue-500" />}
                                            {log.type === 'error' && <AlertTriangleIcon className="h-4 w-4 text-destructive" />}
                                            <span className="font-medium">{log.message}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDate(log.timestamp || '')}
                                        </span>
                                    </div>
                                    

                                    {log.config && (
                                        <div className="text-sm text-muted-foreground mt-2">
                                            Configuration: LR={log.config.learningRate?.toFixed(4) ?? 'N/A'}, 
                                            H1={log.config.hiddenLayer1Size ?? 'N/A'}, 
                                            H2={log.config.hiddenLayer2Size ?? 'N/A'}, 
                                            M={log.config.momentum?.toFixed(2) ?? 'N/A'}
                                        </div>
                                    )}
                                    
                                    {log.metrics && (
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            {log.metrics.trainAccuracy !== undefined && (
                                                <div>
                                                    <span className="text-sm text-muted-foreground">Training Accuracy</span>
                                                    <div className="font-medium">{formatAccuracy(log.metrics.trainAccuracy)}</div>
                                                </div>
                                            )}
                                            {log.metrics.validationAccuracy !== undefined && (
                                                <div>
                                                    <span className="text-sm text-muted-foreground">Validation Accuracy</span>
                                                    <div className="font-medium">{formatAccuracy(log.metrics.validationAccuracy)}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {filteredLogs.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No logs match the current filters
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Features</CardTitle>
              <CardDescription>Key features and capabilities of the model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-4">Core Features</h3>
                  <div className="space-y-2">
                    {modelInfo.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Input Ranges</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Weekday</TableCell>
                        <TableCell>{modelInfo.usage.inputRanges.weekday[0]}-{modelInfo.usage.inputRanges.weekday[1]} (Mon-Fri)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Month</TableCell>
                        <TableCell>{modelInfo.usage.inputRanges.month[0]}-{modelInfo.usage.inputRanges.month[1]}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Temperature</TableCell>
                        <TableCell>{modelInfo.usage.inputRanges.temperature[0]}°C to {modelInfo.usage.inputRanges.temperature[1]}°C</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Rain</TableCell>
                        <TableCell>{modelInfo.usage.inputRanges.rain}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Event</TableCell>
                        <TableCell>{modelInfo.usage.inputRanges.event}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Limitations</CardTitle>
              <CardDescription>Known limitations and constraints of the model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelInfo.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p>{limitation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircleIcon className="h-3 w-3 text-green-500" />
            <span>Model Ready</span>
          </Badge>
          {metrics.predictionTime !== null && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{metrics.predictionTime.toFixed(2)}ms inference</span>
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {formatDate(modelInfo.status.last_updated)}
        </div>
      </div>
    </div>
  );
};

export default AIModelInfo; 