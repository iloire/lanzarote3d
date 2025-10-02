const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

/**
 * Build configuration from apps.json
 *
 * Simple rules:
 * - All apps except "hidden" are built
 * - HTML filename comes from route (e.g., /boats-animation → boats-animation.html)
 * - Bundle name comes from app key (e.g., boatsanimation → boatsanimation.bundle.js)
 * - Entry point comes from app.entry or defaults to showcase-entry.tsx
 * - Apps are sorted by priority field
 */

const appsConfig = require('./src/config/apps.json');

// Build list of apps to compile
const showcaseApps = Object.entries(appsConfig.apps)
  .filter(([_, app]) => app.visibility !== 'hidden')
  .map(([appKey, app]) => ({
    name: appKey,
    title: `Lanzarote - ${app.name}`,
    filename: app.route.replace(/^\//, '') + '.html',
    // Use custom webpack entry if specified (e.g., tile-debug), otherwise use standard index.tsx
    entry: app.webpackEntry
      ? './src/' + app.webpackEntry.slice(2)  // Custom webpack entry
      : './src/index.tsx'  // Standard entry point for all showcase apps
  }))
  .sort((a, b) => {
    const priorityA = appsConfig.apps[a.name]?.priority || 999;
    const priorityB = appsConfig.apps[b.name]?.priority || 999;
    return priorityA - priorityB;
  });

console.log(`Building ${showcaseApps.length} applications...`);

// Export for use in other files
module.exports.showcaseApps = showcaseApps;

// Generate webpack entry points
const entries = showcaseApps.reduce((acc, app) => {
  acc[app.name] = app.entry;
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
    static: [
      {
        directory: path.join(__dirname, 'assets'),
        publicPath: '/assets',
      },
    ],
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
    // Copy assets folder to dist for production deployment
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'assets',
          to: 'assets',
        },
      ],
    }),
  ],
}; 