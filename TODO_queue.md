- I want to introduce Next.js so I can make easy deployments in vercel, introduce server side rendering, API supports, Next.js routing, etc.. Do that work in a new branch, test throughly the app after is done, make sure it builds properly and finally commit to that new branch.
- play with some ideas to use shaders on the water and sky
- fix mess with category: 'experience' | 'tool' | 'demo'; and status. we need better granularity to show menu. also menu doesnt fit in window 
- same thing we have a movingBehaviour or FloatingBehaviour, build a FlyingBehaviour that can be applied to a model and it can just fly around the scene. It must detect when terrain is close and slowly turn away from it. It shold also detect when has gone too far and return. To test the flyable behaviour, create an app that has a few walls and put the model with flyable behaviour in the middle. It should fly around and between the walls without going far away and without crash with the walls. Use the hangglider model for example to attach the flyable behaviour. We currently have the AutoFlier class but let's build the Flyable behavior and decide later what's best and remove the other option.



done
- we have some blender model for birds. Try creating some threejs based birds. Build a Crow class, an Eagle class and a Vulture class. All can inherit from a base class. Those birds should have an animation to move their wings. They should also implement the flyable behavior so they can fly around facing forward and avoid collisions with terrain. Don't forget to put them all in a new application showcase "animals"
