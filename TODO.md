Implement the following tasks if any is added following the instructions described below:
---
TASKS:
<<<<<<< HEAD
- the dome is missing from the workshop application 
=======
<<<<<<< HEAD
- town square is great but make sure we don't put any buildings over it when generating the town
=======
- Migrate legacy vehicles to modern architecture (see docs/COMPONENT_COMPOSITION.md):
 -- Hangglider: Extend SimpleThreeComponent, override createObject() for async composition
 -- Paraglider: Same pattern as Hangglider
 -- ParagliderVoxel: Same pattern as Hangglider
 -- Tandem: Same pattern as Hangglider
 -- Update all to use getObject() instead of getMesh() for API consistency
- make sure the Hercules plane is added to the planes application
>>>>>>> a8cece9 (docs: add comprehensive component composition architecture guide)
>>>>>>> 42bb1a3 (docs: add comprehensive component composition architecture guide)
---

### Instructions

Don't forget to:
- Read CLAUDE.md for development guidelines.
- Commit the changes following the commit guidelines. There is a git commit hook that will trigger a build step. If the build process fails while commiting, fix it and try to commit again. Never commit skipping the build step (never use --no-verify)
- Implement, commit then remove each task from this file as you implent them, leaving the instructions like this one untouched.
- Keep the CHANGELOG.md up to date with all the changes we are commiting.
- If you find some technical debt as you go along, add it to the docs/TECHNICAL_DEBT.md file