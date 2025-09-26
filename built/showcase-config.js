"use strict";
/**
 * Centralized configuration for showcase apps.
 * Add new apps here and they will automatically be included in the build.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleToStoryMap = exports.showcaseApps = void 0;
exports.showcaseApps = [
    // Main experiences
    { name: 'animation', title: 'Lanzarote - Animation', filename: 'index.html', category: 'main' },
    { name: 'photobooth', title: 'Lanzarote - Photo Booth', filename: 'photobooth.html', category: 'main' },
    { name: 'famara', title: 'Lanzarote - Famara', filename: 'famara.html', category: 'main' },
    { name: 'game', title: 'Lanzarote - Game', filename: 'game.html', category: 'main' },
    { name: 'flyzones', title: 'Lanzarote - Fly Zones', filename: 'flyzones.html', category: 'main' },
    // Tools
    { name: 'workshop', title: 'Lanzarote - Workshop', filename: 'workshop.html', category: 'tool' },
    { name: 'location-editor', title: 'Lanzarote - Location Editor', filename: 'location-editor.html', category: 'tool' },
    // Demos
    { name: 'clouds', title: 'Lanzarote - Clouds', filename: 'clouds.html', category: 'demo' },
    { name: 'night', title: 'Lanzarote - Night', filename: 'night.html', category: 'demo' },
    { name: 'paragliderVoxel', title: 'Lanzarote - Paraglider Voxel', filename: 'paragliderVoxel.html', category: 'demo' },
    { name: 'terrain', title: 'Lanzarote - Terrain', filename: 'terrain.html', category: 'demo' },
    { name: 'glider', title: 'Lanzarote - Glider', filename: 'glider.html', category: 'demo' },
    { name: 'pilot', title: 'Lanzarote - Pilot', filename: 'pilot.html', category: 'demo' },
];
// Auto-generate bundle to story mapping
exports.bundleToStoryMap = exports.showcaseApps.reduce(function (map, app) {
    map[app.name] = app.name;
    // Also handle special case aliases
    if (app.name === 'animation') {
        map['main'] = 'animation';
    }
    return map;
}, {});
