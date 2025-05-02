import * as fs from 'fs';
import * as path from 'path';
import { MultivariateLinearRegression } from 'ml-regression';

const MODEL_DIR = path.join(process.cwd(), 'public', 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'churn-model.json');

interface TrainingData {
  inputs: number[][];
  outputs: number[];
}

export interface ChurnPredictionInput {
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
}

interface FeatureStats {
  daysSinceActivity: { max: number; min: number; mean: number };
  eventsLast30: { max: number; min: number; mean: number };
  revenueLast30: { max: number; min: number; mean: number };
}

class MLChurnPredictor {
  private model: MultivariateLinearRegression | null = null;
  private stats: FeatureStats;
  private modelLoaded: boolean = false;
  private defaultStats: FeatureStats = {
    daysSinceActivity: { max: 30, min: 0, mean: 10 },
    eventsLast30: { max: 100, min: 0, mean: 30 },
    revenueLast30: { max: 300, min: 0, mean: 100 }
  };

  constructor() {
    this.stats = this.defaultStats;
    this.loadModel();
  }

  private loadModel(): boolean {
    try {
      if (typeof window !== 'undefined') {
        return false;
      }

      if (fs.existsSync(MODEL_PATH)) {
        const modelData = fs.readFileSync(MODEL_PATH, 'utf8');
        const parsedData = JSON.parse(modelData);
        
        if (parsedData.stats) {
          this.stats = parsedData.stats;
        }
        
        if (parsedData.model) {
          this.model = MultivariateLinearRegression.load(parsedData.model);
          this.modelLoaded = true;
          console.log('Churn prediction model loaded from disk');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }

  private saveModel(): boolean {
    try {
      if (typeof window !== 'undefined') {
        return false;
      }
      
      if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
      }
      
      const modelData = {
        model: this.model?.toJSON(),
        stats: this.stats,
        timestamp: Date.now()
      };
      
      fs.writeFileSync(MODEL_PATH, JSON.stringify(modelData));
      console.log('Churn prediction model saved to disk');
      return true;
    } catch (error) {
      console.error('Error saving model:', error);
      return false;
    }
  }

  private prepareFeatures(input: ChurnPredictionInput): number[] {
    const plan_free = input.plan === 'free' ? 1 : 0;
    const plan_basic = input.plan === 'basic' ? 1 : 0;
    const plan_premium = input.plan === 'premium' ? 1 : 0;
    
    const daysSinceActivity = this.normalizeFeature(
      input.daysSinceActivity,
      this.stats.daysSinceActivity.min,
      this.stats.daysSinceActivity.max
    );
    
    const eventsLast30 = this.normalizeFeature(
      input.eventsLast30,
      this.stats.eventsLast30.min,
      this.stats.eventsLast30.max
    );
    
    const revenueLast30 = this.normalizeFeature(
      input.revenueLast30,
      this.stats.revenueLast30.min,
      this.stats.revenueLast30.max
    );
    
    return [
      plan_free,
      plan_basic, 
      plan_premium,
      daysSinceActivity,
      eventsLast30,
      revenueLast30
    ];
  }

  private normalizeFeature(value: number, min: number, max: number): number {
    return (value - min) / (max - min || 1);
  }

  private updateStats(data: ChurnPredictionInput[]): void {
    const daysSinceActivities = data.map(d => d.daysSinceActivity);
    const eventsLast30Values = data.map(d => d.eventsLast30);
    const revenueLast30Values = data.map(d => d.revenueLast30);
    
    this.stats = {
      daysSinceActivity: {
        min: Math.min(...daysSinceActivities),
        max: Math.max(...daysSinceActivities),
        mean: daysSinceActivities.reduce((sum, val) => sum + val, 0) / daysSinceActivities.length
      },
      eventsLast30: {
        min: Math.min(...eventsLast30Values),
        max: Math.max(...eventsLast30Values),
        mean: eventsLast30Values.reduce((sum, val) => sum + val, 0) / eventsLast30Values.length
      },
      revenueLast30: {
        min: Math.min(...revenueLast30Values),
        max: Math.max(...revenueLast30Values),
        mean: revenueLast30Values.reduce((sum, val) => sum + val, 0) / revenueLast30Values.length
      }
    };
  }

  public async train(trainingData: { input: ChurnPredictionInput, output: { churned: boolean } }[]): Promise<boolean> {
    try {
      if (trainingData.length === 0) {
        console.error('No training data provided');
        return false;
      }
      
      console.log(`Training model with ${trainingData.length} samples...`);
      
      const inputData = trainingData.map(d => d.input);
      this.updateStats(inputData);
      
      const inputs = trainingData.map(item => this.prepareFeatures(item.input));
      const outputs = trainingData.map(item => item.output.churned ? 1 : 0);
      
      if (inputs.length === 0 || outputs.length === 0) {
        console.error('No valid training data after preprocessing');
        return false;
      }
      
      console.log(`Input shape: ${inputs.length}x${inputs[0].length}`);
      console.log(`Output shape: ${outputs.length}`);
      
      const featureCount = inputs[0].length;
      const validInputs = inputs.every(input => input.length === featureCount);
      
      if (!validInputs) {
        console.error('Inconsistent feature counts in input data');
        return false;
      }
      
      const outputsAs2D = outputs.map(y => [y]);
      this.model = new MultivariateLinearRegression(inputs, outputsAs2D);
      console.log('Model trained successfully');
      
      this.modelLoaded = true;
      this.saveModel();
      
      return true;
    } catch (error) {
      console.error('Error training model:', error);
      return false;
    }
  }

  public predict(input: ChurnPredictionInput): { 
    probability: number, 
    willChurn: boolean,
    confidence: number 
  } {
    try {
      if (!this.modelLoaded || !this.model) {
        return this.fallbackPrediction(input);
      }
      
      const features = this.prepareFeatures(input);
      
      const rawPrediction = this.model.predict(features)[0];
      
      const probability = Math.max(0, Math.min(1, rawPrediction));
      
      const confidence = Math.abs(probability - 0.5) * 2;
      
      return {
        probability,
        willChurn: probability > 0.5,
        confidence
      };
    } catch (error) {
      console.error('Error making prediction:', error);
      return this.fallbackPrediction(input);
    }
  }

  private fallbackPrediction(input: ChurnPredictionInput): { 
    probability: number, 
    willChurn: boolean,
    confidence: number 
  } {
    let probability = 0.5;
    
    if (input.plan === 'free') {
      probability += 0.1;
    } else if (input.plan === 'basic') {
      probability += 0.03;
    } else {
      probability -= 0.05;
    }
    
    if (input.daysSinceActivity > 20) {
      probability += 0.1;
    } else if (input.daysSinceActivity > 10) {
      probability += 0.05;
    }
    
    if (input.eventsLast30 > 50) {
      probability -= 0.08;
    } else if (input.eventsLast30 > 20) {
      probability -= 0.05;
    }
    
    if (input.revenueLast30 > 100) {
      probability -= 0.08;
    } else if (input.revenueLast30 > 50) {
      probability -= 0.05;
    }
    
    probability = Math.max(0.05, Math.min(0.95, probability));
    
    return {
      probability,
      willChurn: probability > 0.5,
      confidence: 0.3 // Low confidence for fallback predictions
    };
  }

  public getRiskCategory(probability: number): string {
    if (probability >= 0.7) {
      return 'High Risk';
    } else if (probability >= 0.4) {
      return 'Medium Risk';
    } else {
      return 'Low Risk';
    }
  }

  public calibratePredictions(predictions: any[], targetDistribution: { low: number, medium: number, high: number } = { low: 0.45, medium: 0.35, high: 0.2 }): any[] {
    if (!predictions || predictions.length === 0) {
      return predictions;
    }

    const result = [...predictions].sort((a, b) => a.probability - b.probability);
    const totalCount = result.length;
    
    const lowRiskCount = Math.floor(totalCount * targetDistribution.low);
    const mediumRiskCount = Math.floor(totalCount * targetDistribution.medium);
    const highRiskCount = totalCount - lowRiskCount - mediumRiskCount;
    
    console.log(`[${Date.now()}] Calibrating to distribution: Low=${lowRiskCount} (${Math.round(lowRiskCount/totalCount*100)}%), Medium=${mediumRiskCount} (${Math.round(mediumRiskCount/totalCount*100)}%), High=${highRiskCount} (${Math.round(highRiskCount/totalCount*100)}%)`);
    
    for (let i = 0; i < totalCount; i++) {
      if (i < lowRiskCount) {
        result[i].riskCategory = 'Low Risk';
      } else if (i < lowRiskCount + mediumRiskCount) {
        result[i].riskCategory = 'Medium Risk';
      } else {
        result[i].riskCategory = 'High Risk';
      }
    }
    
    return result;
  }
}

const mlChurnPredictor = new MLChurnPredictor();
export default mlChurnPredictor; 