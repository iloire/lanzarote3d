import * as THREE from "three";

test("mathutils", () => {
  expect(THREE.MathUtils.clamp(1, 3, 2)).toBe(3);
  expect(THREE.MathUtils.clamp(1, 13, 112)).toBe(13);
});
