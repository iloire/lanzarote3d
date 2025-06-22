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
      { story: "animation" },
      { story: "animation3", description: "Voxel animation" },
      { story: "game", description: "The game!" },
    ];

    // Dev/testing features
    const experimentStories = [
      { story: "flier" },
      { story: "flyzones" },
      { story: "locationEditor" },
      { story: "paragliderVoxel" },
      { story: "photobooth" },
    ];

    // Dev-only features
    const devOnlyStories = [
      { story: "night", description: "Night mode" },
      { story: "voxel", description: "Voxel example" },
      { story: "head" },
      { story: "helmet" },
      { story: "paraglider", description: "Paraglider" },
      { story: "hangglider", description: "Hangglider" },
      { story: "terrain", description: "Terrain" },
      { story: "clouds", description: "Clouds" },
      { story: "glider" },
      { story: "pilot" },
      { story: "workshop", description: "Workshop" },
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
            {story.story}
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
