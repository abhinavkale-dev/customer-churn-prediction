import * as tf from '@tensorflow/tfjs-node';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

// Configuration parameters
const CONFIG = {
  modelSavePath: 'file://./model',
  epochs: 100,
  batchSize: 32,
  validationSplit: 0.2,
  learningRate: 0.005,
  // Model architecture
  hiddenLayers: [16, 8],
  dropoutRate: 0.2,
  // Early stopping parameters
  patience: 10,
  minDelta: 0.001
};

async function loadAndPreprocessData() {
  console.log('Loading data from database...');
  const data = await prisma.churnFeature.findMany();
  
  // Shuffle data for better training
  const shuffledData = [...data].sort(() => Math.random() - 0.5);
  
  // Convert categorical features to numeric
  const features = shuffledData.map(d => [
    // Plan type: one-hot encoding
    d.plan === 'free' ? 1 : 0,
    d.plan === 'basic' ? 1 : 0,
    d.plan === 'premium' ? 1 : 0,
    // Numeric features
    d.daysSinceActivity,
    d.eventsLast30,
    d.revenueLast30,
    // Additional features you might want to add:
    Math.log(d.eventsLast30 + 1), // Log transform of events
    d.revenueLast30 / (d.eventsLast30 + 1), // Revenue per event
    d.daysSinceActivity > 30 ? 1 : 0, // Inactive customer flag
  ]);
  
  const labels = shuffledData.map(d => d.churned ? 1 : 0);
  
  // Calculate class weights for imbalanced data
  const totalSamples = labels.length;
  const positiveCount = labels.filter(label => label === 1).length;
  const negativeCount = totalSamples - positiveCount;
  
  const classWeights = {
    0: totalSamples / (2 * negativeCount),
    1: totalSamples / (2 * positiveCount)
  };
  
  console.log(`Total samples: ${totalSamples}`);
  console.log(`Churn ratio: ${(positiveCount / totalSamples * 100).toFixed(2)}%`);
  console.log(`Class weights: ${JSON.stringify(classWeights)}`);
  
  // Split data into training and test sets (80/20)
  const splitIndex = Math.floor(features.length * 0.8);
  const trainFeatures = features.slice(0, splitIndex);
  const testFeatures = features.slice(splitIndex);
  const trainLabels = labels.slice(0, splitIndex);
  const testLabels = labels.slice(splitIndex);
  
  // Normalize features
  const featureTensor = tf.tensor2d(trainFeatures);
  const mean = featureTensor.mean(0);
  const std = featureTensor.sub(mean).square().mean(0).sqrt();
  
  // Save normalization parameters for inference
  await fs.promises.writeFile(
    './model/normalization.json', 
    JSON.stringify({
      mean: Array.from(await mean.data()), 
      std: Array.from(await std.data())
    })
  );
  
  // Apply normalization
  const normalizedTrainFeatures = tf.tensor2d(trainFeatures).sub(mean).div(std);
  const normalizedTestFeatures = tf.tensor2d(testFeatures).sub(mean).div(std);
  
  return {
    trainFeatures: normalizedTrainFeatures,
    trainLabels: tf.tensor2d(trainLabels, [trainLabels.length, 1]),
    testFeatures: normalizedTestFeatures,
    testLabels: tf.tensor2d(testLabels, [testLabels.length, 1]),
    classWeights,
    featureNames: [
      'Plan-Free', 'Plan-Basic', 'Plan-Premium', 
      'DaysSinceActivity', 'EventsLast30', 'RevenueLast30',
      'LogEvents', 'RevenuePerEvent', 'InactiveFlag'
    ]
  };
}

