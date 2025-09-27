import React from 'react';
import { getAppsByStatus, type AppMetadata } from './apps/config/app-registry';
import { themeManager } from './foundation/systems/ThemeManager';
import { getAllThemes } from './foundation/themes';
import { Theme } from './foundation/types/Theme';

interface MenuProps {
  showPublic?: boolean;
  showExperiments?: boolean;
  showDev?: boolean;
}

class Menu extends React.Component<MenuProps> {
  renderer: any;

  override state = {
    loadingProcess: 0,
    showAppSelection: false,
    hoveredRoute: null as string | null,
    isMobile: false,
    isMenuOpen: false,
    isMenuVisible: true, // New state for menu visibility
    currentTheme: null as Theme | null,
    availableThemes: [] as Theme[],
    isApplyingTheme: false,
  };

  override componentDidMount() {
    this.checkIfMobile();
    window.addEventListener('resize', this.checkIfMobile);
    this.initializeThemes();
  }

  override componentWillUnmount() {
    window.removeEventListener('resize', this.checkIfMobile);
    if (this.themeChangeListener) {
      themeManager.removeListener(this.themeChangeListener);
    }
  }

  themeChangeListener: ((theme: Theme) => void) | null = null;

  initializeThemes = async () => {
    try {
      const themes = getAllThemes();
      const currentTheme = themeManager.getCurrentTheme();

      this.setState({
        availableThemes: themes,
        currentTheme: currentTheme,
      });

      // Listen for theme changes
      this.themeChangeListener = (theme: Theme) => {
        this.setState({ currentTheme: theme });
      };
      themeManager.addListener(this.themeChangeListener);
    } catch (error) {
      console.error('Failed to initialize themes:', error);
    }
  };

  handleThemeSelect = async (themeId: string) => {
    if (this.state.isApplyingTheme) return;

    this.setState({ isApplyingTheme: true });

    try {
      await themeManager.applyTheme(themeId);
      // On mobile, close the menu after theme selection
      if (this.state.isMobile) {
        this.setState({ isMenuOpen: false });
      }
    } catch (error) {
      console.error('Failed to apply theme:', error);
    } finally {
      this.setState({ isApplyingTheme: false });
    }
  };

  getThemeColor = (theme: Theme): string => {
    // Extract predominant color from theme
    switch (theme.id) {
      case 'golden':
        return '#FFD700';
      case 'arctic':
        return '#87CEEB';
      case 'storm':
        return '#4A4A4A';
      case 'autumn':
        return '#CD853F';
      case 'natural':
        return '#2196f3';
      default:
        return '#4CAF50';
    }
  };

  checkIfMobile = () => {
    const isMobile = window.innerWidth <= 1024; // Increased threshold for tablets and large phones
    this.setState({ isMobile });
  };

  toggleMenu = () => {
    this.setState({ isMenuOpen: !this.state.isMenuOpen });
  };

  toggleMenuVisibility = () => {
    this.setState({ isMenuVisible: !this.state.isMenuVisible });
  };

