import * as CANNON from "cannon-es";
import * as THREE from "three";

// Force visualization constants with better scaling
const FORCE_SCALE = 0.01; // Base scale factor for force visualization
const WING_FORCE_SCALE = 0.2; // Wing forces need more visibility
const PILOT_FORCE_SCALE = 1; // Pilot forces scale

// Vector colors with better distinction
const COLORS = {
  LIFT: 0x00ff00,     // Green
  DRAG: 0xff0000,     // Red
  WEIGHT: 0xffff00,   // Yellow
  GLIDE_DIRECTION: 0x0000ff,    // Blue
};

// Helper function to convert color number to CSS color string
function colorToHexString(color: number): string {
  // Convert to hex and ensure it has 6 digits
  let hexStr = color.toString(16);
  while (hexStr.length < 6) {
    hexStr = '0' + hexStr;
  }
  return '#' + hexStr;
}

export class VectorVisualizater {
  // Arrow helpers
  private liftArrow: THREE.ArrowHelper;
  private dragArrow: THREE.ArrowHelper;
  private glideDirectionArrow: THREE.ArrowHelper;
  private weightArrow: THREE.ArrowHelper;

  // Text labels for forces
  private forceLabels: { [key: string]: THREE.Sprite } = {};

  // Groups to organize forces by where they're applied
  private gliderForceGroup: THREE.Group;
  private pilotForceGroup: THREE.Group;
  private forceGroup: THREE.Group;

  // Scale factors
  private customScaleFactor: number = 1.0;

  constructor(parent: THREE.Object3D) {
    // Create main force group
    this.forceGroup = new THREE.Group();
    parent.add(this.forceGroup);

    // Create separate groups for wing and pilot forces
    this.gliderForceGroup = new THREE.Group();
    this.pilotForceGroup = new THREE.Group();

    this.forceGroup.add(this.gliderForceGroup);
    this.forceGroup.add(this.pilotForceGroup);

    this.setupArrows();
    this.setupLabels();
  }

  private createTextSprite(text: string, color: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;  // Doubled canvas width
    canvas.height = 256; // Doubled canvas height

    // Draw text with larger font size
    context.font = "Bold 64px Arial"; // Increased from 36px to 64px
    context.fillStyle = colorToHexString(color);
    context.strokeStyle = '#000000'; // Add black outline for better visibility
    context.lineWidth = 3;
    context.fillText(text, 20, 100); // Adjusted position for larger text
    context.strokeText(text, 20, 100);

    // Create sprite with larger scale
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(25, 12.5, 1); // Increased from 10,5,1 to make labels much bigger

    return sprite;
  }

  private setupLabels() {
    // Create text labels for each force
    this.forceLabels['lift'] = this.createTextSprite("LIFT", COLORS.LIFT);
    this.forceLabels['drag'] = this.createTextSprite("DRAG", COLORS.DRAG);
    this.forceLabels['weight'] = this.createTextSprite("WEIGHT", COLORS.WEIGHT);
    this.forceLabels['glideDirection'] = this.createTextSprite("GLIDE DIRECTION", COLORS.GLIDE_DIRECTION);
    // Add labels to their respective groups
    this.gliderForceGroup.add(this.forceLabels['lift']);
    this.gliderForceGroup.add(this.forceLabels['drag']);
    this.gliderForceGroup.add(this.forceLabels['glideDirection']);
    this.pilotForceGroup.add(this.forceLabels['weight']);

    // Hide labels by default (will be positioned in update)
    // Compatible alternative to Object.values
    Object.keys(this.forceLabels).forEach(key => {
      this.forceLabels[key].visible = false;
    });
  }

  private setupArrows() {
    // Create materials for different forces with thicker lines
    const liftMaterial = new THREE.LineBasicMaterial({ color: COLORS.LIFT, linewidth: 3 });
    const dragMaterial = new THREE.LineBasicMaterial({ color: COLORS.DRAG, linewidth: 3 });
    const glideDirectionMaterial = new THREE.LineBasicMaterial({ color: COLORS.GLIDE_DIRECTION, linewidth: 3 });
    const weightMaterial = new THREE.LineBasicMaterial({ color: COLORS.WEIGHT, linewidth: 3 });

    // Create arrows with more distinctive sizing
    this.liftArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.LIFT,
      3, // larger head
      1.5 // wider head
    );
    this.liftArrow.line.material = liftMaterial;

