# Changelog

All notable changes to the Lanzarote 3D project will be documented in this file.

## [1.6.0] - 2025-10-02 00:00 UTC

### Added
- **Comprehensive LOD (Level of Detail) System**: Implemented a flexible 4-level LOD system for optimal rendering performance
  - Created LevelOfDetail enum with ULTRA_LOW, LOW, MEDIUM, HIGH levels
  - Defined polygon budgets: ULTRA_LOW (10-100), LOW (100-500), MEDIUM (500-2000), HIGH (2000+)
  - Distance thresholds for automatic LOD selection (500, 200, 50 units)
  - Utility functions for LOD selection, budget validation, and level management
  - Abstract LODComponent base class for easy LOD implementation
  - Backward compatibility with legacy lowPoly boolean parameter

- **LOD-Enabled Buildings**: Migrated 9 building components to 4-level LOD system for optimal performance
  - **TownSquare LOD levels**:
    - ULTRA_LOW (~30-50 polys): Single plane + simple box monument
    - LOW (~60-150 polys): Simple ground + basic monument + 4 benches
    - MEDIUM (~500-800 polys): Basic pattern + benches + simplified decorations
    - HIGH (~1000-5500 polys): Full detail with grid pattern, flowers, lamps
  - **Dome LOD levels**:
    - ULTRA_LOW (~20-40 polys): Simple cylinder + 4-segment sphere
    - LOW (~100-200 polys): 8-segment hemisphere + basic furniture
    - MEDIUM (~600-1000 polys): 12-segment geodesic with 6×12 panels
    - HIGH (~2000-3000 polys): Full geodesic with 8×16 panels
  - **House LOD levels** (supports Small/Medium/Large/Modern types):
    - ULTRA_LOW (~20-50 polys): Single box + roof
    - LOW (~100-300 polys): Main wing + roof + simple door
    - MEDIUM (~500-1000 polys): All wings + roofs + simple windows (no frames)
    - HIGH (~2000+ polys): Full detail with frames, modern features
  - **Villa LOD levels**:
    - ULTRA_LOW (~20-50 polys): Single box + roof
    - LOW (~100-300 polys): Main building + roof + 2 columns
    - MEDIUM (~500-1000 polys): Main + wings + roofs + simple windows
    - HIGH (~2000+ polys): Full luxury with pool, terrace, cylindrical columns
  - **Barn LOD levels**:
    - ULTRA_LOW (~24 polys): Box body + flat roof
    - LOW (~36 polys): Body + angled roof + door
    - MEDIUM (~60 polys): Body + roof + door + 2 windows
    - HIGH (~60 polys): Full detail with trim
  - **Townhouse LOD levels**:
    - ULTRA_LOW (~20-50 polys): Single box + roof
    - LOW (~100-200 polys): Body + simple roof + door
    - MEDIUM (~500-800 polys): Body + roof + peak + simplified windows
    - HIGH (~1500-2000 polys): Full detail with frames, cornices, chimney
  - **DesertHouse LOD levels**:
    - ULTRA_LOW (~20-50 polys): Box + flat roof
    - LOW (~100-200 polys): Body + roof + door + 1 window
    - MEDIUM (~500-800 polys): Body + parapet + door + 3 windows
    - HIGH (~1500-2000 polys): Full adobe detail with cactus, courtyard, shade
  - **DesertHouseWithPool LOD levels**:
    - ULTRA_LOW (~30-60 polys): Simple house + pool boxes
    - LOW (~150-300 polys): House structure + pool
    - MEDIUM (~800-1200 polys): House + pool + minimal landscaping
    - HIGH (~2500+ polys): Full detail with async-loaded components, all amenities
  - **Hospital LOD levels**:
    - ULTRA_LOW (~24 polys): Single box + roof
    - LOW (~72 polys): Main body + simple cross + 3 windows
    - MEDIUM (~144 polys): Main + wings + cross + 6 windows
    - HIGH (~2500-3000 polys): Full medical facility with helipad, emergency entrance

