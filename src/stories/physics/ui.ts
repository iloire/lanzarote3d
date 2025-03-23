import * as CANNON from "cannon-es";
import { PhysicsObjects } from "./helpers";

/**
 * Interface for button controllers
 */
export interface ButtonController {
  cleanup: () => void;
  applyButtonForces: () => void;
  [key: string]: any; // Allow additional properties like buttons
}

/**
 * Creates UI buttons for controlling the platform
 */
export function createPlatformButtons(
  container: HTMLElement,
  platformBody: CANNON.Body,
  platformForce: number
): ButtonController & {
  leftButton: HTMLButtonElement;
  rightButton: HTMLButtonElement;
} {
  // Create container for the buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.bottom = '20px';
  buttonContainer.style.left = '50%';
  buttonContainer.style.transform = 'translateX(-50%)';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.zIndex = '1000';

  // Create left button
  const leftButton = document.createElement('button');
  leftButton.textContent = '← Left';
  leftButton.style.padding = '12px 24px';
  leftButton.style.fontSize = '16px';
  leftButton.style.fontWeight = 'bold';
  leftButton.style.backgroundColor = '#3f51b5';
  leftButton.style.color = 'white';
  leftButton.style.border = 'none';
  leftButton.style.borderRadius = '4px';
  leftButton.style.cursor = 'pointer';
  leftButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';

  // Create right button
  const rightButton = document.createElement('button');
  rightButton.textContent = 'Right →';
  rightButton.style.padding = '12px 24px';
  rightButton.style.fontSize = '16px';
  rightButton.style.fontWeight = 'bold';
  rightButton.style.backgroundColor = '#3f51b5';
  rightButton.style.color = 'white';
  rightButton.style.border = 'none';
  rightButton.style.borderRadius = '4px';
  rightButton.style.cursor = 'pointer';
  rightButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';

  // Add buttons to container
  buttonContainer.appendChild(leftButton);
  buttonContainer.appendChild(rightButton);

  // Add container to the DOM
  container.appendChild(buttonContainer);

  // Track button press state
  const buttonState = {
    leftPressed: false,
    rightPressed: false
  };

  // Button event handlers
  function onLeftMouseDown() {
    buttonState.leftPressed = true;
    leftButton.style.backgroundColor = '#303f9f';
    leftButton.style.transform = 'translateY(2px)';
  }

  function onRightMouseDown() {
    buttonState.rightPressed = true;
    rightButton.style.backgroundColor = '#303f9f';
    rightButton.style.transform = 'translateY(2px)';
  }

  function onLeftMouseUp() {
    buttonState.leftPressed = false;
    leftButton.style.backgroundColor = '#3f51b5';
    leftButton.style.transform = 'translateY(0)';
  }

  function onRightMouseUp() {
    buttonState.rightPressed = false;
    rightButton.style.backgroundColor = '#3f51b5';
    rightButton.style.transform = 'translateY(0)';
  }

  // Add event listeners
  leftButton.addEventListener('mousedown', onLeftMouseDown);
  leftButton.addEventListener('touchstart', onLeftMouseDown);
  leftButton.addEventListener('mouseup', onLeftMouseUp);
  leftButton.addEventListener('mouseleave', onLeftMouseUp);
  leftButton.addEventListener('touchend', onLeftMouseUp);

  rightButton.addEventListener('mousedown', onRightMouseDown);
  rightButton.addEventListener('touchstart', onRightMouseDown);
  rightButton.addEventListener('mouseup', onRightMouseUp);
  rightButton.addEventListener('mouseleave', onRightMouseUp);
  rightButton.addEventListener('touchend', onRightMouseUp);

  // Function to apply forces based on button presses
  function applyButtonForces() {
    if (buttonState.leftPressed) {
      platformBody.applyForce(
        new CANNON.Vec3(-platformForce, 0, 0),
        new CANNON.Vec3(0, 0, 0)
      );
    }

    if (buttonState.rightPressed) {
      platformBody.applyForce(
        new CANNON.Vec3(platformForce, 0, 0),
        new CANNON.Vec3(0, 0, 0)
      );
    }
  }

  // Cleanup function
  function cleanup() {
    // Remove event listeners
    leftButton.removeEventListener('mousedown', onLeftMouseDown);
    leftButton.removeEventListener('touchstart', onLeftMouseDown);
    leftButton.removeEventListener('mouseup', onLeftMouseUp);
    leftButton.removeEventListener('mouseleave', onLeftMouseUp);
    leftButton.removeEventListener('touchend', onLeftMouseUp);

    rightButton.removeEventListener('mousedown', onRightMouseDown);
    rightButton.removeEventListener('touchstart', onRightMouseDown);
    rightButton.removeEventListener('mouseup', onRightMouseUp);
    rightButton.removeEventListener('mouseleave', onRightMouseUp);
    rightButton.removeEventListener('touchend', onRightMouseUp);

    // Remove from DOM
    container.removeChild(buttonContainer);
  }

  return {
    leftButton,
    rightButton,
    cleanup,
    applyButtonForces
  };
}

