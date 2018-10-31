/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tf from '@tensorflow/tfjs';
import {generateData} from './data';
import {plotData, plotDataAndPredictions, renderCoefficients} from './ui';
import { rand } from '@tensorflow/tfjs';

/**
 * We want to learn the coefficients that give correct solutions to the
 * following cubic equation:
 *      y = a * x^3 + b * x^2 + c * x + d
 * In other words we want to learn values for:
 *      a
 *      b
 *      c
 *      d
 * Such that this function produces 'desired outputs' for y when provided
 * with x. We will provide some examples of 'xs' and 'ys' to allow this model
 * to learn what we mean by desired outputs and then use it to produce new
 * values of y that fit the curve implied by our example.
 */

// Step 1. Set up variables, these are the things we want the model
// to learn in order to do prediction accurately. We will initialize
// them with random values.
// const a = tf.variable(tf.scalar(0.00003456444));
// const b = tf.variable(tf.scalar(-0.003700521));
// const c = tf.variable(tf.scalar(0.114982));
// const d = tf.variable(tf.scalar(-0.8997114));
// const e = tf.variable(tf.scalar(4.127081));

const a = tf.variable(tf.scalar(Math.random()/1000));
const b = tf.variable(tf.scalar(Math.random()/1000));
const c = tf.variable(tf.scalar(Math.random()/1000));
const d = tf.variable(tf.scalar(Math.random()/1000));
const e = tf.variable(tf.scalar(Math.random()/1000));



// Step 2. Create an optimizer, we will use this later. You can play
// with some of these values to see how the model performs.
const numIterations = 1000;
const learningRate = 0.001;
const optimizer = tf.train.adam(learningRate);

// Step 3. Write our training process functions.

/*
 * This function represents our 'model'. Given an input 'x' it will try and
 * predict the appropriate output 'y'.
 *
 * It is also sometimes referred to as the 'forward' step of our training
 * process. Though we will use the same function for predictions later.
 *
 * @return number predicted y value
 */
function predict(x, par) {
  // console.log(par)
  // console.log(`a=${a} b=${b} c=${c} d=${d} e=${e} `)
  // const x = tf.tensor1d(xs.dataSync())
  // y = a * x ^ 3 + b * x ^ 2 + c * x + d
  return tf.tidy(() => {
    return a.mul(x.pow(tf.scalar(4, 'int32')))
      .add(b.mul(x.pow(tf.scalar(3, 'int32'))))
      .add(c.mul(x.square()))
      .add(d.mul(x))
      .add(e);
  });
}

/*
 * This will tell us how good the 'prediction' is given what we actually
 * expected.
 *
 * prediction is a tensor with our predicted y values.
 * labels is a tensor with the y values the model should have predicted.
 */
function loss(prediction, labels) {
  // Having a good error function is key for training a machine learning model
  const error = prediction.sub(labels).square().mean();
  return error;
}

/*
 * This will iteratively train our model.
 *
 * xs - training data x values
 * ys — training data y values
 */
async function train(xs, ys, numIterations) {
  for (let iter = 0; iter < numIterations; iter++) {
    // optimizer.minimize is where the training happens.

    // The function it takes must return a numerical estimate (i.e. loss)
    // of how well we are doing using the current state of
    // the variables we created at the start.

    // This optimizer does the 'backward' step of our training process
    // updating variables defined previously in order to minimize the
    // loss.
    optimizer.minimize(() => {
      // Feed the examples into the model
      const pred = predict(xs, 'inner');
      // console.log(`${iter} - ${loss(pred, ys).dataSync()}`)
      return loss(pred, ys);
    });
    // Use tf.nextFrame to not block the browser.
    await tf.nextFrame();
  }
}

async function learnCoefficients() {
  const trueCoefficients = {a: -.1, b: .9, c: .1, d: .5, e:.4};
  const trainingData = generateData();

  // Plot original data
  renderCoefficients('#data .coeff', trueCoefficients);
  await plotData('#data .plot', trainingData.ys, trainingData.xs)
  // console.log(`first training data \n ${trainingData.xs}`)

  // See what the predictions look like with random coefficients
  // xs = nilai sensor
  // ys = kedalaman sensor
  var random = {
    a: a.dataSync()[0],
    b: b.dataSync()[0],
    c: c.dataSync()[0],
    d: d.dataSync()[0],
    e: e.dataSync()[0]
  }
  renderCoefficients('#random .coeff', random);
  const predictionsBefore = predict(trainingData.xs)
  await plotDataAndPredictions(
      '#random .plot', trainingData.ys, trainingData.xs, predictionsBefore);
  // Train the model!
  console.log(`before training data \n ${trainingData.xs}`)

  await train(trainingData.xs, trainingData.ys, numIterations);
  // console.log(`after training data \n ${trainingData.xs}`)

  // See what the final results predictions are after training.
  var trained = {
    a: a.dataSync()[0],
    b: b.dataSync()[0],
    c: c.dataSync()[0],
    d: d.dataSync()[0],
    e: e.dataSync()[0],
  }

  renderCoefficients('#trained .coeff', trained);
  const predictionsAfter = predict(trainingData.xs, 'outer')
  await plotDataAndPredictions(
      '#trained .plot', trainingData.ys, trainingData.xs, predictionsAfter);
  
  predictionsBefore.dispose();
  predictionsAfter.dispose();
}


learnCoefficients();