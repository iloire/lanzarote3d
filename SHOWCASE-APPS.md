# Adding Showcase Apps

This document explains how to add new apps to the showcase build system.

## Quick Start

To add a new app, you only need to edit **one file**:

### 1. Add your app to `webpack.showcase.js`

```js
const showcaseApps = [
  // ... existing apps ...
  { name: 'myNewApp', title: 'Lanzarote - My New App', filename: 'my-new-app.html' },
];
```

That's it! The system will automatically:
- ✅ Create a new bundle for your app
- ✅ Generate an HTML file (`my-new-app.html`)
- ✅ Map the bundle name to the correct story
- ✅ Handle camelCase/kebab-case conversions

## App Configuration

Each app needs three properties:

```js
{
  name: 'myApp',              // Bundle name & story key (must match Stories object)
  title: 'Page Title',        // HTML page title
  filename: 'output.html'     // Output HTML filename
}
```

## How It Works

1. **Webpack builds** multiple bundles, one per app
2. **Each HTML file** loads a specific bundle (e.g., `myApp.bundle.js`)
3. **showcase-entry.tsx** detects which bundle is running from the script src
4. **Bundle mapping** automatically maps bundle names to story names
5. **App.tsx** loads the correct story/experience

## File Structure

```
webpack.showcase.js     ← Add new apps here
src/showcase-config.ts  ← Auto-generates bundle mapping
src/showcase-entry.tsx  ← Detects which app to load
src/apps/shared/index.ts ← Contains all Stories
```

## Troubleshooting

### My app shows the wrong content
- Check that the `name` in webpack.showcase.js matches the key in the `Stories` object
- Verify the story exists in `src/apps/shared/index.ts`

### Bundle name doesn't match story name
- Add a mapping in `showcase-config.ts` if needed:
  ```ts
  map['bundleName'] = 'storyName';
  ```

### App doesn't appear in build
- Make sure you added it to the `showcaseApps` array in `webpack.showcase.js`
- Run `yarn build-showcase` to rebuild