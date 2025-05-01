declare module 'ml-regression' {
  export class MultivariateLinearRegression {
    constructor(inputs: number[][], outputs: number[][] | number[]);
    predict(inputs: number[]): number[];
    toJSON(): any;
    static load(model: any): MultivariateLinearRegression;
  }
} 