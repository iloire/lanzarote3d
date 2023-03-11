import * as THREE from "three";

test("MathUtils.clamp", () => {
  expect(THREE.MathUtils.clamp(1, 3, 2)).toBe(3);
  expect(THREE.MathUtils.clamp(1, 13, 112)).toBe(13);
});

test("MathUtils.lerp", () => {
  expect(THREE.MathUtils.lerp(1, 10, 0.5)).toBe(5.5);
  expect(THREE.MathUtils.lerp(1, 20, 0.5)).toBe(10.5);
  expect(THREE.MathUtils.lerp(1, 3, 1)).toBe(3);
});

test("MathUtils.pingpong", () => {
  expect(THREE.MathUtils.pingpong(1, 10)).toBe(1);
  expect(THREE.MathUtils.pingpong(1, 10)).toBe(1);
});

test("MathUtils.smoothstep", () => {
  expect(THREE.MathUtils.smoothstep(50, 10, 100)).toBeCloseTo(0.417);
  expect(THREE.MathUtils.smoothstep(10, 1, 100)).toBeCloseTo(0.023);
  expect(THREE.MathUtils.smoothstep(1, 2, 10)).toBe(0);
});
