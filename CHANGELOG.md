# Changelog

All notable changes to the Lanzarote 3D project will be documented in this file.

## [1.5.3] - 2025-10-01 12:54 UTC

### Fixed
- **Pilot Head Loading**: Fixed missing head from Pilot component by properly handling async PilotHead loading
  - Changed `createContent()` to `createObject()` override to support async operations
  - Made `createHead()` method async to properly await PilotHead.load()
  - PilotHead now loads correctly instead of returning empty object from synchronous getObject() call
  - Pilot heads (Default, Warrior, Skeleton, Devil) now render properly with helmets and customization options

## [1.5.2] - 2025-10-01 12:43 UTC

### Added
- **Hercules to Famara Animation**: Added Hercules military transport plane to Famara animation application
  - Added `HerculesConfig` type to config.ts with flight pattern, speed, and positioning parameters
  - Created `herculesConfig` constant with figure-eight flight pattern at 1200m altitude
  - Added `SHOW_HERCULES` visibility toggle flag
  - Implemented `loadHercules` function in vehicleLoader with FlyingBehavior integration
  - Updated AnimationApp class with Hercules mesh and flying behavior properties
  - Hercules starts flying 4 seconds after animation completes with figure-eight pattern
  - Proper disposal of Hercules mesh and flying behavior on cleanup
  - Vehicle count now includes Hercules in load success message

### Fixed
- **Type Errors**: Fixed TypeScript compilation errors
  - Changed Birds.load gui parameter type from `typeof GuiHelper` to `any` to fix type mismatch
  - Changed environment.ts addBirds and addHangGlider gui parameter types to `any` to fix incompatible type errors

## [1.5.1] - 2025-10-01 12:16 UTC

### Fixed
- **Town Generation Exclusion Zones**: Implemented exclusion zones to prevent buildings from being placed over town squares and parks
  - Added `ExclusionZone` interface to house-group-types with center and radius properties
  - Extended `HouseGroupConfig` to support exclusion zones array
  - Updated `calculateHousePositions` in house-group-utils to respect exclusion zones for all formation types (street, cul-de-sac, grid, suburban, rural, random)
  - Added `setExclusionZones` method to HouseGroupCreator class
  - All neighborhood creation methods now pass exclusion zones to house positioning logic
  - Town application defines exclusion zones for all 3 town squares (radius 100) and 3 parks (radius 85)
  - Buildings now avoid overlapping with Central Square (0,0,0), West Square (-600,0,0), Market Square (600,0,-300), and all parks

## [1.5.0] - 2025-09-30 UTC

### Refactored
- **Vehicle Folder Organization**: Reorganized vehicles into type-based folder structure
  - Created `aircraft/` folder for planes (Airliner, Cessna, Hercules, Jet)
  - Created `ground/` folder for ground vehicles (Car, AutonomousCar, Truck)
  - Created `aerial-sports/` folder for aerial sports (Paraglider, ParagliderVoxel, Hangglider, Tandem)
  - Created `components/` folder for vehicle parts (Wing, HangGliderWing, Glider)
  - Unified exports through main vehicles/index.ts
  - Updated all import paths throughout codebase (33 files affected)
  - Benefits: better organization, cleaner imports, easier navigation

- **Pilot Component Architecture**: Migrated from legacy to modern Pilot implementation
  - Removed legacy Pilot class from vehicles/components/Pilot.ts (175 lines removed)
  - All vehicles now use modern Pilot from characters/Pilot.ts
  - Updated Hangglider and Paraglider to use flattened PilotOptions API
  - Simplified pilot application options structure
  - Modern Pilot extends SimpleThreeComponent with proper resource management
  - Eliminated code duplication between legacy and modern implementations

### Added
- **Hercules Aircraft**: Added military transport plane to vehicle collection
  - Four-engine turboprop design with military color scheme
  - Displayed in planes application alongside Jet, Airliner, and Cessna
  - Configurable body, wing, propeller, and window colors
  - Scale option for size adjustment

### Added
- **ProceduralRoad for famara-animation**: Added procedural road connecting neighborhoods
  - Modified Environment.addHouses() to return neighborhood center positions
  - Integrated ProceduralRoad in famara-animation using returned house positions
  - Road connects 4 neighborhoods: suburban area, Famara coastal village, Noruegos rural settlement, and Teguise town center
  - Road configuration: 8 meters wide, 150 segments for smooth curves, light gray surface with center and edge lines
  - Added intermediate waypoint for improved road routing
  - Opacity support: Roads now support transparency with configurable opacity (0.2 in animation for subtle effect)

