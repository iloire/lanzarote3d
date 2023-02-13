import Cloud from "../elements/cloud";
import * as THREE from "three";

const Clouds = {
  load: async (scale, pos) => {
    // clouds
    const clouds = [
      {
        type: 0,
        scale: 0.3,
        location: { x: pos.x + 0, y: pos.y + 2, z: pos.z + 3 },
      },
      {
        type: 1,
        scale: 0.03,
        location: { x: pos.x + 0, y: pos.y + 3, z: pos.z + 3 },
      },
      {
        type: 0,
        scale: 0.3,
        location: { x: pos.x + 0, y: pos.y + 3, z: pos.z + 4 },
      },
    ];

    const group = new THREE.Group();
    clouds.forEach(async (cloud) => {
      const c = await Cloud.load(cloud.type, cloud.scale, cloud.location);
      group.add(c);
    });
    return group;
  },
};

export default Clouds;
