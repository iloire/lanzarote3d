Implement the following tasks if any is added following the instructions described below:
---
TASKS:
- do we need showcase-config.ts? We want to remove all that indirection and duplication
- place all cactus scenery objects into the scenery/cactus folder.
- also put all the trees scenery objects into the scenery/trees folder.
- same way we added birds that implement FlyableBehaviour, let's also have planes. Create only one Plane class for now in the vehicles folders.
- in AppMetadata, instead of having "status?: 'public' | 'experimental' | 'dev';" and "hidden?: boolean;" properties, let's remove the hidden property and rename the "status" property to "visibility: 'public', 'private', 'hidden''". 'public' will mean visible in production, 'private' visible in the menu only in development/localhost mode, and 'hidden' will hide the item in the menu always. 
- go through all the base files located in the /Users/ivan/code/lanzarote3d/src/foundation/components/base and analyze and document their use. See if all of them are needed or we can refactor or remove some for efficiency and code readability and mantenability
---

### Instructions

Don't forget to:
- Read CLAUDE.md for development guidelines.
- Commit the changes following the commit guidelines. There is a git commit hook that will trigger a build step. If the build process fails while commiting, fix it and try to commit again. Never commit skipping the build step (never use --no-verify)
- Implement, commit then remove each task from this file as you implent them, leaving the instructions like this one untouched.
- KEep the CHANGE_LOG.md up to date with all the changes we are commiting.
- If you find some technical debt as you go along, add it to a TECHNICAL_DEBT.md file