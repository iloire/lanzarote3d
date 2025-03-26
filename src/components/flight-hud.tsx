import * as THREE from 'three';

interface FlightHUDProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
}

interface FlightData {
  speed: number;
  altitude: number;
  verticalSpeed: number;
  position: THREE.Vector3;
  heading: number;
  lastAltitude?: number;
  lastUpdateTime?: number;
}

export class FlightHUD {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private hudScene: THREE.Scene;
  private hudCamera: THREE.OrthographicCamera;
  private speedText: THREE.Sprite;
  private altitudeText: THREE.Sprite;
  private horizonLines: THREE.Line[];
  private canvas: HTMLCanvasElement;
  private computerScreen: THREE.Mesh;
  private computerDisplayCanvas: HTMLCanvasElement;
  private computerDisplayTexture: THREE.Texture;
  private lastFlightData: FlightData;

  constructor({ scene, camera }: FlightHUDProps) {
    this.scene = scene;
    this.camera = camera;
    this.horizonLines = [];
    this.lastFlightData = {
      speed: 0,
      altitude: 0,
      verticalSpeed: 0,
      position: new THREE.Vector3(),
      heading: 0,
    };

    // Create a separate scene for HUD elements
    this.hudScene = new THREE.Scene();

    // Create an orthographic camera for the HUD
    this.hudCamera = new THREE.OrthographicCamera(
      -window.innerWidth / 2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      -window.innerHeight / 2,
      0,
      30
    );

    // Create canvas for text textures
    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 256;

    // Create canvas for computer display with higher resolution
    this.computerDisplayCanvas = document.createElement('canvas');
    this.computerDisplayCanvas.width = 600;
    this.computerDisplayCanvas.height = 300;
    this.computerDisplayTexture = new THREE.Texture(this.computerDisplayCanvas);

    // Initialize HUD elements
    this.initializeHUD();
    this.createComputerScreen();
    this.createHorizonLines();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createComputerScreen(): void {
    // Create a plane geometry for the computer screen - reduced size
    const screenGeometry = new THREE.PlaneGeometry(200, 100);
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: this.computerDisplayTexture,
      transparent: true,
      opacity: 0.9
    });

