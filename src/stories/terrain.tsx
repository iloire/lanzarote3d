import * as THREE from "three";
import Sky from "../components/sky";
import textureImg from "../textures/h-map-lanzarote.png";
import Controls from "../utils/controls";
const terrainGenerator1 = (groundGeo, displacement) => {
  const groundMaterial = new THREE.MeshPhongMaterial({
    wireframe: true,
    color: "red",
    reflectivity: 0.4,
    displacementMap: displacement,
    displacementScale: 623,
    displacementBias: 0.2,
    map: displacement,
  });
  const mesh = new THREE.Mesh(groundGeo, groundMaterial);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
};

const terrainGenerator2 = (groundGeo, displacement) => {
  const groundMaterial2 = new THREE.MeshPhongMaterial({
    color: "yellow",
    reflectivity: 0.4,
    displacementMap: displacement,
    displacementScale: 323,
    displacementBias: 0.2,
    map: displacement,
  });
  const mesh = new THREE.Mesh(groundGeo, groundMaterial2);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
};

const terrainGenerator3 = (groundGeo, displacement) => {
  const groundMaterial2 = new THREE.MeshPhongMaterial({
    wireframe: true,
    color: "yellow",
    reflectivity: 0.4,
    displacementMap: displacement,
    displacementScale: 323,
    displacementBias: 0.2,
    map: displacement,
  });
  const mesh = new THREE.Mesh(groundGeo, groundMaterial2);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
};

const waterGenerator = () => {
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 300, 300);
  const waterMaterial = new THREE.MeshPhongMaterial({
    wireframe: false,
    color: "blue",
    // displacementBias: 2,
  });
  const mesh = new THREE.Mesh(waterGeometry, waterMaterial);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
};

const Terrain = {
  load: async (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui
  ) => {
    water.visible = false;
    terrain.visible = false;

    sky.updateSunPosition(14);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const loader = new THREE.TextureLoader();
    const displacement = loader.load(textureImg);
    const groundGeometry = new THREE.PlaneGeometry(10000, 10000, 300, 300);

    const mesh1 = terrainGenerator1(groundGeometry, displacement);
    mesh1.position.set(0, -20, 10);

    const mesh2 = terrainGenerator2(groundGeometry, displacement);
    mesh2.position.set(0, -20, 1900);

    const mesh3 = terrainGenerator3(groundGeometry, displacement);
    mesh3.position.set(0, -20, 4900);

    scene.add(mesh1);
    scene.add(mesh2);
    scene.add(mesh3);
    scene.add(waterGenerator());

    camera.position.set(4120, 2500, 12000);
    const controls = Controls.createControls(camera, renderer);
  },
};

export default Terrain;
