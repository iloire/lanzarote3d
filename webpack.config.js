const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/**
 * Showcase configuration from JSON source of truth
 * Simple, reliable, no fallbacks needed
 *
 * The source of truth is: src/apps/config/apps.json
 */

const appsConfig = require('./src/apps/config/apps.json');

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

  // Collect apps based on showcase criteria
  Object.entries(appsConfig).forEach(([categoryKey, category]) => {
    if (categoryKey === 'showcase') return; // Skip the showcase config itself

    Object.entries(category).forEach(([appKey, app]) => {
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
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  plugins: [
    // Generate HTML plugins dynamically for each app
    ...showcaseApps.map(app =>
      new HtmlWebpackPlugin({
        template: path.join(__dirname, "./src/templates/showcase.html"),
        chunks: [app.name],
        filename: app.filename,
        title: app.title
      })
    ),
  ],
}; 