### Changed
- **Building Architecture**: Migrated 9 building components from SimpleThreeComponent to LODComponent
  - Buildings: TownSquare, Dome, House, Villa, Barn, Townhouse, DesertHouse, DesertHouseWithPool, Hospital
  - Replaces lowPoly boolean with levelOfDetail enum for finer control (4 levels)
  - Dynamic LOD switching support via setLOD() method
  - Built-in polygon counting for monitoring/debugging
  - LOD-specific material/geometry naming prevents resource conflicts
  - Maintains full backward compatibility with existing code using lowPoly
  - Total changes: +1684 insertions, -557 deletions across 7 building files
  - Performance benefits: Reduced polygon count for distant buildings improves frame rate
  - Supports explicit LOD control via levelOfDetail parameter for fine-tuned performance

- **Buildings Showcase Application**: Updated to display all 4 LOD levels for comprehensive visualization
  - Changed from 2-row layout (normal vs low-poly) to 4-row layout (all LOD levels)
  - Shows 44 building instances total: 11 building types × 4 LOD levels each
  - Row 1: ULTRA_LOW (10-100 polys), Row 2: LOW (100-500 polys), Row 3: MEDIUM (500-2000 polys), Row 4: HIGH (2000+ polys)
  - Stats overlay shows 4-column comparison with color-coded polygon counts and percentage savings
  - Removed legacy building imports in favor of new LOD-enabled classes
  - Camera positioned higher (0, 80, 100) to view all 4 rows simultaneously
  - Expanded ground size to 1200×200 units for better layout
  - Each building labeled with name and polygon count for easy comparison

## [1.5.10] - 2025-10-01 15:00 UTC

### Added
- **Low-Poly Building Options**: Added lowPoly option to TownSquare and Dome buildings for performance optimization
  - TownSquare lowPoly mode reduces from ~1000-5500 to ~60-150 polygons
  - Dome lowPoly mode reduces from ~1000-3000 to ~356 polygons
  - Low-poly versions maintain visual structure while dramatically reducing geometry
  - TownSquare low-poly: simple ground plane, minimal monument, 4 basic benches (no flowers/lamps/grid pattern)
  - Dome low-poly: simple hemisphere (16 segments), basic bed, door frame, floor
  - Both buildings follow the same pattern as other buildings (lowPoly option instead of separate components)
  - Example: `new TownSquare({ lowPoly: true })` or `new Dome({ lowPoly: true })`

### Fixed
- **HouseGroupCreator Position Errors**: Fixed undefined position errors when creating houses
  - Fixed addLandPlot() and addPoolToHouse() to use houseMesh.position instead of invalid position parameter
  - Fixed createNeighborhood() to handle cases where positions.length < houses.length due to exclusion zones
  - Added position validation check before creating houses
  - Added warning log when houses can't be placed due to exclusion zones
  - Prevents "Cannot read properties of undefined (reading 'x')" errors
- **Performance Metrics NaN Values**: Fixed NaN percentage display in town application performance UI
  - Added division by zero protection in PerformanceUI.updatePerformanceInfo()
  - Added null/undefined checks for all polygon breakdown values
  - Fixed town application polygon counting to include roads, parks, and squares properties
  - Added pattern matching for roads, parks, and squares in updatePolygonCount()
  - Now correctly displays "0.0%" instead of "NaN%" for empty categories

### Refactored
- **Building Content Methods**: Separated low-poly and high-poly content creation for better code organization
  - TownSquare now has `createLowPolyContent()` and `createHighPolyContent()` methods
  - Dome now has `createLowPolyDome()` and `createHighPolyDome()` methods
  - Main `createContent()` method delegates to appropriate method based on lowPoly flag
  - Improves code readability and maintainability

## [1.5.9] - 2025-10-01 14:45 UTC

### Fixed
- **PilotVoxel Asset Resolution**: Fixed character asset resolution to happen before validateOptions is called
  - Created static prepareOptions() method to resolve character assets before super() call
  - Moved asset resolution from instance method to static method to avoid accessing undefined state
  - Fixed validateOptions() to work correctly during construction when pilotOptions isn't set yet
  - Updated paraglider-voxel app to use CharacterType enum instead of direct file imports
  - Removed redundant manual asset imports in favor of CharacterRegistry
  - Character switching now properly prepares options before reloading

## [1.5.8] - 2025-10-01 14:30 UTC

