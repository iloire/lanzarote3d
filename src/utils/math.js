import * as THREE from "three";
const MathUtils = {
  getWindDirectionVector: (degreesFromNorth) => {
    const angleRadiansWind = THREE.MathUtils.degToRad(-degreesFromNorth);
    const directionWind = new THREE.Vector3().setFromSphericalCoords(
      1,
      Math.PI / 2,
      angleRadiansWind
    );
    return directionWind;
  },
};

export default MathUtils;