function buildModel(inputShape: number): tf.Sequential {
  console.log('Building model...');
  const model = tf.sequential();
  
  // First hidden layer
  model.add(tf.layers.dense({ 
    units: CONFIG.hiddenLayers[0], 
    inputShape: [inputShape], 
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.dropout({ rate: CONFIG.dropoutRate }));
  
  // Additional hidden layers
  for (let i = 1; i < CONFIG.hiddenLayers.length; i++) {
    model.add(tf.layers.dense({ 
      units: CONFIG.hiddenLayers[i], 
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    model.add(tf.layers.dropout({ rate: CONFIG.dropoutRate }));
  }
  
  // Output layer
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  
  // Compile model
  model.compile({ 
    optimizer: tf.train.adam(CONFIG.learningRate), 
    loss: 'binaryCrossentropy', 
    metrics: ['accuracy']
  });
  
  model.summary();
  return model;
}

function createEarlyStoppingCallback(model: tf.Sequential) {
  let bestLoss = Infinity;
  let waitCount = 0;
  
  return {
    onEpochEnd: async (epoch: number, logs: any) => {
      const currentLoss = logs.val_loss;
      
      if (currentLoss < bestLoss - CONFIG.minDelta) {
        bestLoss = currentLoss;
        waitCount = 0;
        console.log(`Epoch ${epoch+1}: New best validation loss: ${currentLoss.toFixed(4)}`);
      } else {
        waitCount++;
        console.log(`Epoch ${epoch+1}: No improvement for ${waitCount} epochs. Best: ${bestLoss.toFixed(4)}, Current: ${currentLoss.toFixed(4)}`);
        
        if (waitCount >= CONFIG.patience) {
          console.log(`Early stopping at epoch ${epoch+1}`);
          model.stopTraining = true;
        }
      }
    }
  };
}

function computeClassWeights(classWeights: any, labels: number[]): Float32Array {
  const sampleWeights = new Float32Array(labels.length);
  
  for (let i = 0; i < labels.length; i++) {
    sampleWeights[i] = classWeights[labels[i]];
  }
  
  return sampleWeights;
}

async function evaluateModel(model: tf.Sequential, testFeatures: tf.Tensor, testLabels: tf.Tensor) {
  console.log('Evaluating model...');
  
  // Overall metrics
  const evalResult = model.evaluate(testFeatures, testLabels);
  const testLoss = Array.isArray(evalResult) ? evalResult[0].dataSync()[0] : evalResult.dataSync()[0];
  const testAcc = Array.isArray(evalResult) ? evalResult[1].dataSync()[0] : 0;
  
  console.log(`Test Loss: ${testLoss.toFixed(4)}`);
  console.log(`Test Accuracy: ${(testAcc * 100).toFixed(2)}%`);
  
  // Predictions for more detailed metrics
  const predictions = model.predict(testFeatures) as tf.Tensor;
  const predictionValues = await predictions.data();
  const labelValues = await testLabels.data();
  
  // Convert to binary using 0.5 threshold
  const binaryPredictions = Array.from(predictionValues).map(p => p > 0.5 ? 1 : 0);
  const actualLabels = Array.from(labelValues);
  
  // Calculate confusion matrix
  const tp = binaryPredictions.filter((pred, i) => pred === 1 && actualLabels[i] === 1).length;
  const fp = binaryPredictions.filter((pred, i) => pred === 1 && actualLabels[i] === 0).length;
  const tn = binaryPredictions.filter((pred, i) => pred === 0 && actualLabels[i] === 0).length;
  const fn = binaryPredictions.filter((pred, i) => pred === 0 && actualLabels[i] === 1).length;
  
  // Calculate metrics
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
  
  console.log('\nConfusion Matrix:');
  console.log(`True Positives: ${tp}, False Positives: ${fp}`);
  console.log(`False Negatives: ${fn}, True Negatives: ${tn}`);
  console.log(`\nPrecision: ${(precision * 100).toFixed(2)}%`);
  console.log(`Recall: ${(recall * 100).toFixed(2)}%`);
  console.log(`F1 Score: ${(f1Score * 100).toFixed(2)}%`);
  
  // Save evaluation metrics
  const metrics = {
    loss: testLoss,
    accuracy: testAcc,
    precision,
    recall,
    f1Score,
    confusionMatrix: { tp, fp, tn, fn },
    timestamp: new Date().toISOString()
  };
  
  await fs.promises.writeFile('./model/evaluation.json', JSON.stringify(metrics, null, 2));
  
  // Clean up
  predictions.dispose();
}

async function analyzeFeatureImportance(model: tf.Sequential, testFeatures: tf.Tensor, featureNames: string[]) {
  console.log('\nAnalyzing feature importance...');
  
  const baselinePredictions = model.predict(testFeatures) as tf.Tensor;
  const baselineProbs = await baselinePredictions.data();
  
  const importance: {feature: string, score: number}[] = [];
  
  // For each feature, calculate how much predictions change when feature is zeroed out
  for (let i = 0; i < featureNames.length; i++) {
    // Create a copy with the current feature zeroed out
    const modifiedFeatures = testFeatures.clone();
    const zerosColumn = tf.zeros([testFeatures.shape[0], 1]);
    
    // Zero out the feature at index i
    const allColumns = [];
    for (let j = 0; j < featureNames.length; j++) {
      if (j === i) {
        allColumns.push(zerosColumn);
      } else {
        allColumns.push(tf.slice(modifiedFeatures, [0, j], [modifiedFeatures.shape[0], 1]));
      }
    }
    
    const perturbedFeatures = tf.concat(allColumns, 1);
    
    // Get new predictions
    const newPredictions = model.predict(perturbedFeatures) as tf.Tensor;
    const newProbs = await newPredictions.data();
    
    // Calculate mean absolute difference
    let diffSum = 0;
    for (let j = 0; j < baselineProbs.length; j++) {
      diffSum += Math.abs(baselineProbs[j] - newProbs[j]);
    }
    
    const meanDiff = diffSum / baselineProbs.length;
    importance.push({
      feature: featureNames[i],
      score: meanDiff
    });
    
    // Clean up tensors
    zerosColumn.dispose();
    perturbedFeatures.dispose();
    newPredictions.dispose();
    allColumns.forEach(col => col.dispose());
  }
  
  // Sort by importance
  importance.sort((a, b) => b.score - a.score);
  
  console.log('Feature importance:');
  importance.forEach(item => {
    console.log(`${item.feature}: ${(item.score * 100).toFixed(2)}%`);
  });
  
  // Save feature importance to file
  await fs.promises.writeFile('./model/feature_importance.json', JSON.stringify(importance, null, 2));
  
  // Clean up
  baselinePredictions.dispose();
}

async function saveModelSummary(model: tf.Sequential) {
  // Get model summary as string
  let summaryOutput = '';
  
  // @ts-ignore - The typings for model.summary are incorrect
  model.summary(undefined, undefined, (message: string) => {
    summaryOutput += message + '\n';
  });
  
  await fs.promises.writeFile('./model/model_summary.txt', summaryOutput);
}

async function main() {
  try {
    // Ensure model directory exists
    if (!fs.existsSync('./model')) {
      fs.mkdirSync('./model');
    }
    
    // Load and preprocess data
    const {
      trainFeatures, trainLabels, 
      testFeatures, testLabels,
      classWeights, featureNames
    } = await loadAndPreprocessData();
    
    // Build the model
    const inputShape = trainFeatures.shape[1];
    if (inputShape === undefined) {
      throw new Error("Input shape is undefined");
    }
    const model = buildModel(inputShape);
    
    // Get sample weights for handling class imbalance
    const trainLabelValues = await trainLabels.data();
    const sampleWeights = computeClassWeights(classWeights, Array.from(trainLabelValues));
    
    console.log('Training model...');
    // Train the model
    await model.fit(trainFeatures, trainLabels, {
      epochs: CONFIG.epochs,
      batchSize: CONFIG.batchSize,
      validationSplit: CONFIG.validationSplit,
      callbacks: [
        createEarlyStoppingCallback(model),
        tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: CONFIG.patience,
          minDelta: CONFIG.minDelta,
          verbose: 1
        })
        // TensorBoard is not supported in this environment
        // tf.callbacks.tensorBoard('./logs')
      ],
      shuffle: true,
      sampleWeight: tf.tensor1d(sampleWeights)
    });
    
    // Save model architecture summary
    await saveModelSummary(model);
    
    // Evaluate model on test data
    await evaluateModel(model, testFeatures, testLabels);
    
    // Analyze feature importance
    await analyzeFeatureImportance(model, testFeatures, featureNames);
    
    // Save the model
    console.log(`Saving model to ${CONFIG.modelSavePath}`);
    await model.save(CONFIG.modelSavePath);
    
    // Create a simple inference script
    await generateInferenceScript();
    
    console.log('Model training and evaluation complete!');
    
    // Clean up tensors
    trainFeatures.dispose();
    trainLabels.dispose();
    testFeatures.dispose();
    testLabels.dispose();
    
  } catch (error) {
    console.error('Error in training process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function generateInferenceScript() {
  const inferenceScript = `
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
async function predictChurn(customer) {
  const model = await loadModel();
  
  // Format features the same way as in training
  const features = [
    customer.plan === 'free' ? 0 : 0,
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
  const prediction = model.predict(tf.tensor2d([normalizedFeatures]));
  const probability = (await prediction.data())[0];
  
  return {
    probability,
    willChurn: probability > 0.5
  };
}

// Example usage
async function example() {
  const result = await predictChurn({
    plan: 'basic',
    daysSinceActivity: 15,
    eventsLast30: 5,
    revenueLast30: 50
  });
  
  console.log(\`Churn probability: \${(result.probability * 100).toFixed(2)}%\`);
  console.log(\`Customer will churn: \${result.willChurn}\`);
}

// Run example if this script is executed directly
if (require.main === module) {
  example().catch(console.error);
}

module.exports = { predictChurn };
`;

  await fs.promises.writeFile('./predict.ts', inferenceScript);
  console.log('Inference script generated: predict.ts');
}

// Run the main function
main().catch(console.error); 