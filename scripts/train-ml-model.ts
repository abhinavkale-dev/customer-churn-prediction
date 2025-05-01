import mlChurnPredictor from '../lib/ml-churn-predictor';

/**
 * Generate synthetic training data for the ML model
 */
async function generateTrainingData(count: number = 500) {
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