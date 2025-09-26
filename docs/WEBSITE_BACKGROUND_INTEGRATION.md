# Using Lanzarote 3D Demos as Website Backgrounds

This guide explains how to integrate Lanzarote 3D demos as interactive backgrounds for your websites.

## Overview

The Lanzarote 3D project includes several demos that can work beautifully as website backgrounds:
- **Animation Demo**: Cinematic camera movement around paragliders
- **Photobooth**: Static scenic 3D environment
- **Clouds Demo**: Animated cloud system
- **Night Demo**: Atmospheric nighttime scene

## Quick Setup

### 1. Build the Demo

First, build the specific demo you want to use:

```bash
cd lanzarote3d
npm install
npm run build
```

This generates the built files in the `dist/` directory.

### 2. Copy Required Files

Copy these files to your website:

```
dist/
├── main.bundle.js        # Core application code
├── index.html           # Main HTML template (for reference)
├── assets/              # 3D models, textures, audio
└── *.bundle.js          # Individual demo bundles
```

### 3. Basic HTML Structure

Create an HTML structure like this:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>My Website with 3D Background</title>
    <style>
        /* Make 3D canvas fullscreen background */
        #lanzarote3d-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1; /* Behind other content */
            pointer-events: none; /* Allow clicks to pass through */
        }

        /* Your website content */
        .content {
            position: relative;
            z-index: 1;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.9); /* Semi-transparent */
            margin: 2rem;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <!-- 3D Background Container -->
    <div id="lanzarote3d-container"></div>

    <!-- Your Website Content -->
    <div class="content">
        <h1>My Website</h1>
        <p>Your content goes here, with 3D background behind it.</p>
    </div>

    <!-- Load 3D Demo -->
    <script src="main.bundle.js"></script>
</body>
</html>
```

## Demo-Specific Integration

### Animation Demo (Recommended for Backgrounds)

**Best for**: Landing pages, portfolio sites, travel websites

**Features**:
- Automatic cinematic camera movement
- No user interaction needed
- Loops seamlessly
- Optimized for passive viewing

**Implementation**:
```html
<script>
// Initialize animation demo as background
window.addEventListener('load', () => {
    const container = document.getElementById('lanzarote3d-container');

    // Configure for background use
    const config = {
        container: container,
        showUI: false,           // Hide menu buttons
        autoStart: true,         // Start automatically
        loop: true,              // Loop animation
        controls: false,         // Disable user controls
        audio: false            // Disable audio for background
    };

    // Load animation demo
    loadLanzarote3DDemo('animation', config);
});
</script>
```

### Photobooth Demo

**Best for**: Static, elegant backgrounds

**Features**:
- Beautiful static 3D scene
- Low performance impact
- Professional appearance

### Clouds Demo

**Best for**: Minimalist, atmospheric backgrounds

**Features**:
- Subtle cloud animations
- Light performance footprint
- Works well with text overlay

## Advanced Configuration

### Performance Optimization

```javascript
const backgroundConfig = {
    // Reduce quality for background use
    renderer: {
        antialias: false,        // Disable anti-aliasing
        precision: 'lowp',       // Use low precision
        powerPreference: 'low-power'
    },

    // Limit frame rate for background
    maxFPS: 30,

    // Reduce detail distance
    lodDistance: 0.5,

    // Disable expensive effects
    shadows: false,
    postProcessing: false
};
```

### Responsive Behavior

```css
/* Hide 3D background on mobile to save battery */
@media (max-width: 768px) {
    #lanzarote3d-container {
        display: none;
    }

    .content {
        background: rgba(255, 255, 255, 1); /* Solid background on mobile */
    }
}

/* Pause animations when page is not visible */
@media (prefers-reduced-motion: reduce) {
    #lanzarote3d-container {
        display: none;
    }
}
```

### Content Overlay Styling

```css
.content-overlay {
    background: rgba(0, 0, 0, 0.6);      /* Dark overlay */
    backdrop-filter: blur(2px);           /* Blur effect */
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
}

/* Glass morphism effect */
.glass-content {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

## Integration Methods

### Method 1: Direct Embed (Simplest)

Copy the built files directly to your website and load them.

**Pros**: Simple, fast setup
**Cons**: Larger file size, harder to customize

### Method 2: Custom Build (Recommended)

Create a custom build that includes only the demo you need:

```javascript
// custom-background.js
import { Animation } from './src/apps/demos/animation';
import { setupRenderer } from './src/foundation/systems/rendering';

export class Lanzarote3DBackground {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showUI: false,
            autoStart: true,
            loop: true,
            controls: false,
            ...options
        };
    }

    async init() {
        const renderer = setupRenderer(this.container);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);

        await Animation.load({
            scene, camera, renderer,
            controls: null, // No controls for background
            gui: null       // No GUI for background
        });

        this.startRenderLoop(renderer, scene, camera);
    }

    startRenderLoop(renderer, scene, camera) {
        const animate = () => {
            if (this.options.maxFPS) {
                setTimeout(() => requestAnimationFrame(animate), 1000 / this.options.maxFPS);
            } else {
                requestAnimationFrame(animate);
            }
            renderer.render(scene, camera);
        };
        animate();
    }
}
```

### Method 3: CDN/External Hosting

Host the 3D background on a separate domain or CDN:

```html
<iframe
    id="background-frame"
    src="https://your-cdn.com/lanzarote3d-background"
    style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; border: none; pointer-events: none;">
</iframe>
```

## Performance Considerations

### Loading Optimization

```javascript
// Lazy load 3D background
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            loadLanzarote3DBackground();
            observer.disconnect();
        }
    });
});

observer.observe(document.querySelector('.hero-section'));
```

### Memory Management

```javascript
// Clean up when page is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations, reduce quality
        background.pause();
    } else {
        // Resume animations
        background.resume();
    }
});
```

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 12+)
- **Mobile**: Reduced features recommended for battery life

## File Size Impact

| Demo | Bundle Size | Assets | Total |
|------|-------------|---------|-------|
| Animation | ~1.1MB | ~8.5MB | ~9.6MB |
| Photobooth | ~1.1MB | ~8.5MB | ~9.6MB |
| Clouds | ~1.1MB | ~2MB | ~3.1MB |

## Troubleshooting

### Common Issues

1. **White screen**: Check browser console for WebGL support
2. **Poor performance**: Reduce quality settings or disable on mobile
3. **Loading issues**: Ensure all asset files are accessible
4. **Layout conflicts**: Check z-index values and positioning

### Debug Mode

```javascript
const debug = {
    showStats: true,        // Show FPS counter
    showBoundingBoxes: true, // Show 3D object bounds
    logPerformance: true    // Log performance metrics
};
```

## Example Websites

Check out these example integrations:
- [Landing Page Example](examples/landing-page.html)
- [Portfolio Example](examples/portfolio.html)
- [Travel Site Example](examples/travel-site.html)

## Support

For technical support or customization requests:
- GitHub Issues: [Create an issue](https://github.com/your-repo/lanzarote3d/issues)
- Documentation: [Full documentation](README.md)
- Performance optimization: See [PERFORMANCE.md](PERFORMANCE.md)

---

*Last updated: 2025-09-26*