### Added
- **addTown Helper Function**: Created new environment helper to easily populate towns of different types and sizes
  - Added addTown() method to Environment class with configurable options for type, size, and lowPoly mode
  - Supports five town types: village, rural, suburban, town, and city with appropriate house counts and formations
  - Three size options (small, medium, large) that scale house counts proportionally
  - Automatically maps town type to appropriate formation (village→random, rural→rural, suburban→suburban, town→street, city→grid)
  - Updated addHouses() to use addTown internally for better code reusability
  - Updated famara application to use addTown helper directly instead of addHouses
  - Examples: addTown(center, terrain, { type: 'village', size: 'small' }) creates 5 houses in random formation
  - Examples: addTown(center, terrain, { type: 'city', size: 'large' }) creates 30 houses in grid formation

## [1.5.7] - 2025-10-01 13:17 UTC

### Refactored
- **Remove LegacyPilotVoxel**: Replaced legacy implementation with modern AsyncThreeComponent-based PilotVoxel
  - Updated ParagliderVoxel to use modern PilotVoxel instead of LegacyPilotVoxel
  - Changed import from LegacyPilotVoxel to PilotVoxel in ParagliderVoxel.ts
  - Updated type references and instance variables to use PilotVoxel
  - Removed LegacyPilotVoxel.ts file (44 lines removed)
  - Removed LegacyPilotVoxel export from characters/index.ts
  - Modern PilotVoxel provides better architecture with async loading, resource management, character registry support, and proper lifecycle management

### Fixed
- **SubmarineHarness Scaling**: Made all dimensions proportional to DEFAULT_HEIGHT parameter for dynamic resizing
  - Changed DEFAULT_HEIGHT from 450 to 200 for shorter, sleeker profile
  - Changed DEFAULT_DEPTH from 800 to 1200 for longer pod-like appearance
  - All Y positions now calculated relative to height parameter (centerY = -height * 2.0)
  - All geometry sizes use proportional multipliers (width * 0.13, height * 0.32, depth * 0.0625, etc)
  - Lowered center position to -height * 2.0 to make pilot head more visible above harness
  - Harness now properly scales when DEFAULT_HEIGHT is adjusted
  - Window sizes, fins, panels, carabiners, and thruster all scale proportionally

## [1.5.6] - 2025-10-01 13:05 UTC

### Fixed
- **Pilot Options Not Applied**: Fixed Pilot constructor to properly pass metadata and options as separate parameters
  - Changed super() call from single object to two parameters: metadata and options
  - Metadata object now contains only name and version
  - Options object contains all Pilot-specific configuration including headType, helmetType, harnessType, colors, etc.
  - Options spreading (...options) now correctly overrides defaults
  - Pilot showcase now properly displays different head types, helmet types, and harness types for each pilot

## [1.5.5] - 2025-10-01 13:01 UTC

### Refactored
- **Birds to FlockBirds Rename**: Renamed wildlife/Birds.ts to wildlife/FlockBirds.ts for more precise naming
  - Renamed file from Birds.ts to FlockBirds.ts using git mv
  - Updated class name from Birds to FlockBirds throughout the file
  - Updated all imports in environment.ts from Birds to FlockBirds
  - Updated type declarations (birds property) from Birds to FlockBirds
  - Updated wildlife/index.ts to export FlockBirds and maintain backwards compatibility with Birds alias
  - No breaking changes - legacy Birds export still available for backwards compatibility

## [1.5.4] - 2025-10-01 13:08 UTC

### Added
- **Multiple Harness Types for Pilot**: Created OpenHarness and SubmarineHarness variants to provide visual diversity
  - Created OpenHarness.ts with minimal strap-based harness design (climbing gear style)
  - Created SubmarineHarness.ts with enclosed pod-like harness design (submarine/spaceship style)
  - Added HarnessType enum (Cocoon, Open, Submarine) to Pilot component
  - Extended PilotOptions with harnessType, harnessColor1, and harnessColor2 parameters
  - Updated Pilot.createBody() to instantiate correct harness based on harnessType option
  - OpenHarness features thin shoulder straps, chest strap, leg straps, small seat board, and minimal reserve handle
  - SubmarineHarness features enclosed hull, transparent windows, stabilizer fins, thruster details, and emergency hatch
  - Pilot showcase now displays 5 pilots with different harness types: Cocoon (Default), Open (Default), Submarine (Warrior), Open (Skeleton), Submarine (Devil)

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