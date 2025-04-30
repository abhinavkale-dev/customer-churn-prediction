import { NextResponse } from 'next/server';
import * as tf from '@tensorflow/tfjs-node';
import path from 'path';

let model: tf.LayersModel;
async function loadModel() {
  if (!model) model = await tf.loadLayersModel('file://' + path.join(process.cwd(),'model/model.json'));
  return model;
}

export async function POST(request: Request) {
  const { plan, daysSinceActivity, eventsLast30, revenueLast30 } = await request.json();
  const planCode = plan==='free'?0:plan==='basic'?1:2;
  const input = tf.tensor2d([[planCode,daysSinceActivity,eventsLast30,revenueLast30]]);
  const m = await loadModel();
  const prob = (m.predict(input) as tf.Tensor).dataSync()[0] as number;
  return NextResponse.json({ churnProbability: prob });
} 