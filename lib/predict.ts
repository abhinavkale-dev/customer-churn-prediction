import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';

// Load the normalization parameters
const normalization = JSON.parse(fs.readFileSync('./model/normalization.json', 'utf8'));

async function loadModel() {
  return await tf.loadLayersModel('file://./model/model.json');
}

/**
 * Predict customer churn
 * @param {Object} customer Customer data
 * @param {string} customer.plan - "free", "basic", or "premium"
 * @param {number} customer.daysSinceActivity - Days since last activity
 * @param {number} customer.eventsLast30 - Events in last 30 days
 * @param {number} customer.revenueLast30 - Revenue in last 30 days
 * @returns {Promise<{probability: number, willChurn: boolean}>}
 */
async function predictChurn(customer: {
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
}) {
  const model = await loadModel();
  
  // Format features the same way as in training
  const features = [
    customer.plan === 'free' ? 1 : 0,
    customer.plan === 'basic' ? 1 : 0,
    customer.plan === 'premium' ? 1 : 0,
    customer.daysSinceActivity,
    customer.eventsLast30,
    customer.revenueLast30,
    Math.log(customer.eventsLast30 + 1),
    customer.revenueLast30 / (customer.eventsLast30 + 1),
    customer.daysSinceActivity > 30 ? 1 : 0
  ];
  
  // Apply normalization
  const normalizedFeatures = features.map((val, i) => (val - normalization.mean[i]) / normalization.std[i]);
  
  // Make prediction
  const prediction = model.predict(tf.tensor2d([normalizedFeatures])) as tf.Tensor;
  const probability = (await prediction.data())[0];
  
  // Clean up tensor
  prediction.dispose();
  
  return {
    probability,
    willChurn: probability > 0.5,
    riskCategory: probability < 0.3 ? 'Low Risk' : 
                  probability < 0.7 ? 'Medium Risk' : 'High Risk'
  };
}

/**
 * Batch predict churn for multiple customers
 */
async function batchPredictChurn(customers: Array<{
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
}>) {
  const model = await loadModel();
  
  // Format features for all customers
  const featuresArray = customers.map(customer => [
    customer.plan === 'free' ? 1 : 0,
    customer.plan === 'basic' ? 1 : 0,
    customer.plan === 'premium' ? 1 : 0,
    customer.daysSinceActivity,
    customer.eventsLast30,
    customer.revenueLast30,
    Math.log(customer.eventsLast30 + 1),
    customer.revenueLast30 / (customer.eventsLast30 + 1),
    customer.daysSinceActivity > 30 ? 1 : 0
  ]);
  
  // Apply normalization to all features
  const normalizedFeatures = featuresArray.map(features => 
    features.map((val, i) => (val - normalization.mean[i]) / normalization.std[i])
  );
  
  // Make batch prediction
  const predictions = model.predict(tf.tensor2d(normalizedFeatures)) as tf.Tensor;
  const probabilities = await predictions.data();
  
  // Clean up tensor
  predictions.dispose();
  
  // Return results for each customer
  return customers.map((customer, i) => {
    const probability = probabilities[i];
    return {
      customer,
      probability,
      willChurn: probability > 0.5,
      riskCategory: probability < 0.3 ? 'Low Risk' : 
                    probability < 0.7 ? 'Medium Risk' : 'High Risk'
    };
  });
}

// Example usage
async function example() {
  // Single customer prediction
  const result = await predictChurn({
    plan: 'basic',
    daysSinceActivity: 15,
    eventsLast30: 5,
    revenueLast30: 50
  });
  
  console.log(`\nSingle customer prediction:`);
  console.log(`Churn probability: ${(result.probability * 100).toFixed(2)}%`);
  console.log(`Customer will churn: ${result.willChurn}`);
  console.log(`Risk category: ${result.riskCategory}`);
  
  // Batch prediction
  const batchResults = await batchPredictChurn([
    {
      plan: 'free',
      daysSinceActivity: 45,
      eventsLast30: 1,
      revenueLast30: 0
    },
    {
      plan: 'basic',
      daysSinceActivity: 5,
      eventsLast30: 20,
      revenueLast30: 100
    },
    {
      plan: 'premium',
      daysSinceActivity: 30,
      eventsLast30: 10,
      revenueLast30: 200
    }
  ]);
  
  console.log(`\nBatch prediction results:`);
  batchResults.forEach((result, i) => {
    console.log(`\nCustomer ${i+1}:`);
    console.log(`Plan: ${result.customer.plan}`);
    console.log(`Days Since Activity: ${result.customer.daysSinceActivity}`);
    console.log(`Churn probability: ${(result.probability * 100).toFixed(2)}%`);
    console.log(`Will churn: ${result.willChurn}`);
    console.log(`Risk category: ${result.riskCategory}`);
  });
}

// Run example if this script is executed directly
if (require.main === module) {
  example().catch(console.error);
}

export { predictChurn, batchPredictChurn }; 