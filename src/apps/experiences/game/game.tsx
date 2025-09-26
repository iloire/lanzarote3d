import React from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import BackgroundSound from '../../../foundation/systems/audio/BackgroundAudio';
import Flier, { FlierConstructor } from '../../../foundation/types/flier';
import Paraglider from '../../../foundation/components/vehicles/Paraglider';
import Vario from '../../../foundation/systems/audio/VarioSound';
import { Weather, WeatherOptions } from '../../../foundation/components/physics';
import { CameraMode } from '../../../foundation/systems/scene/CameraController';
import UIControls, { FirstPersonViewLook } from './ui-controls';
import { Trajectory } from '../../../foundation/components/ui';
import Analytics from '../../../foundation/systems/analytics/UserAnalytics';
import { GameStartOptions, GameStatus } from './types';
import { addGameEnvironment } from './env';
import locations from './lanzarote';
import { WindIndicator } from '../../../foundation/components/physics';
import { StoryOptions } from '../../shared/types';
import { AppBase } from '../../shared/AppBase';
const KMH_TO_MS = 3.6;

const FOG_ENABLED = true;
const TIME_OF_DAY = 20;
const START_WITH_SOUND = false;
const INITIAL_CAMERA_MODE = CameraMode.FollowTarget;
const DEBUG = false;

const settings = {
  rotationSensitivity: 0.002,
  orbitControl: false,
  wrapSpeed: 1,
};

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / KMH_TO_MS,
  lclLevel: 1800,
};

const addWindIndicatorToScene = (scene: THREE.Scene, flier: Flier, weather: Weather) => {
  const windIndicator = new WindIndicator(40);
  const arrow = windIndicator.load(
    WEATHER_SETTINGS.windDirectionDegreesFromNorth,
    flier.position().add(flier.direction())
  );
  scene.add(arrow);
  flier.addEventListener('position', event => {
    arrow.position.copy(event.position).add(flier.direction().multiplyScalar(300));
  });

  weather.addEventListener('wind-directionChange', event => {
    windIndicator.update(event.value);
  });
};

const analytics = new Analytics();

/**
 * Game App - Interactive paragliding simulation with physics and controls
 * Fifth app converted to use AppBase architecture
 */
class GameApp extends AppBase {
  private animationId?: number;
  private weather?: Weather;
  private bgMusic?: BackgroundSound;
  private vario?: Vario;
  private pg?: Flier;
  private analytics?: Analytics;
  private gameStatus: GameStatus = GameStatus.NonStarted;
  private eventListeners: (() => void)[] = [];
  private trajectoryMesh?: THREE.Object3D;
  private uiRoot?: any;

  constructor() {
    super({
      name: 'Paragliding Game',
      description: 'Interactive paragliding simulation with physics, weather, and flight controls',
      requiredComponents: ['scene', 'camera', 'renderer', 'terrain', 'water', 'sky', 'gui', 'controls'],
      scene: {
        environment: 'lanzarote',
        lighting: 'dynamic',
        physics: true,
        fog: {
          enabled: FOG_ENABLED,
          color: 0x000000,
          near: 1,
          far: 22500
        }
      },
      performance: {
        monitoring: true,
        logIntervalMs: 5000 // More frequent monitoring for interactive game
      }
    });
  }

  async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems from AppBase
      this.initializeCore(options);

      const { camera, scene, renderer, terrain, water, sky, gui, controls } = options;

      sky.updateSunPosition(TIME_OF_DAY);

      // Initialize game systems
      this.weather = new Weather(WEATHER_SETTINGS);
      this.weather.addGui(gui);
      this.bgMusic = new BackgroundSound();
      this.analytics = new Analytics();

      // must render before adding env
      renderer.render(scene, camera);
      const env = addGameEnvironment(scene, terrain, this.weather, water, gui);
      const thermals = env.getThermals();

      // Setup paraglider and physics
      await this.setupParaglider(scene, gui, terrain, water, thermals);

      // Setup game controls and UI
      this.setupGameControls(camera, controls, scene, renderer, gui);
      this.setupUI();

      // Setup wind indicator
      this.addWindIndicatorToScene(scene);

      // Start game loop
      this.startGameLoop(camera, renderer, scene);