    this.dragArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.DRAG,
      3,
      1.5
    );
    this.dragArrow.line.material = dragMaterial;


    this.weightArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.WEIGHT,
      3,
      1.5
    );
    this.weightArrow.line.material = weightMaterial;

    this.glideDirectionArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.GLIDE_DIRECTION,
      3,
      1.5
    );
    this.glideDirectionArrow.line.material = glideDirectionMaterial;
    // Add wing-related forces to wing force group
    this.gliderForceGroup.add(this.liftArrow);
    this.gliderForceGroup.add(this.dragArrow);
    this.gliderForceGroup.add(this.glideDirectionArrow);
    this.pilotForceGroup.add(this.weightArrow);

    // Set initial visibility to true by default
    this.forceGroup.visible = true;
  }

  private updateLabel(
    labelName: string,
    position: THREE.Vector3,
    direction: THREE.Vector3,
    length: number
  ) {
    const label = this.forceLabels[labelName];
    if (!label) return;

    // Position the label at the end of the arrow
    const targetPosition = position.clone().add(direction.clone().multiplyScalar(length + 8)); // Increased offset from 5 to 8
    label.position.copy(targetPosition);
    label.visible = length > 0.5; // Lowered threshold to show more labels
  }

  /**
   * Set the scale factor for all force visualizations
   * @param scale Scale factor to apply to all forces (default: 1.0)
   */
  setScale(scale: number): void {
    this.customScaleFactor = scale;
    console.log(`Force visualization scale set to: ${scale}`);
  }

  update(
    wingPosition: THREE.Vector3,
    pilotPosition: THREE.Vector3,
    liftVector: CANNON.Vec3,
    dragVector: CANNON.Vec3,
    weightVector: CANNON.Vec3,
    glideDirection: CANNON.Vec3
  ) {
    // Position the force groups at their respective objects
    this.gliderForceGroup.position.copy(wingPosition);
    this.pilotForceGroup.position.copy(pilotPosition);

    // Apply custom scale factor to all force visualizations
    const effectiveGliderScale = FORCE_SCALE * WING_FORCE_SCALE * this.customScaleFactor;
    const effectivePilotScale = FORCE_SCALE * PILOT_FORCE_SCALE * this.customScaleFactor;

    // Update forces applied to the WING

    // Safely extract lift force data
    try {
      // Update lift force visualization - apply from wing center
      const liftDirection = new THREE.Vector3(
        isNaN(liftVector.x) ? 0 : liftVector.x,
        isNaN(liftVector.y) ? 1 : liftVector.y,
        isNaN(liftVector.z) ? 0 : liftVector.z
      );

      // Safely normalize the direction
      if (liftDirection.length() > 0.001) {
        liftDirection.normalize();
      } else {
        liftDirection.set(0, 1, 0); // Default to upward if invalid
      }

      const liftLength = !isNaN(liftVector.length()) ? liftVector.length() * effectiveGliderScale : 0;
      this.liftArrow.setDirection(liftDirection);
      this.liftArrow.setLength(Math.max(0, liftLength)); // Ensure non-negative length
      this.liftArrow.position.set(0, 0, 0); // Relative to wing group
      this.updateLabel('lift', new THREE.Vector3(0, 0, 0), liftDirection, liftLength);
    } catch (e) {
      console.error("Error with lift force visualization:", e);
      this.liftArrow.visible = false;
      this.forceLabels['lift'].visible = false;
    }

    // Safely extract drag force data
    try {
      // Update drag force visualization - apply from wing center
      const dragDirection = new THREE.Vector3(
        isNaN(dragVector.x) ? 0 : dragVector.x,
        isNaN(dragVector.y) ? 0 : dragVector.y,
        isNaN(dragVector.z) ? -1 : dragVector.z
      );

      // Safely normalize the direction
      if (dragDirection.length() > 0.001) {
        dragDirection.normalize();
      } else {
        dragDirection.set(0, 0, -1); // Default to backward if invalid
      }

      const dragLength = !isNaN(dragVector.length()) ? dragVector.length() * effectiveGliderScale : 0;
      this.dragArrow.setDirection(dragDirection);
      this.dragArrow.setLength(Math.max(0, dragLength)); // Ensure non-negative length
      this.dragArrow.position.set(0, 0, 0); // Relative to wing group
      this.updateLabel('drag', new THREE.Vector3(0, 0, 0), dragDirection, dragLength);
    } catch (e) {
      console.error("Error with drag force visualization:", e);
      this.dragArrow.visible = false;
      this.forceLabels['drag'].visible = false;
    }


    // Update WEIGHT force visualization - apply from pilot center
    try {
      const weightDirection = new THREE.Vector3(weightVector.x, weightVector.y, weightVector.z);

      // Safely normalize the direction
      if (weightDirection.length() > 0.001) {
        weightDirection.normalize();
      } else {
        weightDirection.set(0, -1, 0); // Default to downward if invalid
      }

      const weightLength = weightVector.length() * effectivePilotScale;
      this.weightArrow.setDirection(weightDirection);
      this.weightArrow.setLength(Math.max(0, weightLength)); // Ensure non-negative length
      this.weightArrow.position.set(0, 0, 0); // Relative to pilot group
      this.updateLabel('weight', new THREE.Vector3(0, 0, 0), weightDirection, weightLength);
    } catch (e) {
      console.error("Error with weight force visualization:", e);
      this.weightArrow.visible = false;
      this.forceLabels['weight'].visible = false;
    }

    // Update GLIDE DIRECTION force visualization - apply from pilot center
    try {
      const glideDirectionDirection = new THREE.Vector3(glideDirection.x, glideDirection.y, glideDirection.z);
      this.glideDirectionArrow.setDirection(glideDirectionDirection);
      this.glideDirectionArrow.setLength(Math.max(0, glideDirection.length() * effectivePilotScale));
      this.glideDirectionArrow.position.set(0, 0, 0); // Relative to pilot group
    } catch (e) {
      console.error("Error with glide direction force visualization:", e);
      this.glideDirectionArrow.visible = false;
      this.forceLabels['glideDirection'].visible = false;
    }

  }

  setVisible(visible: boolean) {
    this.forceGroup.visible = visible;
    console.log(`Force visualization visibility set to: ${visible}`);
  }

  isVisible(): boolean {
    return this.forceGroup.visible;
  }
} 