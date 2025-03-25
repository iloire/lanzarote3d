# Airplane Physics Simulation

This document provides an overview of the airplane physics simulation implemented in the CannonWorkshop story.

## Overview

The airplane simulation uses CANNON.js for realistic flight physics and THREE.js for visualization. The simulation models:

- Lift and drag forces
- Weight and thrust
- Control inputs (pitch, roll, yaw)
- Angle of attack effects
- Stall mechanics

## Controls

### Keyboard Controls

| Key           | Action                             |
|---------------|-----------------------------------|
| Arrow Up      | Pitch down (nose down)            |
| Arrow Down    | Pitch up (nose up)                |
| Arrow Left    | Roll left                         |
| Arrow Right   | Roll right                        |
| W             | Increase thrust                   |
| S             | Decrease thrust                   |
| A             | Yaw left (rudder left)            |
| D             | Yaw right (rudder right)          |
| R             | Reset airplane position           |

### GUI Controls

The simulation includes a user interface with several control panels:

#### Flight Controls
- **Thrust**: Controls the engine power (0-1000)
- **Lift Coefficient**: Adjusts how much lift is generated for a given airspeed (0-2)
- **Drag Coefficient**: Adjusts air resistance (0-1)

#### Control Sensitivity
- **Pitch**: Adjusts elevator sensitivity (0-2)
- **Roll**: Adjusts aileron sensitivity (0-2)
- **Yaw**: Adjusts rudder sensitivity (0-2)

#### Visualization
- **Show Forces**: Toggles visualization of forces acting on the aircraft

## Physics Model

### Flight Forces

1. **Lift**
   - Perpendicular to the airflow
   - Proportional to velocity squared
   - Varies with angle of attack
   - Drops off sharply at high angles (stall)

2. **Drag**
   - Opposite to the direction of motion
   - Proportional to velocity squared
   - Increases with angle of attack

3. **Thrust**
   - Applied in the forward direction of the aircraft
   - Controlled directly by the user

4. **Weight**
   - Constant downward force
   - Equal to aircraft mass × gravity

### Control Surfaces

The airplane responds to control inputs by applying torques around different axes:

- **Elevator (Pitch)**: Rotates the aircraft around the lateral axis
- **Ailerons (Roll)**: Rotates the aircraft around the longitudinal axis
- **Rudder (Yaw)**: Rotates the aircraft around the vertical axis

## Flight Tips

1. **Maintaining Level Flight**
   - Balance thrust with drag
   - Keep a moderate angle of attack (not too high)
   - Use small control inputs for smoother flight

2. **Turning**
   - Use roll to bank the aircraft
   - Add a little rudder in the same direction
   - Pull up slightly (back on elevator) to maintain altitude in turns

3. **Avoiding Stalls**
   - Don't pull up too sharply
   - Maintain sufficient airspeed
   - If stalling, lower the nose and increase thrust

## Technical Implementation

The airplane is constructed with compound shapes for realistic mass distribution:

- Fuselage: Main body with most of the mass
- Wings: Provide lift and roll control
- Tail: Provides stability and pitch/yaw control

Flight forces are calculated based on:

- Current velocity vector
- Airplane orientation
- Control inputs
- Configuration parameters

Force vectors are visualized using arrow helpers to show the magnitude and direction of each force acting on the aircraft. 