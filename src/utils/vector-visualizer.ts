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
  LEFT_BREAK: 0xff00ff,   // Magenta
  RIGHT_BREAK: 0x00ffff,  // Cyan
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
  private leftBreakArrow: THREE.ArrowHelper;
  private rightBreakArrow: THREE.ArrowHelper;

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
    canvas.width = 512;
    canvas.height = 256;

    // Draw text with larger font size
    context.font = "Bold 48px Arial"; // Slightly smaller for title
    context.fillStyle = colorToHexString(color);
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.textAlign = 'left';
    context.fillText(text, 20, 80);
    context.strokeText(text, 20, 80);

    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(25, 12.5, 1);

    return sprite;
  }

  private setupLabels() {
    // Create text labels for each force
    this.forceLabels['lift'] = this.createTextSprite("LIFT", COLORS.LIFT);
    this.forceLabels['drag'] = this.createTextSprite("DRAG", COLORS.DRAG);
    this.forceLabels['weight'] = this.createTextSprite("WEIGHT", COLORS.WEIGHT);
    this.forceLabels['glideDirection'] = this.createTextSprite("GLIDE", COLORS.GLIDE_DIRECTION);
    this.forceLabels['leftBreak'] = this.createTextSprite("L-BREAK", COLORS.LEFT_BREAK);
    this.forceLabels['rightBreak'] = this.createTextSprite("R-BREAK", COLORS.RIGHT_BREAK);

    // Add labels to their respective groups
    this.gliderForceGroup.add(this.forceLabels['lift']);
    this.gliderForceGroup.add(this.forceLabels['drag']);
    this.gliderForceGroup.add(this.forceLabels['glideDirection']);
    this.gliderForceGroup.add(this.forceLabels['leftBreak']);
    this.gliderForceGroup.add(this.forceLabels['rightBreak']);
    this.pilotForceGroup.add(this.forceLabels['weight']);

    // Hide labels by default
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
    const leftBreakMaterial = new THREE.LineBasicMaterial({ color: COLORS.LEFT_BREAK, linewidth: 3 });
    const rightBreakMaterial = new THREE.LineBasicMaterial({ color: COLORS.RIGHT_BREAK, linewidth: 3 });

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

    // Create left break arrow
    this.leftBreakArrow = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(-5, 0, 0), // Position offset to the left side of the wing
      10,
      COLORS.LEFT_BREAK,
      3,
      1.5
    );
    this.leftBreakArrow.line.material = leftBreakMaterial;

    // Create right break arrow
    this.rightBreakArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(5, 0, 0), // Position offset to the right side of the wing
      10,
      COLORS.RIGHT_BREAK,
      3,
      1.5
    );
    this.rightBreakArrow.line.material = rightBreakMaterial;

    // Add wing-related forces to wing force group
    this.gliderForceGroup.add(this.liftArrow);
    this.gliderForceGroup.add(this.dragArrow);
    this.gliderForceGroup.add(this.glideDirectionArrow);
    this.gliderForceGroup.add(this.leftBreakArrow);
    this.gliderForceGroup.add(this.rightBreakArrow);
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

    // Create a new canvas for dynamic text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    // Get the color based on label name
    const colorMap = {
      'lift': COLORS.LIFT,
      'drag': COLORS.DRAG,
      'weight': COLORS.WEIGHT,
      'glideDirection': COLORS.GLIDE_DIRECTION,
      'leftBreak': COLORS.LEFT_BREAK,
      'rightBreak': COLORS.RIGHT_BREAK
    };
    const color = colorMap[labelName] || COLORS.LIFT;

    // Format the magnitude to 2 decimal places
    const magnitude = (length / this.customScaleFactor).toFixed(2);

    // Draw the title
    context.font = "Bold 48px Arial";
    context.fillStyle = colorToHexString(color);
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.textAlign = 'left';

    // Get the label text based on the name
    const labelText = {
      'lift': 'LIFT',
      'drag': 'DRAG',
      'weight': 'WEIGHT',
      'glideDirection': 'GLIDE',
      'leftBreak': 'L-BREAK',
      'rightBreak': 'R-BREAK'
    }[labelName] || labelName.toUpperCase();

    context.fillText(labelText, 20, 80);
    context.strokeText(labelText, 20, 80);

    // Draw the magnitude below the title
    context.font = "40px Arial";
    context.fillText(`${magnitude}N`, 20, 140);
    context.strokeText(`${magnitude}N`, 20, 140);

    // Update the sprite's texture
    const texture = new THREE.CanvasTexture(canvas);
    (label.material as THREE.SpriteMaterial).map = texture;
    (label.material as THREE.SpriteMaterial).map.needsUpdate = true;

    // Position the label at the end of the arrow
    const targetPosition = position.clone().add(direction.clone().multiplyScalar(length + 8));
    label.position.copy(targetPosition);
    label.visible = length > 0.1; // Show labels for smaller forces
  }

  /**
   * Set the scale factor for all force visualizations
   * @param scale Scale factor to apply to all forces (default: 1.0)
   */
  setScale(scale: number): void {
    this.customScaleFactor = scale;
    console.log(`Force visualization scale set to: ${scale}`);
  }

  /**
   * Set visibility of all force visualizations
   * @param visible Whether the force visualizations should be visible
   */
  setVisible(visible: boolean): void {
    this.forceGroup.visible = visible;
  }

  update(
    wingPosition: THREE.Vector3,
    pilotPosition: THREE.Vector3,
    liftVector: CANNON.Vec3,
    dragVector: CANNON.Vec3,
    weightVector: CANNON.Vec3,
    glideDirection: CANNON.Vec3,
    leftBreakVector?: CANNON.Vec3,
    rightBreakVector?: CANNON.Vec3
  ) {
    // Position the force groups at their respective objects
    this.gliderForceGroup.position.copy(wingPosition);
    this.pilotForceGroup.position.copy(pilotPosition);

    // Update each vector using the individual update functions
    this.updateLiftVector(wingPosition, liftVector);
    this.updateDragVector(wingPosition, dragVector);
    this.updateWeightVector(pilotPosition, weightVector);
    this.updateGlideDirectionVector(wingPosition, glideDirection);
    this.updateLeftBreakVector(wingPosition, leftBreakVector || null);
    this.updateRightBreakVector(wingPosition, rightBreakVector || null);
  }

  isVisible(): boolean {
    return this.forceGroup.visible;
  }

  /**
   * Update lift vector independently
   * @param wingPosition Position where the lift force is applied
   * @param liftVector The lift force vector
   */
  updateLiftVector(wingPosition: THREE.Vector3, liftVector: CANNON.Vec3): void {
    this.gliderForceGroup.position.copy(wingPosition);
    const effectiveGliderScale = FORCE_SCALE * WING_FORCE_SCALE * this.customScaleFactor;

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
      this.liftArrow.visible = true;
    } catch (e) {
      console.error("Error with lift force visualization:", e);
      this.liftArrow.visible = false;
      this.forceLabels['lift'].visible = false;
    }
  }

  /**
   * Update drag vector independently
   * @param wingPosition Position where the drag force is applied
   * @param dragVector The drag force vector
   */
  updateDragVector(wingPosition: THREE.Vector3, dragVector: CANNON.Vec3): void {
    this.gliderForceGroup.position.copy(wingPosition);
    const effectiveGliderScale = FORCE_SCALE * WING_FORCE_SCALE * this.customScaleFactor;

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
      this.dragArrow.visible = true;
    } catch (e) {
      console.error("Error with drag force visualization:", e);
      this.dragArrow.visible = false;
      this.forceLabels['drag'].visible = false;
    }
  }

  /**
   * Update weight vector independently
   * @param pilotPosition Position where the weight force is applied
   * @param weightVector The weight force vector
   */
  updateWeightVector(pilotPosition: THREE.Vector3, weightVector: CANNON.Vec3): void {
    this.pilotForceGroup.position.copy(pilotPosition);
    const effectivePilotScale = FORCE_SCALE * PILOT_FORCE_SCALE * this.customScaleFactor;

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
      this.weightArrow.visible = true;
    } catch (e) {
      console.error("Error with weight force visualization:", e);
      this.weightArrow.visible = false;
      this.forceLabels['weight'].visible = false;
    }
  }

  /**
   * Update glide direction vector independently
   * @param wingPosition Position where the glide direction is applied
   * @param glideDirectionVector The glide direction vector
   */
  updateGlideDirectionVector(wingPosition: THREE.Vector3, glideDirectionVector: CANNON.Vec3): void {
    this.gliderForceGroup.position.copy(wingPosition);
    const effectiveGliderScale = FORCE_SCALE * WING_FORCE_SCALE * this.customScaleFactor;

    try {
      const glideDirectionDirection = new THREE.Vector3(
        glideDirectionVector.x,
        glideDirectionVector.y,
        glideDirectionVector.z
      );

      // Safely normalize the direction
      if (glideDirectionDirection.length() > 0.001) {
        glideDirectionDirection.normalize();
      } else {
        glideDirectionDirection.set(0, 0, -1); // Default to forward if invalid
      }

      const glideLength = glideDirectionVector.length() * effectiveGliderScale;
      this.glideDirectionArrow.setDirection(glideDirectionDirection);
      this.glideDirectionArrow.setLength(Math.max(0, glideLength));
      this.glideDirectionArrow.position.set(0, 0, 0);
      this.updateLabel('glideDirection', new THREE.Vector3(0, 0, 0), glideDirectionDirection, glideLength);
      this.glideDirectionArrow.visible = true;
    } catch (e) {
      console.error("Error with glide direction visualization:", e);
      this.glideDirectionArrow.visible = false;
      this.forceLabels['glideDirection'].visible = false;
    }
  }

  /**
   * Update left break vector independently
   * @param wingPosition Position where the left break force is applied
   * @param leftBreakVector The left break force vector, or null to hide
   */
  updateLeftBreakVector(wingPosition: THREE.Vector3, leftBreakVector: CANNON.Vec3 | null): void {
    this.gliderForceGroup.position.copy(wingPosition);

    if (!leftBreakVector) {
      this.leftBreakArrow.visible = false;
      this.forceLabels['leftBreak'].visible = false;
      return;
    }

    const effectiveGliderScale = FORCE_SCALE * WING_FORCE_SCALE * this.customScaleFactor;

    try {
      const leftBreakDirection = new THREE.Vector3(
        isNaN(leftBreakVector.x) ? -1 : leftBreakVector.x,
        isNaN(leftBreakVector.y) ? 0 : leftBreakVector.y,
        isNaN(leftBreakVector.z) ? 0 : leftBreakVector.z
      );

      // Safely normalize the direction
      if (leftBreakDirection.length() > 0.001) {
        leftBreakDirection.normalize();
      } else {
        leftBreakDirection.set(-1, 0, 0); // Default to left if invalid
      }

      const leftBreakLength = !isNaN(leftBreakVector.length()) ? leftBreakVector.length() * effectiveGliderScale : 0;
      this.leftBreakArrow.setDirection(leftBreakDirection);
      this.leftBreakArrow.setLength(Math.max(0, leftBreakLength));
      this.leftBreakArrow.position.set(-5, 0, 0); // Position offset to the left side of the wing
      this.updateLabel('leftBreak', new THREE.Vector3(-5, 0, 0), leftBreakDirection, leftBreakLength);
      this.leftBreakArrow.visible = true;
    } catch (e) {
      console.error("Error with left break force visualization:", e);
      this.leftBreakArrow.visible = false;
      this.forceLabels['leftBreak'].visible = false;
    }
  }

  /**
   * Update right break vector independently
   * @param wingPosition Position where the right break force is applied
   * @param rightBreakVector The right break force vector, or null to hide
   */
  updateRightBreakVector(wingPosition: THREE.Vector3, rightBreakVector: CANNON.Vec3 | null): void {
    this.gliderForceGroup.position.copy(wingPosition);

    if (!rightBreakVector) {
      this.rightBreakArrow.visible = false;
      this.forceLabels['rightBreak'].visible = false;
      return;
    }

    const effectiveGliderScale = FORCE_SCALE * WING_FORCE_SCALE * this.customScaleFactor;

    try {
      const rightBreakDirection = new THREE.Vector3(
        isNaN(rightBreakVector.x) ? 1 : rightBreakVector.x,
        isNaN(rightBreakVector.y) ? 0 : rightBreakVector.y,
        isNaN(rightBreakVector.z) ? 0 : rightBreakVector.z
      );

      // Safely normalize the direction
      if (rightBreakDirection.length() > 0.001) {
        rightBreakDirection.normalize();
      } else {
        rightBreakDirection.set(1, 0, 0); // Default to right if invalid
      }

      const rightBreakLength = !isNaN(rightBreakVector.length()) ? rightBreakVector.length() * effectiveGliderScale : 0;
      this.rightBreakArrow.setDirection(rightBreakDirection);
      this.rightBreakArrow.setLength(Math.max(0, rightBreakLength));
      this.rightBreakArrow.position.set(5, 0, 0); // Position offset to the right side of the wing
      this.updateLabel('rightBreak', new THREE.Vector3(5, 0, 0), rightBreakDirection, rightBreakLength);
      this.rightBreakArrow.visible = true;
    } catch (e) {
      console.error("Error with right break force visualization:", e);
      this.rightBreakArrow.visible = false;
      this.forceLabels['rightBreak'].visible = false;
    }
  }
} 