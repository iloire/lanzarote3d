import * as CANNON from "cannon-es";

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

  buttonLayout.forEach((row) => {
    row.forEach((buttonType) => {
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