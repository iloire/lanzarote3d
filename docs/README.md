# Lanzarote 3D Documentation

This directory contains comprehensive documentation and examples for the Lanzarote 3D project.

## Documentation Files

### Core Documentation
- **[WEBSITE_BACKGROUND_INTEGRATION.md](WEBSITE_BACKGROUND_INTEGRATION.md)** - Complete guide for using Lanzarote 3D demos as website backgrounds

### Examples
- **[landing-page-example.html](examples/landing-page-example.html)** - Complete landing page with 3D background
- **[lanzarote3d-background.js](examples/lanzarote3d-background.js)** - JavaScript library for easy integration

## Quick Start

### For Website Backgrounds

1. **Copy built files** from `dist/` to your website
2. **Include the integration script**:
   ```html
   <script src="lanzarote3d-background.js"></script>
   ```
3. **Add container and initialize**:
   ```html
   <div id="background" data-lanzarote3d="animation"></div>
   ```

### Available Demos

| Demo | Best For | Performance |
|------|----------|-------------|
| `animation` | Landing pages, portfolios | Medium |
| `photobooth` | Static backgrounds | Low |
| `clouds` | Minimalist sites | Low |
| `night` | Atmospheric backgrounds | Medium |

### Integration Options

```javascript
// Simple auto-initialization
<div data-lanzarote3d="animation" data-lanzarote3d-fps="30"></div>

// Programmatic initialization
new Lanzarote3DBackground('#background', 'animation', {
    quality: 'medium',
    maxFPS: 30,
    mobileEnabled: false
});
```

## Browser Support

- ✅ Chrome/Edge 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Mobile Safari (with reduced features)

## Performance Guidelines

### Recommended Settings
- **Desktop**: Full quality, 60 FPS
- **Mobile**: Disabled or low quality, 30 FPS
- **Background use**: Medium quality, 30 FPS

### File Sizes
- Core bundle: ~1.1MB
- 3D assets: ~2-8MB depending on demo
- Total: ~3-10MB

## Getting Help

- **Issues**: [GitHub Issues](../../../issues)
- **Examples**: See `examples/` directory
- **Technical**: Review source code in `src/`

## Contributing

When adding new documentation:

1. Place in appropriate subdirectory
2. Update this README
3. Include practical examples
4. Test on multiple browsers
5. Optimize for performance

---

*For the main project documentation, see [../README.md](../README.md)*