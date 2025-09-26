const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/**
 * Centralized showcase configuration
 * To add a new app: Just add an entry here!
 */
const showcaseApps = [
  // Main experiences
  { name: 'animation', title: 'Lanzarote - Animation', filename: 'index.html' },
  { name: 'photobooth', title: 'Lanzarote - Photo Booth', filename: 'photobooth.html' },
  { name: 'famara', title: 'Lanzarote - Famara', filename: 'famara.html' },
  { name: 'game', title: 'Lanzarote - Game', filename: 'game.html' },
  { name: 'flyzones', title: 'Lanzarote - Fly Zones', filename: 'flyzones.html' },

  // Tools
  { name: 'workshop', title: 'Lanzarote - Workshop', filename: 'workshop.html' },
  { name: 'location-editor', title: 'Lanzarote - Location Editor', filename: 'location-editor.html' },

  // Demos
  { name: 'night', title: 'Lanzarote - Night', filename: 'night.html' },
  { name: 'paragliderVoxel', title: 'Lanzarote - Paraglider Voxel', filename: 'paragliderVoxel.html' },
  { name: 'terrain', title: 'Lanzarote - Terrain', filename: 'terrain.html' },
  { name: 'glider', title: 'Lanzarote - Glider', filename: 'glider.html' },
  { name: 'pilot', title: 'Lanzarote - Pilot', filename: 'pilot.html' },
];

// Export for use in other files
module.exports.showcaseApps = showcaseApps;

// Generate entry points dynamically - all use the same entry file
const entries = showcaseApps.reduce((acc, app) => {
  acc[app.name] = './src/showcase-entry.tsx';
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