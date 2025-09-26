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
              onClick={() => this.navigateTo(app.route)}
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

    return (
      <div className="appOptions">
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
      </div>
    );
  }
}

export default Menu;
