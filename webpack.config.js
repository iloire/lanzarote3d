const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/**
 * Showcase configuration from JSON source of truth
 * Simple, reliable, no fallbacks needed
 *
 * The source of truth is: src/config/apps.json
 */

const appsConfig = require('./src/config/apps.json');

// Generate showcase apps from JSON
function generateShowcaseApps() {
  const showcaseApps = [];
  const { showcase } = appsConfig;

  // Helper to format filename
  const getFilename = (key) => {
    if (showcase.filenameOverrides[key]) {
      return showcase.filenameOverrides[key];
    }
    return `${key.replace(/-/g, '')}.html`;
  };

  // Collect apps based on showcase criteria (now flat structure)
  Object.entries(appsConfig.apps).forEach(([appKey, app]) => {
    // Include if public status or specifically listed
    const includeInShowcase =
      showcase.includeCriteria.byStatus.includes(app.status) ||
      showcase.includeCriteria.specificApps.includes(appKey);

    if (includeInShowcase && !app.hidden) {
      showcaseApps.push({
        name: appKey,
        title: `Lanzarote - ${app.name}`,
        filename: getFilename(appKey)
      });
    }
  });

  // Sort by defined order
  showcaseApps.sort((a, b) => {
    const orderA = showcase.order[a.name] || 999;
    const orderB = showcase.order[b.name] || 999;
    return orderA - orderB;
  });

  return showcaseApps;
}

const showcaseApps = generateShowcaseApps();

console.log(`Building ${showcaseApps.length} showcase applications...`);

// Export for use in other files
module.exports.showcaseApps = showcaseApps;

// Generate entry points dynamically from JSON configuration
const entries = showcaseApps.reduce((acc, app) => {
  acc[app.name] = appsConfig.showcase.customEntries[app.name] || appsConfig.showcase.defaultEntry;
  return acc;
}, {});

module.exports = {
  entry: entries,
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "[name].bundle.js",
  },
  externals: {
    glStats: "glStats",
    threeStats: "threeStats",
  },
  devServer: {
    port: 8080,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.styl?$/,
        loader: "stylus-loader",
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/react"],
              plugins: ["@babel/proposal-class-properties"],
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|mp4)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: "./images/",
            },
          },
        ],
      },
      {
        test: /\.(glb|gltf)$/,
        type: "asset/resource",
      },
      {
        test: /\.obj$/,
        type: "asset/resource",
      },
      {
        test: /\.(drc)$/,
        type: "asset/resource",
      },
      {
        test: /\.(mp3|wav)$/,
        type: "asset/resource",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        // Exclude HTML and MD files from being processed as modules
        test: /\.(html|md)$/,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  plugins: [
    // Generate HTML plugins dynamically for each app
    ...showcaseApps.map(app =>
      new HtmlWebpackPlugin({
        templateContent: `<!DOCTYPE html>
<html>
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-NDD28QQE9L"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-NDD28QQE9L');
  </script>

  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title><%= htmlWebpackPlugin.options.title %></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
</head>

<body style="background-color:black">
  <div id="root"></div>
  <div id="ui-controls"></div>
  <div id="legend-points"></div>
  <div id="stats"></div>
  <div id="daytime"></div>
</body>
</html>`,
        chunks: [app.name],
        filename: app.filename,
        title: app.title,
        inject: 'body',
        minify: false
      })
    ),
  ],
}; 