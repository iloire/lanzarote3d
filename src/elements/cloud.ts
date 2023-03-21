import * as THREE from "three";
import blackCloud from "../models/clouds.glb";
import whiteCloud from "../models/low_poly_cloud.glb";
import Models from "../utils/models";
import textureImg from "../textures/mars1.jpg";
import { rndBetween, rndIntBetween } from "../utils/math";

const mat_cloud = new THREE.MeshLambertMaterial({ color: 0xffffff });
const mat_cloud2 = new THREE.MeshLambertMaterial({ color: 0x666666 });
const mat_cloud3 = new THREE.MeshLambertMaterial({ color: 0x999999 });

const materials = [mat_cloud, mat_cloud2, mat_cloud3];

export type CloudType = "BLACK" | "WHITE";

const getGlbCloud = async (type: CloudType) => {
  const mesh = await Models.loadSimple(
    type === "BLACK" ? blackCloud : whiteCloud
  );

  const textureLoader = new THREE.TextureLoader();
  const texture = await textureLoader.load(textureImg);
  mesh.material = new THREE.MeshStandardMaterial({
    map: texture,
    depthTest: true,
  });
  const scale = type === "BLACK" ? 2 : 30;
  mesh.scale.set(scale, scale, scale);
  return mesh;
};

const generateCloudPart = (
  radius: number,
  scale: number,
  material: THREE.Material
) => {
  const geo_cloudPart = new THREE.IcosahedronGeometry(radius, 0);
  const cloudPart = new THREE.Mesh(geo_cloudPart, material);
  const scaleX = rndBetween(scale * 0.9, scale * 1.1);
  const scaleY = rndBetween(scale * 0.9, scale * 1.1);
  const scaleZ = rndBetween(scale * 0.9, scale * 1.1);
  cloudPart.scale.set(scaleX, scaleY, scaleZ);
  cloudPart.rotation.z = -0.5;
  cloudPart.rotation.x = -0.2;
  cloudPart.castShadow = true;
  return cloudPart;
};

const generateCloud = async () => {
  const radius = 40;
  const r = rndBetween;
  const n = rndIntBetween(3, 8);
  const group = new THREE.Group();

  const material = materials[rndIntBetween(0, materials.length)];

  for (let i = 0; i < n; i++) {
    const scale = r(i * 0.9, i * 1.1);
    const posX = 1.7 * radius * r(-1 * i, i);
    const posY = 0.3 * radius * r(-1 * i, i);
    const posZ = 1.2 * radius * r(-1 * i, i);
    const p = generateCloudPart(radius, scale, material);
    p.position.set(posX, posY, posZ);
    group.add(p);
  }

  return group;
};

const experimental = true;

const Cloud = {
  load: async (type: CloudType): Promise<THREE.Object3D> => {
    const mesh = !experimental
      ? await getGlbCloud(type)
      : await generateCloud();

    const animate = (mesh: THREE.Mesh) => {
      const timer = (Date.now() + Math.random() * 1000) * 0.0001;
      mesh.position.y = mesh.position.y + Math.sin(timer) * 0.1;
      requestAnimationFrame(() => animate(mesh));
    };
    animate(mesh);
    return mesh;
  },
};

export default Cloud;
