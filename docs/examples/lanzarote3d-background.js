/**
 * Lanzarote 3D Background Integration Script
 *
 * Simple JavaScript library to embed Lanzarote 3D demos as website backgrounds.
 *
 * Usage:
 *   new Lanzarote3DBackground('#container', 'animation', options);
 *
 * @version 1.0.0
 * @author Lanzarote 3D Team
 */

class Lanzarote3DBackground {
    constructor(containerSelector, demoType = 'animation', options = {}) {
        this.container = typeof containerSelector === 'string'
            ? document.querySelector(containerSelector)
            : containerSelector;

        this.demoType = demoType;
        this.options = {
            // Default options
            showUI: false,
            autoStart: true,
            loop: true,
            controls: false,
            audio: false,
            quality: 'medium',
            maxFPS: 30,
            loadOnIdle: true,
            pauseWhenHidden: true,
            mobileEnabled: false,
            ...options
        };

        this.isInitialized = false;
        this.isPaused = false;
        this.rafId = null;

        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Lanzarote3D: Container not found');
            return;
        }

        // Check if mobile and mobile is disabled
        if (this.isMobile() && !this.options.mobileEnabled) {
            console.log('Lanzarote3D: Skipping initialization on mobile device');
            return;
        }

        // Check for WebGL support
        if (!this.hasWebGLSupport()) {
            console.warn('Lanzarote3D: WebGL not supported, skipping 3D background');
            return;
        }

        // Check for reduced motion preference
        if (this.prefersReducedMotion()) {
            console.log('Lanzarote3D: Reduced motion preferred, skipping animations');
            return;
        }

        // Setup container styles
        this.setupContainer();

        // Load based on strategy
        if (this.options.loadOnIdle && 'requestIdleCallback' in window) {
            requestIdleCallback(() => this.loadDemo(), { timeout: 3000 });
        } else {
            // Delay loading slightly to not block initial page render
            setTimeout(() => this.loadDemo(), 100);
        }

