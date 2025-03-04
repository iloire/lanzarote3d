import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';

const createVoxelElephant = () => {
  const group = new THREE.Group();
  const voxelSize = 50; // Smaller voxels for better detail

  let voxelCount = 0;
  console.log('Starting elephant creation');

  // Define elephant voxels - each array is a layer from bottom to top
  const elephantLayers = [
    // Layer 0 (feet)
    [
      [0,0,0,1,0,0,0,0,1,0,0,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
    ],
    // Layer 1 (legs)
    [
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
    ],
    // Layer 2 (lower body)
    [
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
    ],
    // Layer 3-4 (body)
    ...[0,1].map(() => [
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
    ]),
    // Layer 5 (upper body with trunk start)
    [
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
    ],
    // Layer 6 (head start and trunk)
    [
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
    ],
    // Layer 7 (head with ears spread)
    [
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
    ],
    // Layer 8 (top of head and ears)
    [
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
    ],
    // Layer 9 (ear tips)
    [
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [0,1,1,0,0,0,0,0,0,1,1,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
    ],
    // Trunk extension (layers 10-12)
    ...[0,1,2].map(() => [
      [0,0,0,0,0,1,1,0,0,0,0,0],
    ]),
  ];

  // Create a shared material for all voxels
  const material = new THREE.MeshPhongMaterial({ 
    color: 0x777777,
    specular: 0x111111,
    shininess: 30,
    flatShading: true
  });

  // Create voxels
  elephantLayers.forEach((layer, y) => {
    layer.forEach((row, z) => {
      row.forEach((voxel, x) => {
        if (voxel === 1) {
          voxelCount++;
          const geometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(
            x * voxelSize - (row.length * voxelSize) / 2,
            y * voxelSize,
            z * voxelSize - (layer.length * voxelSize) / 2
          );
          cube.rotation.y = Math.random() * 0.1;
          cube.rotation.x = Math.random() * 0.1;
          cube.rotation.z = Math.random() * 0.1;
          group.add(cube);
          
          console.log(`Added voxel at position:`, cube.position);
        }
      });
    });
  });

  console.log(`Created elephant with ${voxelCount} voxels`);
  
  // Center the group
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);
  group.position.y += box.max.y / 2; // Move up by half height to sit on ground

  console.log('Elephant bounds:', {
    min: box.min,
    max: box.max,
    center: center,
    finalPosition: group.position
  });

  return group;
};

export default createVoxelElephant; 