      this.isLoaded = true;
      console.log(`✅ ${this.config.name} loaded successfully`);

    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async setupParaglider(scene: THREE.Scene, gui: any, terrain: any, water: any, thermals: any): Promise<void> {
    const envOptions = {
      weather: this.weather!,
      terrain,
      water,
      thermals,
    };

    const gliderOptions = {
      wingColor1: '#c30010',
      wingColor2: '#b100cd',
      numeroCajones: 40,
    };

    const pilotOptions = {};

    const paragliderFlyable = new Paraglider({
      glider: gliderOptions,
      pilot: pilotOptions,
    });

    const mesh = await paragliderFlyable.load(gui);
    const scale = 0.01;
    mesh.scale.set(scale, scale, scale);

    const pgOptions: FlierConstructor = {
      glidingRatio: 9,
      trimSpeed: 35 / KMH_TO_MS,
      fullSpeedBarSpeed: 45 / KMH_TO_MS,
      bigEarsSpeed: 27 / KMH_TO_MS,
      flyable: paragliderFlyable,
    };

    this.pg = new Flier(pgOptions, envOptions, DEBUG);
    this.vario = new Vario(this.pg);
    this.pg.addGui(gui);

    scene.add(mesh);

  }

  private setupGameControls(camera: any, controls: any, scene: THREE.Scene, renderer: THREE.WebGLRenderer, gui: any): void {
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      const keyCode = event.which;
      if (keyCode === 90) {
        // z key
      } else if (keyCode === 77) {
        // m key - toggle sound
        this.bgMusic?.toggle();
        this.vario?.toggle();
      } else if (keyCode === 83) {
        // s key - speed bar
        this.pg?.toggleSpeedBar();
      } else if (keyCode === 69) {
        // e key - big ears
        this.pg?.toggleEars();
      }
    };

    document.addEventListener('keydown', onDocumentKeyDown, false);
    this.eventListeners.push(() => {
      document.removeEventListener('keydown', onDocumentKeyDown);
    });

