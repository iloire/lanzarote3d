Implement the following tasks if any is added follwing the instructions described below:
---
TASKS:
- Optimized Satellite Atlas (7×8 tiles - COMPLETE ISLAND, NO WASTE) can be actually 7x7 tiles, maybe even 7x6
- we have created a bunch of pages to debug tiling maping. It's ok, we can keep them, but let's include them in the main menu and use the same consistent structure and styling we have used for the other apps. Use "base" classes, etc
- we have created and downloaded a bunch of tiles. Make sure we keep the good ones and delete the ones that are not useful
- try to avoid putting modal windows on top of the main menu. We are doing this in the satellite-terrain app and also in the flyzone editor and visualizer.
- make flyzone-editor and flyzone-visualizer load the terrain map into a perfect top-down north-facing view
- flyzone editor has some ugly layout in terms of textarea and text input controls font and position. make them a bit prettier please. You can make the edit form a bit wider and take less height. Also don't overlap with main menu as I mentioned before.
- add an oscillating floating effect to Boats like if there are in ocean waves (like they are supposed to be)
- add the boats showcase to the "experiment" category in the menu

---

### Instructions

Don't forget to:
- Read CLAUDE.md for development guidelines.
- Commit the changes following the commit guidelines. There is a git commit hook that will trigger a build step. If the build process fails while commiting, fix it and try to commit again. Never commit skipping the build step (never use --no-verify)
- Implement, commit then remove each task from this file as you implent them, leaving the instructions like this one untouched.
- If you find some technical debt as you go along, add it to a TECHNICAL_DEBT.md file