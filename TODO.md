Implement the following tasks if any is added follwing the instructions described below:
---
TASKS:
- in the boat animation, extract all representative variables so it's easy to tweak the animation dynamics just by setting a few variables in the header of the application code.
- I think the boat floating effect is still broken.
- we should probably create a base class for applications that don't have any lighting or rendering any threejs object, like the tile debug dashboard or the title mapper debugger.
---

### Instructions

Don't forget to:
- Read CLAUDE.md for development guidelines.
- Commit the changes following the commit guidelines. There is a git commit hook that will trigger a build step. If the build process fails while commiting, fix it and try to commit again. Never commit skipping the build step (never use --no-verify)
- Implement, commit then remove each task from this file as you implent them, leaving the instructions like this one untouched.
- If you find some technical debt as you go along, add it to a TECHNICAL_DEBT.md file