- **ProceduralRoad opacity support**: Added transparency options to road component
  - New `opacity` parameter (0-1, default: 1.0) for material transparency
  - New `transparent` boolean parameter to enable transparency rendering
  - Updated material caching to include opacity settings

- **Default theme**: Added "Default" theme to themes menu
  - Provides neutral, clean styling with light gray wireframe terrain
  - Set as the default theme when users first load the application
  - Allows users to return to basic styling after trying other themed looks
  - Features: white/gray clouds, light wireframe terrain, medium blue water, fog enabled
  - ThemeManager now always applies default theme on first load (no longer shows "no theme")
  - Theme selector highlights active theme with solid color background and thicker border
  - Default theme button shows medium gray color (#616161) instead of green

### Fixed
- **Roads demo height offset slider**: Fixed GUI slider range from 0-2 to 0-10 to match configured heightOffset of 5
  - Roads now properly render above terrain in the demo application

### Improved
- **Famara-animation camera transitions**: Enhanced camera animation smoothness
  - Phase 1: Upgraded from smoothstep to cubic easing (ease-in-out cubic) for gentler acceleration/deceleration
  - Phase 2: Upgraded from quadratic to quartic easing (ease-out quartic) for ultra-smooth, buttery deceleration
  - Target tracking: Implemented exponential smoothing with progressive increase for natural camera behavior
  - Made look transitions more gradual (reduced from 0.6 to 0.5 in phase 1, 1.5 to 1.2 in phase 2)
  - Result: Significantly smoother, more cinematic camera movement with no jarring transitions

### Removed
- **FlightControls**: Removed unused FlightControls and DEFAULT_FLIGHT_KEYBINDINGS exports
  - FlightControls was exported but never used in the codebase
  - Cleaned up src/foundation/systems/controls/index.ts
  - Deleted src/foundation/systems/controls/FlightControls.ts

### Refactored
- **Hangglider Component**: Simplified architecture by removing AutoFlier inheritance
  - No longer extends AutoFlier (removes tight coupling to path-following)
  - Now a simple component that returns THREE.Group
  - Use FlyingBehavior composition for autonomous flight when needed
  - Updated applications:
    - famara-animation: Uses scale option in constructor
    - flying-behavior-test: Removed emptyPath parameter
    - hangglider app: Added addGuiControls() call
    - environment.ts: Removed updateWrapSpeed() calls (no longer path-following)
  - More flexible: Can be used as static model or with behavior composition

- **HangGliderWing Component**: Removed legacy export wrapper
  - Simplified export to use modern SimpleThreeComponent directly
  - Removed HangGliderWingLegacy wrapper class
  - All applications now use the modern API

### Added
- **CameraTargetController**: Modern camera system with multi-target support
  - Generic THREE.Object3D targeting (no Flier dependency)
  - Four camera modes: Follow, FirstPerson, Orbit, Static
  - Smooth transitions between targets using animation interpolation
  - React UI component for target selection
  - lil-gui integration for fine-tuning
  - 80% less code than deprecated CameraController

#### New Features
- **Multi-Target Management**: Add/remove targets dynamically with names and metadata
- **Camera Modes**:
  - Follow: Chase camera behind target with configurable distance/height
  - FirstPerson: Inside target view with directional awareness
  - Orbit: Circular orbit around target (OrbitControls integration)
  - Static: Fixed camera position
- **React UI Component** (`CameraTargetUI.tsx`):
  - Collapsible panel with target selection buttons
  - Camera mode selector grid
  - Color-coded target buttons
  - Visual indicator for active target
  - Smooth hover effects and transitions

#### New Applications
- **Camera Switcher Demo** (`/camera-switcher-demo`): Comprehensive demonstration
  - Flying Cessna with autonomous flight behavior
  - Static ground and hill markers
  - Interactive target switching via UI
  - All camera modes showcased
  - Both React UI and lil-gui controls

### Enhanced
- **StoryOptions Interface**: Changed camera type from CameraController to THREE.PerspectiveCamera
  - Increases flexibility for different camera implementations
  - Backward compatible with proper type checking
  - Legacy apps use runtime type checking for CameraController features

- **Type Safety**: Added proper fallbacks for legacy camera features
  - flier-pg app uses runtime checking for animateTo method
  - Graceful degradation for cameras without legacy methods

### Deprecated
- **CameraController**: Marked as deprecated with migration guide
  - Replaced by CameraTargetController
  - Will be removed in future major version
  - Deprecation notice includes migration instructions
  - Technical debt item created for removal

### Documentation
- Comprehensive JSDoc comments in CameraTargetController
- React UI component usage examples
- Demo application showing best practices

## [1.4.0] - 2025-09-30 UTC

### Added
- **EngineFlyingBehavior**: Autonomous flight behavior for powered aircraft
  - Forward-looking terrain avoidance: Casts rays ahead to detect hills and initiates climbs proactively
  - Cruise altitude maintenance: Maintains preferred altitude when not avoiding obstacles
  - Multi-directional scanning: Checks center, left, and right (±17°) for comprehensive terrain awareness
  - Configurable parameters: cruise altitude, climb rate, terrain clearance, look-ahead distance
  - Extends FlyingBehavior with engine-specific characteristics

### Enhanced
- **FlyingBehavior Base Class**: Changed visibility of methods from private to protected
  - Enables proper inheritance for EngineFlyingBehavior
  - Methods made protected: updateFlight, getDesiredDirection, calculateObstacleAvoidance, calculateBoundaryForce, calculateTerrainAvoidance, updateSpeedReduction, logDebugInfo, constrainHeight, orientToDirection, updateDebugArrows

- **Famara Application**: Added Cessna aircraft with autonomous flight
  - Cessna flies autonomously around Famara beach area
  - Uses EngineFlyingBehavior with island-aware settings (2000 radius, 250 cruise altitude)
  - Avoids terrain with 100-unit clearance, looks ahead 200 units
  - Flies at 8.0 speed with smooth 0.6 turn rate
  - Proper cleanup in dispose method

### Documentation
- Updated behavior inheritance patterns for flight systems
- Clarified distinction between wind-dependent (gliders) and engine-powered (planes) flight

## [1.3.0] - 2025-09-30 UTC

### Added
- **Aircraft Components**: Three new procedural aircraft types
  - **Jet**: Military-style jet with swept wings, twin engines, and glowing exhausts
  - **Airliner**: Commercial passenger aircraft with wide body, windows, and detailed features
  - **Cessna**: General aviation single-engine aircraft with high-wing configuration and landing gear
  - All aircraft use procedural geometry with configurable colors and scales
  - Resource-managed materials for efficient memory usage
  - Shadow casting and receiving support

#### New Applications
- **Plane** (`/plane`): Single military jet aircraft showcase
  - Interactive camera controls
  - Rotation and scale adjustments via GUI
  - Clean workshop environment with ground plane
- **Planes** (`/planes`): Complete aircraft comparison showcase
  - All three aircraft types displayed side-by-side
  - Polygon count analysis for each aircraft
  - Labeled display with triangle counts
  - Interactive GUI controls for all aircraft

### Enhanced
- **Vehicle System**: Extended vehicles index with aircraft exports
  - Added Jet, Airliner, and Cessna to vehicle exports
  - TypeScript type exports for all new aircraft options
- **Configuration**: Updated apps.json with new aircraft applications
  - Plane application (priority 35)
  - Planes application (priority 36)
  - Both set to private visibility for development testing

## [1.2.1] - 2025-09-29 14:30 UTC

### Added
- **FlyingBehavior System**: Complete autonomous flight behavior system
  - Advanced obstacle avoidance using distance-based force calculations
  - Boundary detection with progressive return forces to prevent area escape
  - Terrain height awareness using raycasting for minimum altitude maintenance
  - Multiple flight patterns: FREE_ROAM, CIRCULAR, FIGURE_EIGHT, PERCH_AND_FLY
  - Smooth direction changes with configurable turn speed and orientation
  - Built-in animation loop with proper disposal and lifecycle management
  - Alternative to path-based AutoFlier with dynamic environmental awareness

#### New Applications
- **Flying Behavior Test** (`/flying-behavior-test`): Comprehensive test environment
  - Hangglider with autonomous flight demonstration
  - Strategic wall obstacle placement for avoidance testing
  - Real-time GUI controls for behavior parameter adjustment
  - Flight state debugging and logging capabilities
  - Registered in apps.json configuration system

### Enhanced
- **Animals Showcase**: Complete procedural bird geometry implementation
  - Replaced GLB model loading with Three.js shape-based bird creation
  - Enhanced bird appearance with wing shapes, eyes, natural beak colors
  - Improved bird colors: Crow (0x404040), Vulture (0x808080) for better visibility
  - Fixed "black squares" issue in animals showcase
  - Removed unused GLB loading methods and dependencies
  - Wing animation now works with procedural geometry shapes

### Refactored
- **Showcase Configuration**: Removed outdated indirection layer
  - Eliminated showcase-config.ts with hardcoded app mappings
  - Updated showcase-entry.tsx to use direct bundle name resolution
  - Simplified story name resolution without configuration duplication
  - Maintains same functionality with reduced code complexity

## [1.2.0] - 2025-01-27 15:30 UTC

### Added
- **Flyzone Management System**: Complete new system for paragliding location management
  - Interactive flyzone editor with terrain-based placement
  - Weather-based takeoff recommendation engine
  - Wind analysis and scoring algorithms
  - 3D visualization with color-coded markers
  - Professional pilot tools for flight planning

#### New Applications
- **Flyzone Editor** (`/flyzone-editor`): Advanced terrain-based editor for creating and editing flyzone locations
  - Click-to-place takeoff and landing locations
  - Interactive flyzone boundary definition
  - Wind condition configuration interface
  - Real-time GPS coordinate display
  - Terrain-aware placement validation

- **Flyzone Visualizer** (`/flyzone-visualizer`): Weather analysis and takeoff recommendations
  - Real-time wind condition input
  - Ranked takeoff recommendations (0-100 scoring)
  - Pilot skill level filtering
  - Safety warnings and flying advice
  - Interactive 3D wind visualization

#### New Components
- **FlyzoneAPI**: Complete backend API with localStorage persistence
  - CRUD operations for flyzone locations
  - Weather analysis and recommendation engine
  - GPS coordinate conversion utilities
  - Wind condition scoring algorithms

- **FlyzoneMarkers**: 3D marker system for visual representation
  - Takeoff location markers with wind direction indicators
  - Landing zone boundaries with approach vectors
  - Flight phase volumes with altitude ranges
  - Color-coded scoring visualization

- **WindVisualization**: Dynamic wind flow visualization
  - 3D wind direction arrows across terrain
  - Particle system for wind flow animation
  - Speed-based color coding
  - Real-time wind condition updates

#### Data Structures
- Comprehensive TypeScript interfaces for all flyzone entities
- GPS and Three.js coordinate conversion
- Wind condition analysis and safety information
- Media attachment support for images and videos

#### User Interface
- Professional pilot-focused UI design
- Weather condition input controls
- Real-time takeoff recommendations
- Detailed location analysis panels
- Responsive mobile-friendly design

### Enhanced
- **App Registry**: Added flyzone management apps to central registry
  - Flyzone Editor registered as priority tool
  - Flyzone Visualizer for weather analysis
  - Updated location editor marked as legacy

### Documentation
- **FLYZONE_MANAGEMENT.md**: Complete system documentation
- **API.md**: Comprehensive API reference with examples
- Usage examples and integration guidelines

### Technical
- localStorage-based data persistence (production-ready for offline use)
- Three.js integration for 3D terrain interaction
- Real-time wind analysis calculations
- Professional color palettes and visual design
- Performance optimization for large datasets

## [1.1.0] - Previous

### Enhanced Boat System
- Renamed `Boat.ts` to `SmallSailBoat.ts`
- Added `FishingBoat`, `Yacht`, and `SpeedBoat` classes
- Enhanced environment system with boat variety and randomization
- Improved boat showcase with proper spacing and camera positioning

### Color Palette Improvements
- Replaced random bright colors with professional palettes in helmet demos
- Added military, gray, and steel color themes
- Fixed head demo rendering issues with massive grids

### Architecture
- Converted FlyZones and LocationEditor apps to extend TerrainBase
- Added terrain access for better integration
- Updated import paths and inheritance chains

### Previous Features
- Three.js-based 3D paragliding simulation
- Multiple demo applications and workshop tools
- Terrain, weather, and environment systems
- Bird and hang glider animations
- Theme engine with multiple visual styles