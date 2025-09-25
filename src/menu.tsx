import React from "react";

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
  };

  navigateTo(story: string) {
    // In development, use query parameters
    // In production, use separate HTML files
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isDevelopment) {
      window.location.href = "?story=" + story;
    } else {
      if (story === "animation") {
        window.location.href = "index.html";
      } else {
        window.location.href = story + ".html";
      }
    }
  }

  override render() {
    // Public/finished features
    const publicStories = [
      { story: "animation", name: "main", description: "famara voxel animation" },
      { story: "photobooth", name: "photo booth" },
      { story: "workshop", name: "workshop", description: "workshop" },
      { story: "clouds", name: "clouds", description: "clouds" },
      { story: "night", name: "night", description: "night mode" },
      { story: "paragliderVoxel", name: "Paraglider Voxel" },
    ];

    // Dev/testing features
    const experimentStories = [
      { story: "game", name: "game (WIP)", description: "The game, work in progress!" },
    ];

    // Dev-only features
    const devOnlyStories = [
      { story: "flier", name: "Flier" },
      { story: "locationEditor", name: "Location Editor" },
      { story: "flyzones", name: "Fly Zones" },
      { story: "voxel", name: "Voxel Example", description: "Voxel example" },
      { story: "head", name: "Head" },
      { story: "helmet", name: "Helmet" },
      { story: "paraglider", name: "Paraglider", description: "Paraglider" },
      { story: "hangglider", name: "Hangglider", description: "Hangglider" },
      { story: "terrain", name: "Terrain", description: "Terrain" },
      { story: "glider", name: "Glider" },
      { story: "pilot", name: "Pilot" }
    ];

    // Get selected story from URL
    const params = new URLSearchParams(window.location.search);
    const selectedStory = params.get("story");

    const renderButtons = (stories) =>
      stories.map((story) => (
        <div className="button" key={story.story}>
          <button
            className={selectedStory === story.story ? "selected" : ""}
            onClick={() => this.navigateTo(story.story)}
          >
            {story.name || story.story}
          </button>
          <span>{story.description || ''}</span>
        </div>
      ));

    const { showPublic = true, showExperiments: showExperiments = true, showDev: showDev = true } = this.props;

    return (
      <div className="appOptions">
        {showPublic && (
          <>
            <h2>Lanzarote 3D</h2>
            {renderButtons(publicStories)}
          </>
        )}
        {showExperiments && (
          <>
            <h2>Experiments</h2>
            {renderButtons(experimentStories)}
          </>
        )}
        {showDev && (
          <>
            <h2>Dev Only</h2>
            {renderButtons(devOnlyStories)}
          </>
        )}
      </div>
    );
  }
}

export default Menu;
