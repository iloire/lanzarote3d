import * as THREE from "three";
import Wind from "../audio/wind.js";
import PG from "../elements/pg";
import GUI from "lil-gui";
import Controls from "../utils/controls.js";
import Helpers from "../utils/helpers";
import WindIndicator from "../elements/wind-indicator";

const gui = new GUI();
const G = 9.82;

const settings = {
  sensitivity: 0.01,
  xSpeed: 0.001,
  rotationSensitivity: 0.007,
  mouseControl: false,
  orbitControl: true,
  followCam: false,
  windDirectionDegreesFromNorth: 310,
  windSpeed: 0.0007,
  pgKg: 80,
  pgArea: 24,
  pgGlidingRatio: 8,
};

const nav = gui.addFolder("Navigation");
nav.add(settings, "mouseControl");
nav.add(settings, "xSpeed", 0, 0.01);
nav.add(settings, "rotationSensitivity", 0, 1);
nav.add(settings, "sensitivity", 0, 1);
nav.add(settings, "windDirectionDegreesFromNorth", 0, 360);
nav.add(settings, "windSpeed", 0, 0.01);

const getObjectPosition = (obj) => {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  return pos;
};

const getWorldDirection = (obj) => {
  const dir = new THREE.Vector3();
  obj.getWorldDirection(dir);
  return dir;
};

const getWorldQuaternion = (obj) => {
  const dir = new THREE.Quaternion();
  obj.getWorldQuaternion(dir);
  return dir;
};

const getWindDirectionVector = (degreesFromNorth) => {
  const angleRadiansWind = THREE.MathUtils.degToRad(-degreesFromNorth);
  const directionWind = new THREE.Vector3().setFromSphericalCoords(
    1,
    Math.PI / 2,
    angleRadiansWind
  );
  return directionWind;
};

const moveForward = (obj, windDirection, settings) => {
  const weightDirection = new THREE.Vector3(0, -1, 0);
  const weightForceValue = settings.pgKg * G;
  const weightForce = weightDirection.multiplyScalar(weightForceValue);

  const speed = settings.xSpeed;
  const rotationPG = obj.quaternion.clone();
  const directionPG = new THREE.Vector3(0, 1, 0);
  directionPG.applyQuaternion(rotationPG);
  const velocity = directionPG.multiplyScalar(speed);

  const velocityWind = windDirection.multiplyScalar(settings.windSpeed);

  obj.position.add(velocity);
  obj.position.add(velocityWind);
};

const moveVertical = (obj, windDirection, windSpeed, terrain) => {
  console.log(terrain);
  const lift = getLiftValue(obj, windDirection, windSpeed, terrain);
  console.log(lift);
  const liftDirection = new THREE.Vector3(0, 1, 0);
  const liftVector = liftDirection.multiplyScalar(lift);
  obj.position.add(liftVector);
};

const createArrowHelperForObj = (obj, len, color) => {
  const dir = getWorldDirection(obj);
  const arrow = new THREE.ArrowHelper(
    dir,
    { x: 0, y: 0, z: 0 },
    len,
    color || 0xffffff
  );
  // arrow.rotateX(-Math.PI / 2);
  return arrow;
};

const getLiftValue = (pg, windDirection, windSpeed, terrain) => {
  const pos = pg.position;
  const rayVertical = new THREE.Raycaster(
    pos,
    new THREE.Vector3(0, -1, 0) // vertical
  );
  // console.log(windSpeed, terrain);

  const intersectsFloor = rayVertical.intersectObject(terrain);
  // console.log(intersectsFloor);
  if (intersectsFloor.length) {
    // console.log("intersects, ", intersectsFloor[0].point.y);
    const terrainBelowHeight = intersectsFloor[0].point.y;
    return THREE.MathUtils.smoothstep(terrainBelowHeight, 1, 10);
  } else {
    return 0;
  }
};

class Paraglider extends THREE.Object3D {
  gravityDirection = new THREE.Vector3(0, -1, 0);

  constructor(gladingRatio) {
    super();
    if (!gladingRatio) {
      throw new Error("missing glading ratio");
    }
    this.gladingRatio = gladingRatio;
  }

  async loadModel(scale, position) {
    // const group = new THREE.Group();
    const mesh = await Models.load(model, scale, pos);
    const pg = await PG.load(scale, position);

    // TODO: calculate ro3tation in every axis according to velocity vector, not just x
    const axis = new THREE.Vector3(1, 0, 0);
    pg.rotateOnAxis(axis, this.getAttackAngleRadians());

    const arrow = createArrowHelperForObj(pg);
    // group.add(pg);
    pg.add(arrow);
    // pg.add(this.getDirectionHelper(pg));
    pg.add(this.getGravityHelper(pg, 1));
    this.model = pg;
  }

  getAttackAngleRadians() {
    const angle = Math.atan(1 / this.gladingRatio);
    console.log("angle radians", angle);
    return angle;
  }

