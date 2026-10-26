import React from 'react';
import { getAppsByVisibility, type AppMetadata } from './config/app-registry';
import { isDevFlagSet } from './devMode';

interface MenuProps {
  showPrivate: boolean;
}

class Menu extends React.Component<MenuProps> {
  override state = {
    hoveredRoute: null as string | null,
    isMobile: false,
    isMenuOpen: false,
    isMenuVisible: this.getInitialMenuVisibility(),
  };

  getInitialMenuVisibility(): boolean {
    // Check for localStorage override to force show menu
    const forceShowMenu = localStorage.getItem('lanzarote_show_menu') === 'true' || isDevFlagSet();
    if (forceShowMenu) {
      return true;
    }

    // Hide menu by default for home app
    // Check query param
    const params = new URLSearchParams(window.location.search);
    const story = params.get('story');
    if (story === 'home') {
      return false;
    }
    // Check for production URL pattern
    if (window.location.pathname.includes('home.html')) {
      return false;
    }
    // Check for root path in development (no story param means home is default)
    const isRootPath =
      window.location.pathname === '/' || window.location.pathname === '/index.html';
    const hasNoStoryParam = !story;
    if (isRootPath && hasNoStoryParam) {
      return false;
    }
    return true;
  }

  override componentDidMount() {
    this.checkIfMobile();
    window.addEventListener('resize', this.checkIfMobile);
  }

  override componentWillUnmount() {
    window.removeEventListener('resize', this.checkIfMobile);
  }

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
    // In development, use query parameters
    // In production, use separate HTML files
    const isDevelopment =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Remove leading slash if present
    const cleanRoute = route.replace(/^\//, '');

    window.location.href = isDevelopment ? '?story=' + cleanRoute : cleanRoute + '.html';
  }

  override render() {
    const publicApps = getAppsByVisibility('public');
    const privateApps = this.props.showPrivate ? getAppsByVisibility('private') : [];

    // Get selected story from URL
    const params = new URLSearchParams(window.location.search);
    const selectedStory = params.get('story');

    const renderButtons = (apps: AppMetadata[], isPrivate: boolean = false) =>
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
              style={
                isPrivate
                  ? {
                      position: 'relative',
                    }
                  : undefined
              }
            >
              {app.name}
              {isPrivate && (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#ff9800',
                    marginLeft: '4px',
                    opacity: 0.7,
                    fontWeight: 'normal',
                  }}
                  title="Only listed in dev mode"
                >
                  dev
                </span>
              )}
            </button>
            <span className={`description ${isHovered ? 'visible' : ''}`}>{app.description}</span>
          </div>
        );
      });

    const { isMobile, isMenuOpen, isMenuVisible } = this.state;

    // Same sections in both layouts; mobile nests them under its own header, so one heading level down
    const Heading = isMobile ? 'h3' : 'h2';
    const sections = (
      <>
        <Heading>{isMobile ? 'Main' : 'Lanzarote 3D'}</Heading>
        {renderButtons(publicApps)}
        {privateApps.length > 0 && (
          <>
            <Heading>Private</Heading>
            {renderButtons(privateApps, true)}
          </>
        )}
      </>
    );

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

          <div className={`mobile-menu-content ${isMenuOpen ? 'open' : ''}`}>{sections}</div>
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
        {isMenuVisible && sections}
      </div>
    );
  }
}

export default Menu;
