import * as THREE from "three";

const Time = {
  getSunAltitudeDegreesAccordingToTimeOfDay: (timeOfDayInHours) => {
    const minSun = 5,
      maxSun = 20;
    if (timeOfDayInHours < minSun || timeOfDayInHours > maxSun) {
      return 0;
    }
    const valueInRange = THREE.MathUtils.clamp(
      timeOfDayInHours,
      minSun,
      maxSun
    );
    const input_range = maxSun - minSun;
    const input_normalized = (valueInRange - minSun) / input_range;
    const degrees = THREE.MathUtils.lerp(-89, 89, input_normalized);
    return degrees;
  },

  getSunAzimuthDegreesAccordingToTimeOfDay: (timeOfDayInHours) => {
    return 90;
  },
};

export default Time;
