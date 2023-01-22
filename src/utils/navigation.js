import Animations from "./animations";

const Navigation = (camera, controls) => {
  return {
    default: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: 30, y: 20, z: -140 },
        { x: 50, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    },
    famara: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: -40, y: 20, z: -10 },
        { x: 50, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    },

    orzola: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: 120, y: 10, z: -70 },
        { x: 20, y: 0, z: -30 },
        t || 1600,
        cb || (() => {})
      );
    },

    macher: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: 30, y: 10, z: 100 },
        { x: -20, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    },

    tenesar: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: -30, y: 5, z: -20 },
        { x: -20, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    },
  };
};

export default Navigation;
