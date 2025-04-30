import * as tf from '@tensorflow/tfjs-node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const data = await prisma.churnFeature.findMany();
  const labels = data.map(d => d.churned ? 1 : 0);
  const features = data.map(d => [
    d.plan === 'free' ? 0 : d.plan === 'basic' ? 1 : 2,
    d.daysSinceActivity,
    d.eventsLast30,
    d.revenueLast30
  ]);

  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels, [labels.length, 1]);

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 8, inputShape: [4], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({ optimizer: tf.train.adam(0.01), loss: 'binaryCrossentropy', metrics: ['accuracy'] });

  await model.fit(xs, ys, { epochs: 50, batchSize: 32, validationSplit: 0.2 });
  await model.save('file://./model');
  console.log('Model trained and saved to ./model');
}

main().catch(console.error); 