  addGui(gui) {
    const pg = this.model;
    const pgGui = gui.addFolder("Paraglider");
    pgGui.add(pg.rotation, "x", -Math.PI, Math.PI).name("rotation.x");
    pgGui.add(pg.rotation, "y", -Math.PI, Math.PI).name("rotation.y");
    pgGui.add(pg.rotation, "z", -Math.PI, Math.PI).name("rotation.z");

    pgGui.add(pg.position, "x", -100, 100).name("position.x");
    pgGui.add(pg.position, "y", 0, 100).name("position.y");
    pgGui.add(pg.position, "z", -100, 100).name("position.z");

    pgGui.add(settings, "pgKg", -100, 100).name("kg");
    pgGui.add(settings, "pgArea", -100, 100).name("area");
    return pgGui;
  }

  rotateLeft() {
    // const axis = new THREE.Vector3(0, 1, 0);
    // const localAxis = new THREE.Vector3(0, 1, 0);
    // localAxis.applyQuaternion(this.model.quaternion);

    // this.model.rotateOnAxis(localAxis, Math.PI * settings.rotationSensitivity);
    this.model.rotation.z += Math.PI * settings.rotationSensitivity;
    // this.helper.rotation.y += Math.PI * settings.rotationSensitivity;
  }

  rotateRight() {
    this.model.rotation.z -= Math.PI * settings.rotationSensitivity;
    // this.helper.rotation.y -= Math.PI * settings.rotationSensitivity;
  }

  getGravityHelper(obj, len, color) {
    const arrow = new THREE.ArrowHelper(
      this.gravityDirection,
      { x: 0, y: 0, z: 0 },
      len,
      color || 0x00ffff
    );
    return arrow;
  }

  move() {
    const weightForceValue = settings.pgKg * G;
    const weightForce = this.gravityDirection.multiplyScalar(weightForceValue);
  }
}

const Game = {
  load: async (camera, scene, renderer, terrain, water) => {
    const cameraGui = gui.addFolder("Camera");
    cameraGui.add(camera.position, "x", -100, 100).name("x");
    cameraGui.add(camera.position, "y", 0, 100).name("y");
    cameraGui.add(camera.position, "z", -100, 100).name("z");

    cameraGui.add(camera.rotation, "x", -Math.PI, Math.PI).name("rotation.x");
    cameraGui.add(camera.rotation, "y", -Math.PI, Math.PI).name("rotation.y");
    cameraGui.add(camera.rotation, "z", -Math.PI, Math.PI).name("rotation.z");

    cameraGui.add(settings, "followCam");

    const controls = Controls.createControls(camera, renderer);
    controls.enabled = settings.orbitControl;
    gui.add(controls, "enabled").name("orbit controls");

    const p = {
      scale: 1,
      position: { x: 27, y: 7, z: 5 },
    };
    console.log(settings);
    const pg = new Paraglider(settings.pgGlidingRatio);
    await pg.loadModel(p.scale, p.position);
    pg.addGui(gui);
    scene.add(pg.model);

    const windIndicator = WindIndicator.load(
      settings.windDirectionDegreesFromNorth,
      14,
      {
        x: 0,
        y: 0,
        z: 0,
      }
    );
    scene.add(windIndicator);

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
      var keyCode = event.which;
      if (keyCode == 87) {
        //w
        // moveForward(xSpeed);
      } else if (keyCode == 65) {
        //a
        pg.rotateLeft();
      } else if (keyCode == 68) {
        //d
        pg.rotateRight();
      }
    }
    // Wind.load(camera);
    renderer.domElement.addEventListener("mousemove", (event) => {
      if (settings.mouseControl) {
        camera.quaternion.y -= (event.movementX * settings.sensitivity) / 20;
        camera.quaternion.x -= (event.movementY * settings.sensitivity) / 20;
      }
    });

    const windDirection = getWindDirectionVector(
      settings.windDirectionDegreesFromNorth
    );

    // const raycaster = getLiftValue(pg.position, terrain);
    //
    // scene.add(
    //   new THREE.ArrowHelper(
    //     raycaster.ray.direction,
    //     raycaster.ray.origin,
    //     300,
    //     0xff0000
    //   )
    // );

    // const dir = new THREE.Vector3(0, -1, 0);
    // const arrow2 = new THREE.ArrowHelper(dir, pg.position, 10);
    // scene.add(arrow2);

    const animate = () => {
      // setTimeout(animate, 1200);
      requestAnimationFrame(animate);
      const timer = Date.now() * 0.0005;
      camera.position.y += Math.sin(timer) * 0.0003;

      if (settings.followCam) {
        const cameraOffset = new THREE.Vector3(-2, 0.5, -2);
        camera.position.copy(getObjectPosition(pg)).add(cameraOffset);
        camera.lookAt(pg.position);
      }
      if (controls.enabled) {
        controls.update();
      }
      const windDirection = getWindDirectionVector(
        settings.windDirectionDegreesFromNorth
      );
      // moveVertical(pg, windDirection, settings.windSpeed, terrain);
      // moveVertical(arrow, windDirection, settings.windSpeed, terrain);
      moveForward(pg.model, windDirection, settings);
      // moveForward(arrow, windDirection, settings);

      renderer.render(scene, camera);
    };

    camera.position.set(30, 150, 80);
    camera.lookAt(pg.position);

    animate();
    console.log("Number of Triangles :", renderer.info.render.triangles);
  },
};

export default Game;
