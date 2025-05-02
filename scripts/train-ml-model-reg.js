// CommonJS version of the training script
const { MultivariateLinearRegression } = require('ml-regression');
const fs = require('fs');
const path = require('path');

const MODEL_DIR = path.join(process.cwd(), 'public', 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'churn-model.json');

class MLChurnPredictor {
  constructor() {
    this.model = null;
    
    this.stats = {
      daysSinceActivity: { max: 30, min: 0, mean: 10 },
      eventsLast30: { max: 100, min: 0, mean: 30 },
      revenueLast30: { max: 300, min: 0, mean: 100 }
    };
    
    this.modelLoaded = false;
    this.loadModel();
  }
  
  loadModel() {
    try {
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
  
  saveModel() {
    try {
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

  normalizeFeature(value, min, max) {
    return (value - min) / (max - min || 1);
  }
  

  prepareFeatures(input) {
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
  
  updateStats(data) {
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
  
  async train(trainingData) {
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
  
  predict(input) {
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
  
  fallbackPrediction(input) {
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
        confidence: 0.3 
      };
  }
}

async function generateTrainingData(count = 500) {
  const trainingData = [];
  
  const plans = ['free', 'basic', 'premium'];
  
  for (let i = 0; i < count; i++) {
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const daysSinceActivity = Math.floor(Math.random() * 30);
    const eventsLast30 = Math.floor(Math.random() * 100);
    
    let revenueLast30 = 0;
    if (plan === 'basic') revenueLast30 = 100;
    if (plan === 'premium') revenueLast30 = 300;
    
    let churnProbability = 0.5;
    
    if (plan === 'free') churnProbability += 0.1;
    else if (plan === 'basic') churnProbability += 0.05;
    else if (plan === 'premium') churnProbability -= 0.15;
    
    if (daysSinceActivity > 20) churnProbability += 0.2;
    else if (daysSinceActivity > 10) churnProbability += 0.1;
    else churnProbability -= 0.1;
    
    if (eventsLast30 < 10) churnProbability += 0.15;
    else if (eventsLast30 > 50) churnProbability -= 0.15;
    
    if (revenueLast30 > 0) churnProbability -= 0.1;
    
    churnProbability += (Math.random() * 0.2) - 0.1;
    
    churnProbability = Math.max(0.05, Math.min(0.95, churnProbability));
    
    const churned = Math.random() < churnProbability;
    
    trainingData.push({
      input: {
        plan,
        daysSinceActivity,
        eventsLast30,
        revenueLast30
      },
      output: {
        churned
      }
    });
  }
  
  return trainingData;
}

async function trainModel() {
  console.log('Generating synthetic training data...');
  const trainingData = await generateTrainingData(1000);
  
  console.log(`Generated ${trainingData.length} synthetic training samples`);
  
  const mlChurnPredictor = new MLChurnPredictor();
  
  console.log('Training ML model...');
  const success = await mlChurnPredictor.train(trainingData);
  
  if (success) {
    console.log('ML model trained successfully!');
    
    const testCases = [
      { plan: 'free', daysSinceActivity: 25, eventsLast30: 5, revenueLast30: 0 },
      { plan: 'basic', daysSinceActivity: 15, eventsLast30: 25, revenueLast30: 100 },
      { plan: 'premium', daysSinceActivity: 3, eventsLast30: 75, revenueLast30: 300 }
    ];
    
    console.log('\nTesting model with a few cases:');
    testCases.forEach(testCase => {
      const prediction = mlChurnPredictor.predict(testCase);
      console.log(`Test case: ${JSON.stringify(testCase)}`);
      console.log(`Prediction: ${JSON.stringify(prediction)}\n`);
    });
  } else {
    console.error('Failed to train ML model');
  }
}

trainModel()
  .then(() => {
    console.log('Training script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during training:', error);
    process.exit(1);
  }); 