import React from "react";

class Menu extends React.Component {
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
      { story: "animation", name: "famara" },
      { story: "animation3", name: "famara voxel", description: "Voxel animation" },
      { story: "game", name: "game (WIP)", description: "The game!" },
    ];

    // Dev/testing features
    const experimentStories = [
      { story: "flier", name: "Flier" },
      { story: "flyzones", name: "Fly Zones" },
      { story: "locationEditor", name: "Location Editor" },
      { story: "paragliderVoxel", name: "Paraglider Voxel" },
      { story: "photobooth", name: "Photo Booth" },
    ];

    // Dev-only features
    const devOnlyStories = [
      { story: "night", name: "Night", description: "Night mode" },
      { story: "voxel", name: "Voxel Example", description: "Voxel example" },
      { story: "head", name: "Head" },
      { story: "helmet", name: "Helmet" },
      { story: "paraglider", name: "Paraglider", description: "Paraglider" },
      { story: "hangglider", name: "Hangglider", description: "Hangglider" },
      { story: "terrain", name: "Terrain", description: "Terrain" },
      { story: "clouds", name: "Clouds", description: "Clouds" },
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

    return (
      <div className="appOptions">
        <h2>Public Features</h2>
        {renderButtons(publicStories)}
        <h2>Experiments</h2>
        {renderButtons(experimentStories)}
        <h2>Dev Only</h2>
        {renderButtons(devOnlyStories)}
      </div>
    );
  }
}

export default Menu;
