const rndIntBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const rndBetween = (min: number, max: number) => Math.random() * (max - min) + min;

export { rndIntBetween, rndBetween };
