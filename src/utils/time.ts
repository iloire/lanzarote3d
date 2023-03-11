import * as THREE from "three";

const Time = {
  getSunAltitudeDegreesAccordingToTimeOfDay: (timeOfDayInHours) => {
    return THREE.MathUtils.lerp(80, -80, (timeOfDayInHours - 5) / 14);
  },

  getSunAzimuthDegreesAccordingToTimeOfDay: (timeOfDayInHours) => {
    return 90;
  },
};

export default Time;
