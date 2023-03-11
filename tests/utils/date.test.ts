import Time from "../../src/utils/time";

test("time", () => {
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(5)).toBe(90);
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(7)).toBeCloseTo(6.43);
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(12)).toBeCloseTo(38.57);
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(16)).toBeCloseTo(25.71);
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(18)).toBeCloseTo(12.86);
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(20)).toBeCloseTo(90);
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(21)).toBe(90);
});

test("time.getSunAzimuthDegreesAccordingToTimeOfDay:", () => {
  expect(Time.getSunAzimuthDegreesAccordingToTimeOfDay(5)).toBe(90);
});
