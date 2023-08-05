const rndIntBetween = (min: number, max: number) =>
  Math.floor(Math.random() * max) + min;

const rndBetween = (min, max) => Math.random() * (max - min) + min;

const G = -9.82;

export { rndIntBetween, rndBetween, G };
