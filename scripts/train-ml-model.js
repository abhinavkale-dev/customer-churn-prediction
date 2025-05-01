// CommonJS version of the training script
const brain = require('brain.js');
const fs = require('fs');
const path = require('path');

// Configuration
const MODEL_DIR = path.join(process.cwd(), 'public', 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'churn-model.json');

/**
 * Create a simplified version of the ML predictor for training
 */
class MLChurnPredictor {
  constructor() {
    // Initialize neural network with configuration
    this.network = new brain.NeuralNetwork({
      hiddenLayers: [6, 4], // Two hidden layers with 6 and 4 neurons
      activation: 'sigmoid',  // Sigmoid activation function
      iterations: 20000,      // Maximum training iterations
      learningRate: 0.1,      // Learning rate
      errorThresh: 0.005      // Error threshold to stop training
    });
    
    this.stats = {
      daysSinceActivity: { max: 30, min: 0, mean: 10 },
      eventsLast30: { max: 100, min: 0, mean: 30 },
      revenueLast30: { max: 300, min: 0, mean: 100 }
    };
    
    this.modelLoaded = false;
    this.loadModel();
  }
  
  /**
   * Load model from disk if available
   */
  loadModel() {
    try {
      if (fs.existsSync(MODEL_PATH)) {
        const modelData = fs.readFileSync(MODEL_PATH, 'utf8');
        const parsedData = JSON.parse(modelData);
        
        if (parsedData.stats) {
          this.stats = parsedData.stats;
        }
        
        if (parsedData.model) {
          this.network.fromJSON(parsedData.model);
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
  
  /**
   * Save model to disk
   */
  saveModel() {
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
      }
      
      // Save model and stats
      const modelData = {
        model: this.network.toJSON(),
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
  
  /**
   * Normalize input features using min-max scaling
   */
  normalizeInput(input) {
    // One-hot encode the plan
    const plan_free = input.plan === 'free' ? 1 : 0;
    const plan_basic = input.plan === 'basic' ? 1 : 0;
    const plan_premium = input.plan === 'premium' ? 1 : 0;
    
    // Min-max normalization for numerical features
    const daysSinceActivity = (input.daysSinceActivity - this.stats.daysSinceActivity.min) / 
      (this.stats.daysSinceActivity.max - this.stats.daysSinceActivity.min || 1);
    
    const eventsLast30 = (input.eventsLast30 - this.stats.eventsLast30.min) / 
      (this.stats.eventsLast30.max - this.stats.eventsLast30.min || 1);
    
    const revenueLast30 = (input.revenueLast30 - this.stats.revenueLast30.min) / 
      (this.stats.revenueLast30.max - this.stats.revenueLast30.min || 1);
    
    return {
      plan_free,
      plan_basic,
      plan_premium,
      daysSinceActivity,
      eventsLast30,
      revenueLast30
    };
  }
  
  /**
   * Update feature stats based on new data
   */
  updateStats(data) {
    // Extract all values for each feature
    const daysSinceActivities = data.map(d => d.daysSinceActivity);
    const eventsLast30Values = data.map(d => d.eventsLast30);
    const revenueLast30Values = data.map(d => d.revenueLast30);
    
    // Calculate min, max, mean for each feature
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
  
  /**
   * Train the model on historical data
   */
  async train(trainingData) {
    try {
      if (trainingData.length === 0) {
        console.error('No training data provided');
        return false;
      }
      
      console.log(`Training model with ${trainingData.length} samples...`);
      
      // Extract inputs for stats calculation
      const inputData = trainingData.map(d => d.input);
      this.updateStats(inputData);
      
      // Prepare data for neural network
      const normalizedData = trainingData.map(item => ({
        input: this.normalizeInput(item.input),
        output: { 
          churn_probability: item.output.churned ? 1 : 0 
        }
      }));
      
      // Train the model
      const result = await this.network.trainAsync(normalizedData);
      console.log(`Model trained: ${result.iterations} iterations, error: ${result.error}`);
      
      // Save the model
      this.modelLoaded = true;
      this.saveModel();
      
      return true;
    } catch (error) {
      console.error('Error training model:', error);
      return false;
    }
  }
  
  /**
   * Make a prediction for a single user
   */
  predict(input) {
    try {
      // If model isn't loaded, return a fallback prediction
      if (!this.modelLoaded) {
        return this.fallbackPrediction(input);
      }
      
      // Normalize input
      const normalizedInput = this.normalizeInput(input);
      
      // Run prediction
      const result = this.network.run(normalizedInput);
      const probability = result.churn_probability;
      
      // Calculate confidence based on how far from 0.5 the prediction is
      const confidence = Math.abs(probability - 0.5) * 2; // 0 to 1 scale
      
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
  
  /**
   * Fallback prediction if model fails
   */
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
      confidence: 0.3 // Low confidence for fallback predictions
    };
  }
}

/**
 * Generate synthetic training data for the ML model
 */
async function generateTrainingData(count = 500) {
  const trainingData = [];
  
  // Generate a mix of users with different plans
  const plans = ['free', 'basic', 'premium'];
  
  for (let i = 0; i < count; i++) {
    // Generate random feature values
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const daysSinceActivity = Math.floor(Math.random() * 30);
    const eventsLast30 = Math.floor(Math.random() * 100);
    
    // Calculate revenue based on plan
    let revenueLast30 = 0;
    if (plan === 'basic') revenueLast30 = 100;
    if (plan === 'premium') revenueLast30 = 300;
    
    // Define rules to set churn probability
    let churnProbability = 0.5;
    
    // Plan-based rules
    if (plan === 'free') churnProbability += 0.1;
    else if (plan === 'basic') churnProbability += 0.05;
    else if (plan === 'premium') churnProbability -= 0.15;
    
    // Activity-based rules
    if (daysSinceActivity > 20) churnProbability += 0.2;
    else if (daysSinceActivity > 10) churnProbability += 0.1;
    else churnProbability -= 0.1;
    
    // Engagement-based rules
    if (eventsLast30 < 10) churnProbability += 0.15;
    else if (eventsLast30 > 50) churnProbability -= 0.15;
    
    // Revenue-based rules
    if (revenueLast30 > 0) churnProbability -= 0.1;
    
    // Add some randomness to avoid perfect correlation
    churnProbability += (Math.random() * 0.2) - 0.1;
    
    // Clamp probability between 0.05 and 0.95
    churnProbability = Math.max(0.05, Math.min(0.95, churnProbability));
    
    // Determine if user churned based on probability
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

/**
 * Train the model with synthetic data
 */
async function trainModel() {
  console.log('Generating synthetic training data...');
  const trainingData = await generateTrainingData(1000);
  
  console.log(`Generated ${trainingData.length} synthetic training samples`);
  
  const mlChurnPredictor = new MLChurnPredictor();
  
  console.log('Training ML model...');
  const success = await mlChurnPredictor.train(trainingData);
  
  if (success) {
    console.log('ML model trained successfully!');
    
    // Test a few predictions to verify the model works
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

// Run the training script
trainModel()
  .then(() => {
    console.log('Training script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during training:', error);
    process.exit(1);
  }); 