/**
 * Creates UI buttons for controlling the sphere
 */
export function createSphereButtons(
  container: HTMLElement,
  sphereBody: CANNON.Body,
  pushForce: number
): ButtonController {
  // Create container for the buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.top = '20px';
  buttonContainer.style.right = '20px';
  buttonContainer.style.display = 'grid';
  buttonContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
  buttonContainer.style.gridTemplateRows = '1fr 1fr 1fr';
  buttonContainer.style.gap = '5px';
  buttonContainer.style.zIndex = '1000';

  // Button positions in grid (empty spaces for non-buttons)
  const buttonLayout = [
    ['', 'up', ''],
    ['left', '', 'right'],
    ['', 'down', '']
  ];

  // Button labels and directions
  const buttonConfig = {
    up: { label: '↑', force: new CANNON.Vec3(0, 0, -1) },
    down: { label: '↓', force: new CANNON.Vec3(0, 0, 1) },
    left: { label: '←', force: new CANNON.Vec3(-1, 0, 0) },
    right: { label: '→', force: new CANNON.Vec3(1, 0, 0) }
  };

  // Track button press state
  const buttonState: { [key: string]: boolean } = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  // Create and add buttons
  const buttons: { [key: string]: HTMLButtonElement } = {};

  buttonLayout.forEach((row, rowIndex) => {
    row.forEach((buttonType, colIndex) => {
      if (!buttonType) {
        // Empty cell
        const spacer = document.createElement('div');
        buttonContainer.appendChild(spacer);
        return;
      }

      // Create button
      const button = document.createElement('button');
      button.textContent = buttonConfig[buttonType].label;
      button.style.padding = '15px';
      button.style.fontSize = '18px';
      button.style.fontWeight = 'bold';
      button.style.backgroundColor = '#e91e63';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';

      // Add button to container
      buttonContainer.appendChild(button);
      buttons[buttonType] = button;

      // Create event handlers for this button
      const onMouseDown = () => {
        buttonState[buttonType] = true;
        button.style.backgroundColor = '#c2185b';
        button.style.transform = 'translateY(2px)';
      };

      const onMouseUp = () => {
        buttonState[buttonType] = false;
        button.style.backgroundColor = '#e91e63';
        button.style.transform = 'translateY(0)';
      };

      // Add event listeners
      button.addEventListener('mousedown', onMouseDown);
      button.addEventListener('touchstart', onMouseDown);
      button.addEventListener('mouseup', onMouseUp);
      button.addEventListener('mouseleave', onMouseUp);
      button.addEventListener('touchend', onMouseUp);
    });
  });

  // Add container to the DOM
  container.appendChild(buttonContainer);

  // Function to apply forces based on button presses
  function applyButtonForces() {
    Object.keys(buttonState).forEach(buttonType => {
      if (buttonState[buttonType]) {
        const force = buttonConfig[buttonType].force;
        sphereBody.applyForce(
          new CANNON.Vec3(
            force.x * pushForce,
            force.y * pushForce,
            force.z * pushForce
          ),
          new CANNON.Vec3(0, 0, 0)
        );
      }
    });
  }

  // Cleanup function
  function cleanup() {
    // Remove event listeners (simplified)
    Object.keys(buttons).forEach(buttonType => {
      const button = buttons[buttonType];
      // Remove all event listeners by cloning and replacing
      const newButton = button.cloneNode(true);
      button.parentNode?.replaceChild(newButton, button);
    });

    // Remove from DOM
    container.removeChild(buttonContainer);
  }

  return {
    buttons,
    buttonContainer,
    cleanup,
    applyButtonForces
  };
}

