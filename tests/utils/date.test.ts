import Time from "../../src/utils/time";

test("time", () => {
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(4)).toBe(0);
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(5)).toBe(-89);
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(7)).toBeCloseTo(
    -65.26,
    0
  );
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(16)).toBeCloseTo(
    41.5,
    0
  );
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(18)).toBeCloseTo(65, 0);
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(20)).toBeCloseTo(89);
  expect(Time.getSunAltitudeDegreesAccordingToTimeOfDay(21)).toBe(0);
});

test("time.getSunAzimuthDegreesAccordingToTimeOfDay:", () => {
  // expect(Time.getSunAzimuthDegreesAccordingToTimeOfDay(5)).toBe(90);
});
