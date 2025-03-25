import * as THREE from 'three';

interface FlightHUDProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
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

  constructor({ scene, camera }: FlightHUDProps) {
    this.scene = scene;
    this.camera = camera;
    this.horizonLines = [];

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

    // Create canvas for computer display
    this.computerDisplayCanvas = document.createElement('canvas');
    this.computerDisplayCanvas.width = 512;
    this.computerDisplayCanvas.height = 256;
    this.computerDisplayTexture = new THREE.Texture(this.computerDisplayCanvas);

    // Initialize HUD elements
    this.initializeHUD();
    this.createComputerScreen();
    this.createHorizonLines();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createComputerScreen(): void {
    // Create a plane geometry for the computer screen
    const screenGeometry = new THREE.PlaneGeometry(400, 200);
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: this.computerDisplayTexture,
      transparent: true,
      opacity: 0.9
    });

    this.computerScreen = new THREE.Mesh(screenGeometry, screenMaterial);
    this.computerScreen.position.set(0, -window.innerHeight / 2 + 120, 0);
    this.hudScene.add(this.computerScreen);
  }

  private updateComputerDisplay(speed: number, altitude: number): void {
    const context = this.computerDisplayCanvas.getContext('2d');
    if (!context) return;

    // Clear the canvas
    context.clearRect(0, 0, this.computerDisplayCanvas.width, this.computerDisplayCanvas.height);

    // Set background
    context.fillStyle = '#000033';
    context.fillRect(0, 0, this.computerDisplayCanvas.width, this.computerDisplayCanvas.height);

    // Add a border
    context.strokeStyle = '#00ff00';
    context.lineWidth = 2;
    context.strokeRect(4, 4, this.computerDisplayCanvas.width - 8, this.computerDisplayCanvas.height - 8);

    // Draw dividing line
    context.beginPath();
    context.moveTo(this.computerDisplayCanvas.width / 2, 10);
    context.lineTo(this.computerDisplayCanvas.width / 2, this.computerDisplayCanvas.height - 10);
    context.stroke();

    // Set text properties
    context.font = 'bold 36px monospace';
    context.fillStyle = '#00ff00';
    context.textAlign = 'center';

    // Draw labels
    context.font = 'bold 24px monospace';
    context.fillText('SPEED', this.computerDisplayCanvas.width * 0.25, 40);
    context.fillText('ALTITUDE', this.computerDisplayCanvas.width * 0.75, 40);

    // Draw values
    context.font = 'bold 48px monospace';
    context.fillText(`${speed}`, this.computerDisplayCanvas.width * 0.25, 120);
    context.fillText(`${altitude}`, this.computerDisplayCanvas.width * 0.75, 120);

    // Draw units
    context.font = '20px monospace';
    context.fillText('km/h', this.computerDisplayCanvas.width * 0.25, 150);
    context.fillText('meters', this.computerDisplayCanvas.width * 0.75, 150);

    // Add some decorative elements
    this.drawDecorations(context);

    // Update the texture
    this.computerDisplayTexture.needsUpdate = true;
  }

  private drawDecorations(context: CanvasRenderingContext2D): void {
    // Draw corner brackets
    const bracketSize = 20;
    context.strokeStyle = '#00ff00';
    context.lineWidth = 2;

    // Top-left brackets
    context.beginPath();
    context.moveTo(10, bracketSize + 10);
    context.lineTo(10, 10);
    context.lineTo(bracketSize + 10, 10);
    context.stroke();

    // Top-right brackets
    context.beginPath();
    context.moveTo(this.computerDisplayCanvas.width - 10, bracketSize + 10);
    context.lineTo(this.computerDisplayCanvas.width - 10, 10);
    context.lineTo(this.computerDisplayCanvas.width - bracketSize - 10, 10);
    context.stroke();

    // Bottom-left brackets
    context.beginPath();
    context.moveTo(10, this.computerDisplayCanvas.height - bracketSize - 10);
    context.lineTo(10, this.computerDisplayCanvas.height - 10);
    context.lineTo(bracketSize + 10, this.computerDisplayCanvas.height - 10);
    context.stroke();

    // Bottom-right brackets
    context.beginPath();
    context.moveTo(this.computerDisplayCanvas.width - 10, this.computerDisplayCanvas.height - bracketSize - 10);
    context.lineTo(this.computerDisplayCanvas.width - 10, this.computerDisplayCanvas.height - 10);
    context.lineTo(this.computerDisplayCanvas.width - bracketSize - 10, this.computerDisplayCanvas.height - 10);
    context.stroke();
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

  public update(velocity: THREE.Vector3, altitude: number, rotation: THREE.Euler): void {
    // Calculate speed in km/h
    const speed = Math.round(velocity.length() * 3.6);
    const altitudeRounded = Math.round(altitude);

    // Update computer display
    this.updateComputerDisplay(speed, altitudeRounded);

    // Update horizon line rotation based on airplane roll and pitch
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