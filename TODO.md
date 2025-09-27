Implement the following tasks if any is added follwing the instructions described below:
---
TASKS:
- do we need terrain field in CameraController?
- it looks like there is a lot of indirection, coupling and duplication. See the apps/shared/index.ts. Why does that file needs to have a reference to every demo? Suggest other ways.  Maybe using the app-registry?
---

### Instructions

Don't forget to:
- Read CLAUDE.md for development guidelines.
- Commit the changes following the commit guidelines. There is a git commit hook that will trigger a build step. If the build process fails while commiting, fix it and try to commit again. Never commit skipping the build step (never use --no-verify)
- Implement, commit then remove each task from this file as you implent them, leaving the instructions like this one untouched.
- If you find some technical debt as you go along, add it to a TECHNICAL_DEBT.md file