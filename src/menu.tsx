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
      { story: "game", description: "The game!" },
      { story: "workshop" },
      { story: "mechanics" },
      { story: "paraglider" },
      { story: "hangglider" },
      { story: "terrain" },
      { story: "night" },
      { story: "cloud" },
      { story: "clouds" },
      { story: "flyzones" },
      { story: "daytime" },
    ];

    const buttons = stories.map((story) => (
      <div className="button">
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
