import React from "react";
import { getAppsByStatus, type AppMetadata } from "./apps/config/app-registry";

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
  };

  override componentDidMount() {
    this.checkIfMobile();
    window.addEventListener('resize', this.checkIfMobile);
  }

  override componentWillUnmount() {
    window.removeEventListener('resize', this.checkIfMobile);
  }

  checkIfMobile = () => {
    const isMobile = window.innerWidth <= 768;
    this.setState({ isMobile });
  };

  toggleMenu = () => {
    this.setState({ isMenuOpen: !this.state.isMenuOpen });
  };

  toggleMenuVisibility = () => {
    this.setState({ isMenuVisible: !this.state.isMenuVisible });
  };

  navigateTo(route: string) {
    // In development, use query parameters
    // In production, use separate HTML files
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Remove leading slash if present
    const cleanRoute = route.replace(/^\//, '');

    if (isDevelopment) {
      window.location.href = "?story=" + cleanRoute;
    } else {
      if (cleanRoute === "animation") {
        window.location.href = "index.html";
      } else {
        window.location.href = cleanRoute + ".html";
      }
    }
  }

  override render() {
    // Get apps from registry by status
    const publicApps = getAppsByStatus('public');
    const experimentalApps = getAppsByStatus('experimental');
    const devApps = getAppsByStatus('dev');

    // Get selected story from URL
    const params = new URLSearchParams(window.location.search);
    const selectedStory = params.get("story");

    const renderButtons = (apps: AppMetadata[]) =>
      apps.map((app) => {
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
              className={selectedStory === routeKey ? "selected" : ""}
              onClick={() => {
                this.navigateTo(app.route);
                if (this.state.isMobile) {
                  this.setState({ isMenuOpen: false });
                }
              }}
            >
              {app.name}
            </button>
            <span className={`description ${isHovered ? 'visible' : ''}`}>
              {app.description}
            </span>
          </div>
        );
      });

    const { showPublic = true, showExperiments: showExperiments = true, showDev: showDev = true } = this.props;
    const { isMobile, isMenuOpen, isMenuVisible } = this.state;

    // Mobile menu
    if (isMobile) {
      return (
        <div className="appOptions mobile">
          <div className="mobile-header">
            <h2>Lanzarote 3D</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={this.toggleMenuVisibility}
                style={{
                  background: isMenuVisible ? '#4CAF50' : '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  fontSize: '12px'
                }}
                title={isMenuVisible ? 'Hide Menu' : 'Show Menu'}
              >
                {isMenuVisible ? 'Hide' : 'Show'}
              </button>
              <button
                className="hamburger-menu"
                onClick={this.toggleMenu}
                aria-label="Toggle menu"
              >
                <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
              </button>
            </div>
          </div>

          {isMenuVisible && (
            <div className={`mobile-menu-content ${isMenuOpen ? 'open' : ''}`}>
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
              {showDev && devApps.length > 0 && (
                <>
                  <h3>Development</h3>
                  {renderButtons(devApps)}
                </>
              )}
            </div>
          )}
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
              marginBottom: '10px'
            }}
            title={isMenuVisible ? 'Hide Menu' : 'Show Menu'}
          >
            {isMenuVisible ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Menu content - conditionally visible */}
        {isMenuVisible && (
          <>
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
            {showDev && devApps.length > 0 && (
              <>
                <h2>Development</h2>
                {renderButtons(devApps)}
              </>
            )}
          </>
        )}
      </div>
    );
  }
}

export default Menu;
