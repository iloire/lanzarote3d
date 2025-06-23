import React from "react";

interface MenuProps {
  showPublic?: boolean;
  showExperiments?: boolean;
  showDev?: boolean;
}

class Menu extends React.Component<MenuProps> {
  renderer: any;

  state = {
    loadingProcess: 0,
    showAppSelection: false,
  };

  navigateTo(story: string) {
    window.location.href = "?story=" + story;
  }

  render() {
    // Public/finished features
    const publicStories = [
      { story: "animation2", name: "famara voxel", description: "Voxel animation" },
    ];

    // Dev/testing features
    const experimentStories = [
      { story: "night", name: "night", description: "night mode" },
      { story: "clouds", name: "clouds", description: "clouds" },
      { story: "game", name: "game (WIP)", description: "The game, work in progress!" },
      { story: "photobooth", name: "photo booth" },
    ];

    // Dev-only features
    const devOnlyStories = [
      { story: "animation", name: "famara" },
      { story: "flier", name: "Flier" },
      { story: "locationEditor", name: "Location Editor" },
      { story: "flyzones", name: "Fly Zones" },
      { story: "paragliderVoxel", name: "Paraglider Voxel" },
      { story: "voxel", name: "Voxel Example", description: "Voxel example" },
      { story: "head", name: "Head" },
      { story: "helmet", name: "Helmet" },
      { story: "paraglider", name: "Paraglider", description: "Paraglider" },
      { story: "hangglider", name: "Hangglider", description: "Hangglider" },
      { story: "terrain", name: "Terrain", description: "Terrain" },
      { story: "glider", name: "Glider" },
      { story: "pilot", name: "Pilot" },
      { story: "workshop", name: "Workshop", description: "Workshop" },
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
          <span>{story.description || story.story}</span>
        </div>
      ));

    const { showPublic = true, showExperiments: showExperiments = true, showDev: showDev = true } = this.props;

    return (
      <div className="appOptions">
        {showPublic && (
          <>
            <h2>Public Features</h2>
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