        // Setup page visibility handling
        if (this.options.pauseWhenHidden) {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pause();
                } else {
                    this.resume();
                }
            });
        }
    }

    setupContainer() {
        const styles = {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            zIndex: '-1',
            pointerEvents: 'none',
            overflow: 'hidden'
        };

        Object.assign(this.container.style, styles);
        this.container.classList.add('lanzarote3d-background');
    }

    async loadDemo() {
        if (this.isInitialized) return;

        try {
            // Show loading indicator
            this.showLoadingIndicator();

            // In a real implementation, you would dynamically import the demo
            // For now, we'll simulate the loading process

            console.log(`Loading Lanzarote 3D demo: ${this.demoType}`);

            // Simulate async loading
            await this.simulateLoading();

            // Initialize the actual 3D scene
            await this.initializeScene();

            this.isInitialized = true;
            this.hideLoadingIndicator();

            console.log('Lanzarote3D: Background initialized successfully');

            // Dispatch custom event
            this.container.dispatchEvent(new CustomEvent('lanzarote3d:ready', {
                detail: { demoType: this.demoType, options: this.options }
            }));

        } catch (error) {
            console.error('Lanzarote3D: Failed to initialize', error);
            this.hideLoadingIndicator();

            // Dispatch error event
            this.container.dispatchEvent(new CustomEvent('lanzarote3d:error', {
                detail: { error, demoType: this.demoType }
            }));
        }
    }

    async simulateLoading() {
        // In real implementation, this would load the actual demo
        // return import(`../dist/${this.demoType}.bundle.js`);

        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    async initializeScene() {
        // In real implementation, this would initialize THREE.js scene
        // For demo purposes, we'll create a simple canvas background

        const canvas = document.createElement('canvas');
        canvas.width = this.container.clientWidth;
        canvas.height = this.container.clientHeight;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        this.container.appendChild(canvas);
        this.canvas = canvas;

        // Start animation loop
        if (this.options.autoStart) {
            this.startAnimation();
        }
    }

    startAnimation() {
        if (this.isPaused) return;

        const animate = (timestamp) => {
            if (this.isPaused) return;

            // Limit frame rate if specified
            if (this.options.maxFPS) {
                if (!this.lastFrame) this.lastFrame = timestamp;

                const elapsed = timestamp - this.lastFrame;
                const fpsInterval = 1000 / this.options.maxFPS;

                if (elapsed < fpsInterval) {
                    this.rafId = requestAnimationFrame(animate);
                    return;
                }

                this.lastFrame = timestamp - (elapsed % fpsInterval);
            }

            // Simple animation for demo
            this.renderFrame(timestamp);

            this.rafId = requestAnimationFrame(animate);
        };

        this.rafId = requestAnimationFrame(animate);
    }

    renderFrame(timestamp) {
        if (!this.canvas) return;

        const ctx = this.canvas.getContext('2d');
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Simple animated gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        const hue = (timestamp * 0.01) % 360;

        gradient.addColorStop(0, `hsl(${hue}, 70%, 20%)`);
        gradient.addColorStop(0.5, `hsl(${hue + 60}, 60%, 15%)`);
        gradient.addColorStop(1, `hsl(${hue + 120}, 80%, 10%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add some animated particles
        this.renderParticles(ctx, timestamp);
    }

    renderParticles(ctx, timestamp) {
        const particleCount = 20;
        const time = timestamp * 0.001;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

        for (let i = 0; i < particleCount; i++) {
            const x = (Math.sin(time + i) * 0.5 + 0.5) * this.canvas.width;
            const y = (Math.cos(time * 0.7 + i) * 0.5 + 0.5) * this.canvas.height;
            const size = Math.sin(time + i) * 2 + 3;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    showLoadingIndicator() {
        const loader = document.createElement('div');
        loader.className = 'lanzarote3d-loader';
        loader.innerHTML = `
            <div class="lanzarote3d-spinner"></div>
            <div class="lanzarote3d-loading-text">Loading 3D Background...</div>
        `;

        // Add loader styles
        const style = document.createElement('style');
        style.textContent = `
            .lanzarote3d-loader {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: white;
                font-family: Arial, sans-serif;
            }

            .lanzarote3d-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top: 3px solid white;
                border-radius: 50%;
                animation: lanzarote3d-spin 1s linear infinite;
                margin: 0 auto 10px;
            }

            @keyframes lanzarote3d-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .lanzarote3d-loading-text {
                font-size: 14px;
                opacity: 0.8;
            }
        `;

        document.head.appendChild(style);
        this.container.appendChild(loader);
        this.loadingIndicator = loader;
        this.loadingStyle = style;
    }

    hideLoadingIndicator() {
        if (this.loadingIndicator) {
            this.loadingIndicator.remove();
            this.loadingIndicator = null;
        }
        if (this.loadingStyle) {
            this.loadingStyle.remove();
            this.loadingStyle = null;
        }
    }

    pause() {
        this.isPaused = true;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    resume() {
        if (!this.isInitialized || !this.isPaused) return;

        this.isPaused = false;
        this.startAnimation();
    }

    destroy() {
        this.pause();

        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('lanzarote3d-background');
        }

        this.isInitialized = false;
    }

    // Utility methods
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    hasWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext &&
                     canvas.getContext('webgl') ||
                     canvas.getContext('experimental-webgl'));
        } catch(e) {
            return false;
        }
    }

    prefersReducedMotion() {
        return window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Public API methods
    setQuality(quality) {
        this.options.quality = quality;
        // In real implementation, this would adjust render settings
        console.log(`Quality set to: ${quality}`);
    }

    setFPS(fps) {
        this.options.maxFPS = fps;
        console.log(`Max FPS set to: ${fps}`);
    }
}

// Convenience function for quick setup
function createLanzarote3DBackground(container, demo = 'animation', options = {}) {
    return new Lanzarote3DBackground(container, demo, options);
}

// Auto-initialize if data attributes are found
document.addEventListener('DOMContentLoaded', () => {
    const autoElements = document.querySelectorAll('[data-lanzarote3d]');

    autoElements.forEach(element => {
        const demo = element.dataset.lanzarote3d || 'animation';
        const options = {};

        // Parse data attributes as options
        if (element.dataset.lanzarote3dQuality) {
            options.quality = element.dataset.lanzarote3dQuality;
        }
        if (element.dataset.lanzarote3dFps) {
            options.maxFPS = parseInt(element.dataset.lanzarote3dFps);
        }
        if (element.dataset.lanzarote3dMobile) {
            options.mobileEnabled = element.dataset.lanzarote3dMobile === 'true';
        }
        if (element.dataset.lanzarote3dAudio) {
            options.audio = element.dataset.lanzarote3dAudio === 'true';
        }

        new Lanzarote3DBackground(element, demo, options);
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Lanzarote3DBackground, createLanzarote3DBackground };
}

// Global assignment for script tag usage
if (typeof window !== 'undefined') {
    window.Lanzarote3DBackground = Lanzarote3DBackground;
    window.createLanzarote3DBackground = createLanzarote3DBackground;
}