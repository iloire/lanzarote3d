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
    const stories = [
      { story: "voxel" },
      { story: "animation" },
      { story: "animation2" },
      { story: "cloud" },
      { story: "clouds" },
      { story: "flier" },
      { story: "flyzones" },
      { story: "head" },
      { story: "helmet" },
      { story: "game", description: "The game!" },
      { story: "glider" },
      { story: "hangglider" },
      { story: "night" },
      { story: "paraglider" },
      { story: "paragliderVoxel" },
      { story: "photobooth" },
      { story: "pilot" },
      { story: "terrain" },
      { story: "workshop" },
    ];

    const buttons = stories.map((story) => (
      <div className="button" key={story.story}>
        <button onClick={() => this.navigateTo(story.story)}>
          {story.story}
        </button>
        <span>{story.description || story.story}</span>
      </div>
    ));

    return (<div className="appOptions">{buttons}</div>);
  }
}


export default Menu;
