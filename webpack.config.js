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

  // Helper to format filename from route - use route as source of truth
  // Routes like "/boats-animation" become "boats-animation.html"
  const getFilename = (appKey) => {
    const app = appsConfig.apps[appKey];
    const routeWithoutSlash = app.route.replace(/^\//, '');
    return `${routeWithoutSlash}.html`;
  };

  // Collect apps based on showcase criteria (now flat structure)
  Object.entries(appsConfig.apps).forEach(([appKey, app]) => {
    // Include if public visibility or specifically listed
    const includeInShowcase =
      (showcase.includeCriteria.byVisibility && showcase.includeCriteria.byVisibility.includes(app.visibility)) ||
      showcase.includeCriteria.specificApps.includes(appKey);

    if (includeInShowcase && app.visibility !== 'hidden') {
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
    open: {
      target: ['famara-animation.html'], // Open default app instead of file browser
    },
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
        // But not the showcase template which is used by HtmlWebpackPlugin
        test: /\.(html|md)$/,
        exclude: /src\/templates\/showcase\.html/,
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
        template: path.join(__dirname, 'src/templates/showcase.html'),
        chunks: [app.name],
        filename: app.filename,
        title: app.title,
        inject: 'body',
        minify: false
      })
    ),
    // Create index.html that redirects to the main animation
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src/templates/showcase.html'),
      chunks: ['animation'],
      filename: 'index.html',
      title: 'Lanzarote - Famara animation',
      inject: 'body',
      minify: false
    }),
  ],
}; 