    // Setup GUI navigation controls
    this.setupNavigationGUI(gui);
  }

  private setupNavigationGUI(gui: any): void {
    const wrapSpeedChange = (value: number) => {
      this.pg?.updateWrapSpeed(value);
      this.vario?.updateWrapSpeed(value);
      // env.updateWrapSpeed(value); // TODO: Fix env reference
    };

    const nav = gui.addFolder('Navigation');
    nav.add(settings, 'rotationSensitivity', 0.01, 0.05).listen();
    nav
      .add(settings, 'wrapSpeed', 1, 20)
      .listen()
      .onChange((value: number) => {
        wrapSpeedChange(value);
      });
  }

  private setCameraMode(mode: CameraMode, camera: any): void {
    camera.setCameraMode(mode, this.pg);
    const mesh = this.pg?.getMesh();
    if (mesh) {
      if (mode === CameraMode.FirstPersonView) {
        mesh.visible = false;
      } else {
        mesh.visible = true;
      }
    }
  }

  private setupUI(): void {
    if (!this.pg || !this.vario || !this.weather || !this.analytics) return;

    const uiControls = (
      <UIControls
        pg={this.pg}
        locations={locations}
        vario={this.vario}
        weather={this.weather}
        showDebugInfo={true}
        defaultGameSpeed={3}
        defaultCameraMode={INITIAL_CAMERA_MODE}
        onLeftInput={() => {
          this.pg?.leftInput();
        }}
        onLeftInputRelease={() => {
          this.pg?.leftRelease();
        }}
        onRightInput={() => {
          this.pg?.rightInput();
        }}
        onRightInputRelease={() => {
          this.pg?.rightRelease();
        }}
        onTurnMouseInputChange={(direction: number) => {
          this.pg?.directionInput(direction);
        }}
        onViewUIChange={(direction: FirstPersonViewLook) => {
          if (this.gameStatus === GameStatus.Started) {
            // camera.lookDirection(direction.x, direction.y); // TODO: Fix camera reference
          }
        }}
        onGameStart={(options: GameStartOptions, fnHideStartButton) => {
          this.startGame(options);
          fnHideStartButton();
        }}
        onFinishGame={fnHideButtons => {
          if (this.gameStatus === GameStatus.Started || this.gameStatus === GameStatus.Paused) {
            this.finishGame();
            fnHideButtons();
          }
        }}
        onPause={paused => {
          if (this.gameStatus === GameStatus.Started || this.gameStatus === GameStatus.Paused) {
            this.analytics?.trackEvent('game-pause');
            if (paused) {
              this.pg?.stop();
              this.vario?.pause();
              this.bgMusic?.pause();
              this.gameStatus = GameStatus.Paused;
            } else {
              this.pg?.init();
              this.vario?.start();
              this.bgMusic?.play();
              this.gameStatus = GameStatus.Started;
            }
          }
        }}
        onSelectCamera={(mode: CameraMode) => {
          this.analytics?.trackEvent('game-camera-change', mode.toString());
          // this.setCameraMode(mode); // TODO: Fix camera reference
        }}
        onWrapSpeedChange={value => {
          this.analytics?.trackEvent('game-speed-change', value.toString());
          // wrapSpeedChange(value); // TODO: Fix this reference
        }}
      />
    );

    const uiContainer = document.getElementById('ui-controls');
    if (uiContainer) {
      this.uiRoot = createRoot(uiContainer);
      this.uiRoot.render(uiControls);
    }

  }

  private touchedGround(): void {
    // Ground touch handling
  }

  private finishGame(): void {
    if (!this.pg || !this.analytics || !this.vario || !this.bgMusic) return;

    this.analytics.trackEvent('game-crash', this.pg.getTrajectory().length.toString());
    this.vario.stop();
    this.bgMusic.stop();
    this.pg.stop();

    // TODO: Fix scene and camera references for trajectory visualization
    // const trajectory = new Trajectory(this.pg.getTrajectory(), 15);
    // scene.add(trajectory.getMesh());
    // this.trajectoryMesh = trajectory.getMesh();

    this.gameStatus = GameStatus.Finished;
  }

  private startGame(options: GameStartOptions): void {
    if (!this.pg || !this.analytics || !this.weather || !this.vario || !this.bgMusic) return;

    this.analytics.trackEvent('game-start');
    this.weather.changeWindSpeed(options.windSpeedMetresPerSecond);
    this.weather.changeWindDirection(options.windDirectionDegreesFromNorth);

    if (START_WITH_SOUND) {
      this.bgMusic.play();
      this.vario.start();
    }

    this.pg.setPosition(options.startingLocation.takeoffs[0]!.position);
    this.pg.rotate(-134, 0);
    this.pg.init();

    // TODO: Fix camera mode setting
    // this.setCameraMode(INITIAL_CAMERA_MODE);

    this.gameStatus = GameStatus.Started;
  }

  private addWindIndicatorToScene(scene: THREE.Scene): void {
    if (!this.pg || !this.weather) return;

    const windIndicator = new WindIndicator(40);
    const arrow = windIndicator.load(
      WEATHER_SETTINGS.windDirectionDegreesFromNorth,
      this.pg.position().add(this.pg.direction())
    );
    scene.add(arrow);

    this.pg.addEventListener('position', event => {
      arrow.position.copy(event.position).add(this.pg!.direction().multiplyScalar(300));
    });

    this.weather.addEventListener('wind-directionChange', event => {
      windIndicator.update(event.value);
    });

  }

  private startGameLoop(camera: any, renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
    // Setup event listeners
    if (this.pg) {
      this.pg.addEventListener('touchedGround', () => this.touchedGround());
      this.pg.addEventListener('crashed', () => this.finishGame());
    }

    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        if (this.gameStatus !== GameStatus.Started) {
          const timeMultiplier = 0.000008;
          camera.position.x = 32000 * Math.sin(Date.now() * timeMultiplier);
          camera.position.y = 950;
          camera.position.z = 3000 * Math.cos(Date.now() * timeMultiplier);
          camera.lookAt(new THREE.Vector3(0, 500, 0));
        }

        if (this.vario && this.pg) {
          this.vario.updateReading(this.pg.altitude());
        }

        camera.update();
        renderer.render(scene, camera);
        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'game loop');
      }
    };
    animate();
  }

  public dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Stop game systems
    if (this.bgMusic) {
      this.bgMusic.stop();
      this.bgMusic = undefined;
    }

    if (this.vario) {
      this.vario.stop();
      this.vario = undefined;
    }

    if (this.pg) {
      this.pg.stop();
      this.pg = undefined;
    }

    // Clean up UI
    if (this.uiRoot) {
      this.uiRoot.unmount();
      this.uiRoot = undefined;
    }

    // Remove event listeners
    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners.length = 0;

    // Dispose trajectory mesh if exists
    if (this.trajectoryMesh) {
      if (this.trajectoryMesh.geometry) {
        this.trajectoryMesh.geometry.dispose();
      }
      if (Array.isArray(this.trajectoryMesh.material)) {
        this.trajectoryMesh.material.forEach(material => material.dispose());
      } else if (this.trajectoryMesh.material) {
        this.trajectoryMesh.material.dispose();
      }
      this.trajectoryMesh = undefined;
    }

    // Clean up other systems
    this.weather = undefined;
    this.analytics = undefined;

    // Call parent dispose
    super.dispose();
  }
}

// Create singleton instance
const gameApp = new GameApp();

// Export in the expected format for the Stories system
const Game = {
  load: async (options: StoryOptions) => {
    return gameApp.load(options);
  },
  dispose: () => {
    return gameApp.dispose();
  },
  getAppInfo: () => {
    return gameApp.getAppInfo();
  },
};

export default Game;
