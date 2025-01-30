import { Architect } from "synaptic";
import * as fs from "fs";
import trainingData from './training_data.json';

// (5 inputs → 8 hidden neurons → 1 output)
const net = new Architect.Perceptron(5, 8, 1);

// Train the network
for (let i = 0; i < 2000; i++) {
  trainingData.forEach(data => {
    net.activate(data.input);
    net.propagate(0.3, data.output);
  });
}

// Save trained model
const modelJson = JSON.stringify(net.toJSON());
fs.writeFileSync("./model.json", modelJson);
