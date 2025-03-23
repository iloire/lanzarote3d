import * as CANNON from "cannon-es";
import * as THREE from "three";

const Helpers = {
  drawSphericalPosition: (
    phiDegrees: number,
    thetaDegrees: number,
    len: number,
    scene: THREE.Scene
  ) => {
    const phi = THREE.MathUtils.degToRad(phiDegrees);
    const theta = THREE.MathUtils.degToRad(thetaDegrees);

    const pos = new THREE.Vector3();
    pos.setFromSphericalCoords(len, phi, theta);

    Helpers.drawPoint(scene, pos);
  },

  drawPoint(scene: THREE.Scene, position: THREE.Vector3) {
    const cubeSize = 1900;
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.copy(position);
    console.log(cube);
    scene.add(cube);
  },

  createHelpers: function (scene: THREE.Scene) {
    const grid = this.getGrid({ x: 0, y: 0 });
    scene.add(grid);
    scene.add(this.getAxisHelper(100));
  },

  getAxisHelper: function (len: number) {
    const axesHelperLength = len;
    const axesHelper = new THREE.AxesHelper(axesHelperLength);
    // The X axis is red. The Y axis is green. The Z axis is blue.
    return axesHelper;
  },

  getGrid: (pos: THREE.Vector3) => {
    const grid = new THREE.Object3D();
    const gridH = new THREE.GridHelper(100, 10, 0x0000ff, 0x808080);
    pos.y = 0;
    pos.x = 0;
    gridH.rotation.x = 0;
    grid.add(gridH);

    const gridV = new THREE.GridHelper(100, 10, 0x0000ff, 0x808080);
    pos.y = 0;
    pos.x = 0;
    gridV.rotation.x = -Math.PI / 2;
    grid.add(gridV);
    return grid;
  },

  /**
   * Creates visualization boxes around a mesh for better visibility during development
   * @param scene The scene to add the box helper to
   * @param mesh The mesh to visualize
   * @param color The color of the box
   * @param scale Optional scale factor for the custom box (default 1.2)
   * @returns The BoxHelper object that needs to be updated in the animation loop
   */
  createMeshVisualization: function (
    scene: THREE.Scene,
    mesh: THREE.Object3D,
    color: number = 0xff0000,
    scale: number = 1.2
  ): THREE.BoxHelper {
    // Create a bounding box helper
    const boxHelper = new THREE.BoxHelper(mesh, color);
    scene.add(boxHelper);

    // Create wireframe box with defined size for better visibility
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const meshSize = new THREE.Vector3();
    boundingBox.getSize(meshSize);

    // Create custom sized wireframe box slightly larger than the actual object
    const boxGeometry = new THREE.BoxGeometry(
      meshSize.x * scale,
      meshSize.y * scale,
      meshSize.z * scale
    );
    const boxMaterial = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    mesh.add(boxMesh); // Add to the original mesh to follow its transformations

    return boxHelper;
  },

  /**
   * Creates a visual representation of a CANNON.Box physics shape
   * @param scene The scene to add the visualization to
   * @param body The CANNON body containing the box shape
   * @param shapeIndex Optional index of the shape in the body's shapes array (defaults to 0)
   * @param color The color of the wireframe box
   * @returns The mesh representing the CANNON.Box
   */
  createCannonBoxVisualization: function (
    scene: THREE.Scene,
    body: CANNON.Body,
    shapeIndex: number = 0,
    color: number = 0xffff00
  ): THREE.Mesh {
    // Verify the shape exists and is a box
    if (!body.shapes[shapeIndex] || !(body.shapes[shapeIndex] instanceof CANNON.Box)) {
      console.error('Shape is not a CANNON.Box or does not exist at specified index');
      return null;
    }

    const boxShape = body.shapes[shapeIndex] as CANNON.Box;

    // Get the dimensions from the CANNON.Box
    // Note: CANNON.Box uses halfExtents, so we double them for Three.js
    const width = boxShape.halfExtents.x * 2;
    const height = boxShape.halfExtents.y * 2;
    const depth = boxShape.halfExtents.z * 2;

    // Create a Three.js box with the same dimensions
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });

    const boxMesh = new THREE.Mesh(geometry, material);
    scene.add(boxMesh);

    // Create an update function to keep the mesh position and rotation in sync with the physics body
    const updateMesh = () => {
      boxMesh.position.copy(body.position as any);
      boxMesh.quaternion.copy(body.quaternion as any);

      requestAnimationFrame(updateMesh);
    };

    // Start the update loop
    updateMesh();

    return boxMesh;
  },

  /**
   * Creates a text label that follows an object
   * @param scene The scene to add the label to
   * @param text The text to display in the label
   * @param position The initial position of the label
   * @param color The color of the text
   * @param size The size of the text (default: 1)
   * @param offset Vector3 offset from the position (default: 0,0,0)
   * @returns The label mesh
   */
  createLabel: function (
    scene: THREE.Scene,
    text: string,
    position: THREE.Vector3,
    color: number = 0xffffff,
    size: number = 1,
    offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  ): THREE.Object3D {
    // Create a canvas for the texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    // Fill the canvas with a transparent background
    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add text to the canvas
    context.font = '24px Arial';
    // Convert color to hex string safely
    const colorHex = color.toString(16);
    const paddedColorHex = '000000'.substring(0, 6 - colorHex.length) + colorHex;
    context.fillStyle = '#' + paddedColorHex;
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);

    // Create a sprite material with the texture
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    // Create a sprite with the material
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(size * 10, size * 5, 1);

    // Position the sprite
    sprite.position.copy(position).add(offset);

    // Add to scene
    scene.add(sprite);

    return sprite;
  },

  /**
   * Creates a visual representation of any CANNON.Shape with a label
   * @param scene The scene to add the visualization to
   * @param body The CANNON body containing the shape
   * @param color The color of the wireframe
   * @param label Optional label text to display
   * @returns The object containing the meshes, label and update function
   */
  createCannonShapeVisualization: function (
    scene: THREE.Scene,
    body: CANNON.Body,
    color: number = 0xffff00,
    label?: string
  ): { meshes: THREE.Object3D[], label?: THREE.Object3D, update: () => void } {
    const meshes: THREE.Object3D[] = [];
    let labelObject: THREE.Object3D = null;

    // Create meshes for each shape in the body
    body.shapes.forEach((shape, index) => {
      let mesh: THREE.Object3D = null;

      // Handle different types of shapes
      if (shape instanceof CANNON.Box) {
        const boxShape = shape as CANNON.Box;
        const width = boxShape.halfExtents.x * 2;
        const height = boxShape.halfExtents.y * 2;
        const depth = boxShape.halfExtents.z * 2;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({
          color: color,
          wireframe: true,
          transparent: true,
          opacity: 0.7
        });

        mesh = new THREE.Mesh(geometry, material);

        // Apply shape offset and orientation to the mesh
        if (body.shapeOffsets[index] && body.shapeOrientations[index]) {
          const offset = body.shapeOffsets[index];
          const orientation = body.shapeOrientations[index];

          // Create a container to handle offset and orientation
          const container = new THREE.Object3D();
          container.position.set(offset.x, offset.y, offset.z);
          container.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);

          container.add(mesh);
          mesh = container;
        }

        scene.add(mesh);
        meshes.push(mesh);
      } else if (shape instanceof CANNON.Sphere) {
        const sphereShape = shape as CANNON.Sphere;
        const radius = sphereShape.radius;

        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({
          color: color,
          wireframe: true,
          transparent: true,
          opacity: 0.7
        });

        mesh = new THREE.Mesh(geometry, material);

        // Apply shape offset and orientation
        if (body.shapeOffsets[index] && body.shapeOrientations[index]) {
          const offset = body.shapeOffsets[index];
          const orientation = body.shapeOrientations[index];

          const container = new THREE.Object3D();
          container.position.set(offset.x, offset.y, offset.z);
          container.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);

          container.add(mesh);
          mesh = container;
        }

        scene.add(mesh);
        meshes.push(mesh);
      }
      // Add other shape types here as needed (Plane, etc.)
    });

    // Add label if provided
    if (label) {
      // Get estimated size of the body for proper offset
      let maxSize = 0;
      body.shapes.forEach(shape => {
        if (shape instanceof CANNON.Box) {
          const box = shape as CANNON.Box;
          maxSize = Math.max(maxSize, box.halfExtents.x * 2, box.halfExtents.y * 2, box.halfExtents.z * 2);
        } else if (shape instanceof CANNON.Sphere) {
          const sphere = shape as CANNON.Sphere;
          maxSize = Math.max(maxSize, sphere.radius * 2);
        }
      });

      // Create label with an offset above the shape
      const labelOffset = new THREE.Vector3(0, maxSize * 0.6, 0);
      labelObject = this.createLabel(
        scene,
        label,
        new THREE.Vector3().copy(body.position as any),
        color,
        maxSize * 0.25,
        labelOffset
      );

      // Store offset for later updates
      labelObject.userData = { offset: labelOffset };
    }

    // Create an update function
    const update = () => {
      // Update mesh positions and rotations
      meshes.forEach(mesh => {
        if (mesh instanceof THREE.Mesh) {
          // Direct shape with no offset
          mesh.position.copy(body.position as any);
          mesh.quaternion.copy(body.quaternion as any);
        } else {
          // Container with shape offset
          mesh.position.copy(body.position as any);
          mesh.quaternion.copy(body.quaternion as any);
        }
      });

      // Update label position if it exists
      if (labelObject) {
        const bodyPos = new THREE.Vector3().copy(body.position as any);
        const labelOffset = labelObject.userData.offset || new THREE.Vector3(0, 5, 0);
        labelObject.position.copy(bodyPos).add(labelOffset);
      }
    };

    return { meshes, label: labelObject, update };
  }
};
export default Helpers;