  navigateTo(route: string) {
    // Disable theme manager before navigation
    themeManager.disable();

    // In development, use query parameters
    // In production, use separate HTML files
    const isDevelopment =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Remove leading slash if present
    const cleanRoute = route.replace(/^\//, '');

    if (isDevelopment) {
      window.location.href = '?story=' + cleanRoute;
    } else {
      if (cleanRoute === 'animation') {
        window.location.href = 'index.html';
      } else {
        window.location.href = cleanRoute + '.html';
      }
    }
  }

  override render() {
    // Get apps from registry by status
    const publicApps = getAppsByStatus('public');
    const experimentalApps = getAppsByStatus('experimental');
    const devApps = getAppsByStatus('dev');

    // Get tool apps separately for the Tools section (dev only)
    const toolApps = getAppsByStatus('dev').filter(app => app.category === 'tool');

    // Get selected story from URL
    const params = new URLSearchParams(window.location.search);
    const selectedStory = params.get('story');

    const renderThemeButtons = () => {
      const { availableThemes, currentTheme, isApplyingTheme } = this.state;

      return availableThemes.map(theme => {
        const isActive = currentTheme?.id === theme.id;
        const isDisabled = isApplyingTheme;
        const themeColor = this.getThemeColor(theme);

        return (
          <div className="button" key={theme.id}>
            <button
              className={isActive ? 'selected' : ''}
              onClick={() => this.handleThemeSelect(theme.id)}
              disabled={isDisabled}
              style={{
                background: isActive
                  ? themeColor
                  : `linear-gradient(135deg, ${themeColor}88, ${themeColor}44)`,
                color: 'white',
                border: isActive ? `2px solid ${themeColor}` : `1px solid ${themeColor}66`,
                opacity: isDisabled ? 0.6 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              {theme.name}
            </button>
          </div>
        );
      });
    };

    const renderButtons = (apps: AppMetadata[]) =>
      apps.map(app => {
        const routeKey = app.route.replace('/', '');
        const isHovered = this.state.hoveredRoute === routeKey;

        return (
          <div
            className="button"
            key={routeKey}
            onMouseEnter={() => this.setState({ hoveredRoute: routeKey })}
            onMouseLeave={() => this.setState({ hoveredRoute: null })}
          >
            <button
              className={selectedStory === routeKey ? 'selected' : ''}
              onClick={() => {
                this.navigateTo(app.route);
                if (this.state.isMobile) {
                  this.setState({ isMenuOpen: false });
                }
              }}
            >
              {app.name}
            </button>
            <span className={`description ${isHovered ? 'visible' : ''}`}>{app.description}</span>
          </div>
        );
      });

    const {
      showPublic = true,
      showExperiments: showExperiments = true,
      showDev: showDev = true,
    } = this.props;
    const { isMobile, isMenuOpen, isMenuVisible } = this.state;

    // Mobile menu
    if (isMobile) {
      return (
        <div className="appOptions mobile">
          <div className="mobile-header">
            <h2>Lanzarote 3D</h2>
            <button className="hamburger-menu" onClick={this.toggleMenu} aria-label="Toggle menu">
              <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            </button>
          </div>

          <div className={`mobile-menu-content ${isMenuOpen ? 'open' : ''}`}>
            {/* Theme Buttons */}
            <h3>Themes</h3>
            {renderThemeButtons()}

            {showPublic && publicApps.length > 0 && (
              <>
                <h3>Main</h3>
                {renderButtons(publicApps)}
              </>
            )}
            {showExperiments && experimentalApps.length > 0 && (
              <>
                <h3>Experiments</h3>
                {renderButtons(experimentalApps)}
              </>
            )}
            {showDev && toolApps.length > 0 && (
              <>
                <h3>Tools</h3>
                {renderButtons(toolApps)}
              </>
            )}
            {showDev && devApps.length > 0 && (
              <>
                <h3>Development</h3>
                {renderButtons(devApps.filter(app => app.category !== 'tool'))}
              </>
            )}
          </div>
        </div>
      );
    }

    // Desktop menu
    return (
      <div className="appOptions">
        {/* Toggle button - always visible */}
        <div className="button">
          <button
            onClick={this.toggleMenuVisibility}
            style={{
              background: isMenuVisible ? '#4CAF50' : '#f44336',
              color: 'white',
              fontWeight: 'bold',
              marginBottom: '10px',
            }}
            title={isMenuVisible ? 'Hide Bar' : 'Show Bar'}
          >
            {isMenuVisible ? 'Hide Bar' : 'Show Bar'}
          </button>
        </div>

        {/* Menu content - conditionally visible */}
        {isMenuVisible && (
          <>
            {/* Theme Buttons */}
            <h2>Themes</h2>
            {renderThemeButtons()}

            {showPublic && publicApps.length > 0 && (
              <>
                <h2>Lanzarote 3D</h2>
                {renderButtons(publicApps)}
              </>
            )}
            {showExperiments && experimentalApps.length > 0 && (
              <>
                <h2>Experiments</h2>
                {renderButtons(experimentalApps)}
              </>
            )}
            {showDev && toolApps.length > 0 && (
              <>
                <h2>Tools</h2>
                {renderButtons(toolApps)}
              </>
            )}
            {showDev && devApps.length > 0 && (
              <>
                <h2>Development</h2>
                {renderButtons(devApps.filter(app => app.category !== 'tool'))}
              </>
            )}
          </>
        )}
      </div>
    );
  }
}

export default Menu;
