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
      { story: "animation2" },
      { story: "animation3" },
      { story: "game", description: "The game!" },
    ];

    // Dev/testing features
    const experimentStories = [
      { story: "voxel" },
      { story: "voxelExample" },
      { story: "flier" },
      { story: "flyzones" },
      { story: "locationEditor" },
      { story: "glider" },
      { story: "paragliderVoxel" },
      { story: "night", description: "Night mode" },
      { story: "photobooth" },
    ];

    // Dev-only features
    const devOnlyStories = [
      { story: "head" },
      { story: "helmet" },
      { story: "paraglider", description: "Paraglider" },
      { story: "hangglider", description: "Hangglider" },
      { story: "terrain", description: "Terrain" },
      { story: "clouds", description: "Clouds" },
      { story: "pilot" },
      { story: "workshop", description: "Workshop" },
    ];

    const renderButtons = (stories) =>
      stories.map((story) => (
        <div className="button" key={story.story}>
          <button onClick={() => this.navigateTo(story.story)}>
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
