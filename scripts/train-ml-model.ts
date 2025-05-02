import mlChurnPredictor from '../lib/ml-churn-predictor';

async function generateTrainingData(count: number = 500) {
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