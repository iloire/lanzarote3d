import Animations from "./animations";

const Navigation = (camera, controls) => {
  const nav = {
    default: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: 30, y: 10, z: -115 },
        { x: 50, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    },

    famara: (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: -40, y: 10, z: -10 },
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

  const xSpeed = 1;
  const ySpeed = 1;
  document.addEventListener("keydown", onDocumentKeyDown, false);
  function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 87) {
      //w
      camera.position.y += ySpeed;
    } else if (keyCode == 83) {
      //s
      camera.position.y -= ySpeed;
    } else if (keyCode == 65) {
      //a
      camera.position.x -= xSpeed;
    } else if (keyCode == 68) {
      //d
      camera.position.x += xSpeed;
    } else if (keyCode == 32) {
      //space
      camera.position.set(0, 0, 0);
    }
  }

  document.querySelectorAll(".point").forEach((item) => {
    item.addEventListener(
      "click",
      (event) => {
        let className =
          event.target.classList[event.target.classList.length - 1];
        switch (className) {
          case "label-0": // famara
            nav.famara();
            break;
          case "label-1": // mirador Orzola
            nav.orzola();
            break;
          case "label-2": // macher
            nav.macher();
            break;
          case "label-3": // Tenesar
            nav.tenesar();
            break;
          default:
            break;
        }
      },
      false
    );
  });

  return nav;
};

export default Navigation;
