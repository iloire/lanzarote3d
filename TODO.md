Implement the following tasks if any is added following the instructions described below:
---
TASKS:
- same thing we have a movingBehaviour or FloatingBehaviour, build a FlyingBehaviour that can be applied to a model and it can just fly around the scene. It must detect when terrain is close and slowly turn away from it. It shold also detect when has gone too far and return. To test the flyable behaviour, create an app that has a few walls and put the model with flyable behaviour in the middle. It should fly around and between the walls without going far away and without crash with the walls. Use the hangglider model for example to attach the flyable behaviour. We currently have the AutoFlier class but let's build the Flyable behavior and decide later what's best and remove the other option.

---

### Instructions

Don't forget to:
- Read CLAUDE.md for development guidelines.
- Commit the changes following the commit guidelines. There is a git commit hook that will trigger a build step. If the build process fails while commiting, fix it and try to commit again. Never commit skipping the build step (never use --no-verify)
- Implement, commit then remove each task from this file as you implent them, leaving the instructions like this one untouched.
- Keep the CHANGE_LOG.md up to date with all the changes we are commiting.
- If you find some technical debt as you go along, add it to a TECHNICAL_DEBT.md file