/**
 * Creates an anti-gravity button that applies upward force
 */
export function createAntiGravityButton(
  container: HTMLElement,
  physicsObjects: PhysicsObjects,
  forceMagnitude: number
): ButtonController & {
  buttonContainer: HTMLDivElement;
} {
  // Create container for the button
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.left = '20px';
  buttonContainer.style.top = '20px';
  buttonContainer.style.zIndex = '1000';

  // Create the anti-gravity button
  const antiGravityButton = document.createElement('button');
  antiGravityButton.textContent = '🚀 Anti-Gravity';
  antiGravityButton.style.padding = '15px 25px';
  antiGravityButton.style.fontSize = '18px';
  antiGravityButton.style.fontWeight = 'bold';
  antiGravityButton.style.backgroundColor = '#9c27b0'; // Purple for distinction
  antiGravityButton.style.color = 'white';
  antiGravityButton.style.border = 'none';
  antiGravityButton.style.borderRadius = '50px'; // Rounded button
  antiGravityButton.style.cursor = 'pointer';
  antiGravityButton.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
  antiGravityButton.style.transition = 'all 0.2s';

  // Add a visual glow effect
  antiGravityButton.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.5)';

  // Add an icon
  const rocketIcon = document.createElement('span');
  rocketIcon.textContent = '🚀 ';
  rocketIcon.style.marginRight = '8px';
  antiGravityButton.prepend(rocketIcon);

  // Create a visual indicator container that will show when the button is active
  const indicatorContainer = document.createElement('div');
  indicatorContainer.style.position = 'absolute';
  indicatorContainer.style.top = '-10px';
  indicatorContainer.style.left = '-10px';
  indicatorContainer.style.right = '-10px';
  indicatorContainer.style.bottom = '-10px';
  indicatorContainer.style.borderRadius = '60px';
  indicatorContainer.style.pointerEvents = 'none'; // Don't interfere with button clicks
  indicatorContainer.style.display = 'none'; // Hidden by default
  indicatorContainer.style.zIndex = '-1'; // Behind the button

  // Create a pulsing animation effect
  indicatorContainer.style.animation = 'pulse 1.5s infinite';

  // Add a style tag for the pulse animation
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.7);
      }
      70% {
        box-shadow: 0 0 0 15px rgba(156, 39, 176, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(156, 39, 176, 0);
      }
    }
    
    @keyframes float-particle {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 0;
      }
      20% {
        opacity: 1;
      }
      100% {
        transform: translateY(-60px) rotate(360deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(styleTag);

  // Add the indicator to the button container
  buttonContainer.appendChild(indicatorContainer);

  // Create particle container for visual effect
  const particleContainer = document.createElement('div');
  particleContainer.style.position = 'absolute';
  particleContainer.style.bottom = '0';
  particleContainer.style.left = '0';
  particleContainer.style.right = '0';
  particleContainer.style.height = '20px';
  particleContainer.style.pointerEvents = 'none';
  buttonContainer.appendChild(particleContainer);

  // Array to store particles
  const particles: HTMLElement[] = [];

  // Function to create a particle
  function createParticle() {
    if (!buttonState.antiGravityPressed) return;

    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = '8px';
    particle.style.height = '8px';
    particle.style.backgroundColor = '#f3e5f5';
    particle.style.borderRadius = '50%';
    particle.style.boxShadow = '0 0 6px #e1bee7';

    // Random position
    const leftPos = 10 + Math.random() * (antiGravityButton.offsetWidth - 20);
    particle.style.left = `${leftPos}px`;
    particle.style.bottom = '0';

    // Set animation
    particle.style.animation = 'float-particle 1.5s ease-out forwards';

    // Add to container
    particleContainer.appendChild(particle);
    particles.push(particle);

    // Remove after animation completes
    setTimeout(() => {
      if (particleContainer.contains(particle)) {
        particleContainer.removeChild(particle);
      }
      const index = particles.indexOf(particle);
      if (index > -1) {
        particles.splice(index, 1);
      }
    }, 1500);
  }

  // Particle generator interval
  let particleInterval: number | null = null;

  // Add button to container
  buttonContainer.appendChild(antiGravityButton);

  // Add container to the DOM
  container.appendChild(buttonContainer);

  // Track button press state
  const buttonState = {
    antiGravityPressed: false
  };

  // Button event handlers
  const onMouseDown = () => {
    buttonState.antiGravityPressed = true;
    antiGravityButton.style.backgroundColor = '#7b1fa2'; // Darker purple when pressed
    antiGravityButton.style.transform = 'translateY(2px) scale(0.98)';
    antiGravityButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';

    // Show the indicator
    indicatorContainer.style.display = 'block';

    // Start generating particles
    if (particleInterval === null) {
      particleInterval = window.setInterval(createParticle, 100);
    }
  };

  const onMouseUp = () => {
    buttonState.antiGravityPressed = false;
    antiGravityButton.style.backgroundColor = '#9c27b0';
    antiGravityButton.style.transform = 'translateY(0) scale(1)';
    antiGravityButton.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';

    // Hide the indicator
    indicatorContainer.style.display = 'none';

    // Stop generating particles
    if (particleInterval !== null) {
      clearInterval(particleInterval);
      particleInterval = null;
    }
  };

  // Add event listeners
  antiGravityButton.addEventListener('mousedown', onMouseDown);
  antiGravityButton.addEventListener('touchstart', onMouseDown);
  antiGravityButton.addEventListener('mouseup', onMouseUp);
  antiGravityButton.addEventListener('mouseleave', onMouseUp);
  antiGravityButton.addEventListener('touchend', onMouseUp);

  // Function to apply upward force to all physics bodies
  function applyButtonForces() {
    if (buttonState.antiGravityPressed) {
      // Apply upward force to all physics bodies
      physicsObjects.bodies.forEach(body => {
        // Scale force based on body mass to achieve similar acceleration
        const scaledForce = forceMagnitude * (body.mass || 1);
        body.applyForce(
          new CANNON.Vec3(0, scaledForce, 0),
          new CANNON.Vec3(0, 0, 0)
        );
      });
    }
  }

  // Cleanup function
  function cleanup() {
    // Remove event listeners
    antiGravityButton.removeEventListener('mousedown', onMouseDown);
    antiGravityButton.removeEventListener('touchstart', onMouseDown);
    antiGravityButton.removeEventListener('mouseup', onMouseUp);
    antiGravityButton.removeEventListener('mouseleave', onMouseUp);
    antiGravityButton.removeEventListener('touchend', onMouseUp);

    // Clean up animation interval
    if (particleInterval !== null) {
      clearInterval(particleInterval);
    }

    // Remove style tag
    if (document.head.contains(styleTag)) {
      document.head.removeChild(styleTag);
    }

    // Remove all particles
    particles.forEach(particle => {
      if (particleContainer.contains(particle)) {
        particleContainer.removeChild(particle);
      }
    });

    // Remove from DOM
    container.removeChild(buttonContainer);
  }

  return {
    cleanup,
    applyButtonForces,
    buttonContainer
  };
} 