    this.computerScreen = new THREE.Mesh(screenGeometry, screenMaterial);
    this.computerScreen.position.set(0, -window.innerHeight / 2 + 120, 0);
    this.hudScene.add(this.computerScreen);
  }

  private updateComputerDisplay(flightData: FlightData): void {
    const context = this.computerDisplayCanvas.getContext('2d');
    if (!context) return;

    // Clear the canvas
    context.clearRect(0, 0, this.computerDisplayCanvas.width, this.computerDisplayCanvas.height);

    // Set background
    context.fillStyle = '#000033';
    context.fillRect(0, 0, this.computerDisplayCanvas.width, this.computerDisplayCanvas.height);

    // Add main border
    context.strokeStyle = '#00ff00';
    context.lineWidth = 2;
    context.strokeRect(4, 4, this.computerDisplayCanvas.width - 8, this.computerDisplayCanvas.height - 8);

    // Create grid layout
    this.drawGrid(context);

    // Draw flight data
    this.drawFlightData(context, flightData);

    // Add decorative elements
    this.drawDecorations(context);

    // Update the texture
    this.computerDisplayTexture.needsUpdate = true;
  }

  private drawGrid(context: CanvasRenderingContext2D): void {
    const width = this.computerDisplayCanvas.width;
    const height = this.computerDisplayCanvas.height;

    // Draw vertical dividers
    context.beginPath();
    context.strokeStyle = '#00ff00';
    context.lineWidth = 1;

    // Three vertical sections
    for (let i = 1; i < 3; i++) {
      const x = (width * i) / 3;
      context.moveTo(x, 10);
      context.lineTo(x, height - 10);
    }

    // Horizontal divider
    context.moveTo(10, height / 2);
    context.lineTo(width - 10, height / 2);
    context.stroke();
  }

  private drawFlightData(context: CanvasRenderingContext2D, data: FlightData): void {
    const width = this.computerDisplayCanvas.width;
    const height = this.computerDisplayCanvas.height;
    const sectionWidth = width / 4; // Changed to 4 sections

    // Helper function for section headers
    const drawHeader = (text: string, x: number, y: number) => {
      context.font = 'bold 20px monospace'; // Reduced font size
      context.fillStyle = '#00ff00';
      context.textAlign = 'center';
      context.fillText(text, x, y);
    };

    // Helper function for values
    const drawValue = (text: string, x: number, y: number, large = false) => {
      context.font = large ? 'bold 38px monospace' : 'bold 30px monospace'; // Reduced font sizes
      context.fillStyle = '#00ff00';
      context.textAlign = 'center';
      context.fillText(text, x, y);
    };

    // Helper function for units
    const drawUnits = (text: string, x: number, y: number) => {
      context.font = '22px monospace'; // Reduced font size
      context.fillStyle = '#00ff00';
      context.textAlign = 'center';
      context.fillText(text, x, y);
    };

    const firstRowY = 40;
    const secondRowY = 100;
    const thirdRowY = 140;

    // Speed Section (Top Left)
    drawHeader('SPEED', sectionWidth * 0.5, firstRowY);
    drawValue(Math.round(data.speed).toString(), sectionWidth * 0.5, secondRowY, true);
    drawUnits('km/h', sectionWidth * 0.5, thirdRowY);

    // Altitude Section (Top Center-Left)
    drawHeader('ALTITUDE', sectionWidth * 1.5, firstRowY);
    drawValue(Math.round(data.altitude).toString(), sectionWidth * 1.5, secondRowY, true);
    drawUnits('meters', sectionWidth * 1.5, thirdRowY);

    // Heading Section (Top Center-Right)
    drawHeader('HEADING', sectionWidth * 2.5, firstRowY);
    const heading = Math.round(data.heading);
    const cardinal = this.getCardinalDirection(heading);
    drawValue(`${heading}°`, sectionWidth * 2.5, secondRowY, true);
    drawUnits(cardinal, sectionWidth * 2.5, thirdRowY);

    // Vertical Speed (Top Right)
    drawHeader('VERT SPEED', sectionWidth * 3.5, 50);
    const varioValue = data.verticalSpeed >= 0 ? '+' + data.verticalSpeed.toFixed(1) : data.verticalSpeed.toFixed(1);
    drawValue(varioValue, sectionWidth * 3.5, secondRowY, true);
    drawUnits('m/s', sectionWidth * 3.5, thirdRowY);

    // GPS Coordinates (Bottom)
    drawHeader('GPS', width * 0.5, height / 2 + 25);
    const lat = this.convertToGPS(data.position.x);
    const lon = this.convertToGPS(data.position.z);
    drawValue(`${lat}N ${lon}E`, width * 0.5, height / 2 + 65);
  }

  private getCardinalDirection(heading: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  }

  private convertToGPS(coordinate: number): string {
    // Convert world coordinates to fake GPS coordinates
    // Center around 28.0° (Lanzarote's approximate latitude)
    const base = 28.0;
    const converted = base + (coordinate / 10000); // Scale factor for reasonable GPS changes
    return converted.toFixed(6);
  }

  private drawDecorations(context: CanvasRenderingContext2D): void {
    // Draw corner brackets
    const bracketSize = 20;
    context.strokeStyle = '#00ff00';
    context.lineWidth = 2;

    // Draw brackets in each corner
    const corners = [
      [0, 0], // Top-left
      [this.computerDisplayCanvas.width, 0], // Top-right
      [0, this.computerDisplayCanvas.height], // Bottom-left
      [this.computerDisplayCanvas.width, this.computerDisplayCanvas.height] // Bottom-right
    ];

    corners.forEach(([x, y]) => {
      const isRight = x > 0;
      const isBottom = y > 0;

      context.beginPath();
      // Vertical line
      context.moveTo(
        x + (isRight ? -10 : 10),
        y + (isBottom ? -bracketSize - 10 : bracketSize + 10)
      );
      context.lineTo(
        x + (isRight ? -10 : 10),
        y + (isBottom ? -10 : 10)
      );
      // Horizontal line
      context.lineTo(
        x + (isRight ? -bracketSize - 10 : bracketSize + 10),
        y + (isBottom ? -10 : 10)
      );
      context.stroke();
    });
  }

  private calculateVerticalSpeed(currentAltitude: number, currentTime: number): number {
    if (this.lastFlightData.lastAltitude === undefined || this.lastFlightData.lastUpdateTime === undefined) {
      this.lastFlightData.lastAltitude = currentAltitude;
      this.lastFlightData.lastUpdateTime = currentTime;
      return 0;
    }

    const timeDiff = (currentTime - this.lastFlightData.lastUpdateTime) / 1000; // Convert to seconds
    const altitudeDiff = currentAltitude - this.lastFlightData.lastAltitude;
    const verticalSpeed = altitudeDiff / timeDiff;

    // Update last values
    this.lastFlightData.lastAltitude = currentAltitude;
    this.lastFlightData.lastUpdateTime = currentTime;

    // Apply some smoothing
    return 0.7 * this.lastFlightData.verticalSpeed + 0.3 * verticalSpeed;
  }

  private initializeHUD(): void {
    // Create text sprites for speed and altitude (these will be hidden)
    const spriteMaterial = this.createTextSprite('', { color: '#00ff00' });
    this.speedText = new THREE.Sprite(spriteMaterial);
    this.speedText.visible = false;

    const altitudeMaterial = this.createTextSprite('', { color: '#00ff00' });
    this.altitudeText = new THREE.Sprite(altitudeMaterial);
    this.altitudeText.visible = false;
  }

  private createHorizonLines(): void {
    // Create center reticle
    const reticleMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const reticleGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-20, 0, 0),
      new THREE.Vector3(20, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -20, 0),
      new THREE.Vector3(0, 20, 0)
    ]);
    const reticle = new THREE.Line(reticleGeometry, reticleMaterial);
    this.hudScene.add(reticle);

    // Create horizon lines
    const horizonMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    for (let i = -3; i <= 3; i++) {
      const y = i * 50;
      const width = i === 0 ? 200 : 100;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-width, y, 0),
        new THREE.Vector3(width, y, 0)
      ]);
      const line = new THREE.Line(geometry, horizonMaterial);
      this.horizonLines.push(line);
      this.hudScene.add(line);
    }
  }

  private createTextSprite(text: string, parameters: { color: string }): THREE.SpriteMaterial {
    const context = this.canvas.getContext('2d');
    if (!context) return new THREE.SpriteMaterial();

    context.clearRect(0, 0, 256, 256);
    context.font = "24px Arial";
    context.fillStyle = parameters.color;
    context.textAlign = "center";
    context.fillText(text, 128, 128);

    const texture = new THREE.Texture(this.canvas);
    texture.needsUpdate = true;

    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
  }

  private onWindowResize(): void {
    this.hudCamera.left = -window.innerWidth / 2;
    this.hudCamera.right = window.innerWidth / 2;
    this.hudCamera.top = window.innerHeight / 2;
    this.hudCamera.bottom = -window.innerHeight / 2;
    this.hudCamera.updateProjectionMatrix();

    // Update computer screen position
    this.computerScreen.position.set(0, -window.innerHeight / 2 + 120, 0);
  }

  public update(velocity: THREE.Vector3, position: THREE.Vector3, rotation: THREE.Euler): void {
    // Calculate speed (km/h)
    const speed = velocity.length() * 3.6;

    // Get altitude
    const altitude = position.y;

    // Calculate vertical speed
    const currentTime = performance.now();
    const verticalSpeed = this.calculateVerticalSpeed(altitude, currentTime);

    // Calculate heading from rotation
    const heading = (rotation.y * (180 / Math.PI) + 360) % 360;

    // Update flight data
    this.lastFlightData = {
      speed,
      altitude,
      verticalSpeed,
      position,
      heading,
      lastAltitude: altitude,
      lastUpdateTime: currentTime
    };

    // Update computer display
    this.updateComputerDisplay(this.lastFlightData);

    // Update horizon lines based on rotation
    this.updateHorizonLines(rotation);
  }

  private updateHorizonLines(rotation: THREE.Euler): void {
    this.horizonLines.forEach((line, index) => {
      line.rotation.z = rotation.z;
      const pitch = rotation.x;
      const baseY = (index - 3) * 50;
      line.position.y = baseY - pitch * 100;
    });
  }

  public render(renderer: THREE.WebGLRenderer): void {
    // First render the main scene
    renderer.render(this.scene, this.camera);

    // Then render the HUD scene
    renderer.autoClear = false;
    renderer.render(this.hudScene, this.hudCamera);
    renderer.autoClear = true;
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    // Clean up THREE.js objects
    this.horizonLines.forEach(line => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    (this.speedText.material as THREE.Material).dispose();
    (this.altitudeText.material as THREE.Material).dispose();
    (this.computerScreen.material as THREE.Material).dispose();
    this.computerScreen.geometry.dispose();
    this.computerDisplayTexture.dispose();
  }
} 