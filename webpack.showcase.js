const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const stories = [
  { name: 'animation', title: 'Lanzarote - Animation', filename: 'index.html' },
  { name: 'photobooth', title: 'Lanzarote - Photo Booth', filename: 'photobooth.html' },
  { name: 'workshop', title: 'Lanzarote - Workshop', filename: 'workshop.html' },
  { name: 'clouds', title: 'Lanzarote - Clouds', filename: 'clouds.html' },
  { name: 'night', title: 'Lanzarote - Night', filename: 'night.html' },
  { name: 'paragliderVoxel', title: 'Lanzarote - Paraglider Voxel', filename: 'paragliderVoxel.html' }
];

// Generate entry points dynamically - all use the same entry file
const entries = stories.reduce((acc, story) => {
  acc[story.name] = './src/showcase-entry.tsx';
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
    // Generate HTML plugins dynamically for each story
    ...stories.map(story =>
      new HtmlWebpackPlugin({
        template: path.join(__dirname, "./src/templates/showcase.html"),
        chunks: [story.name],
        filename: story.filename,
        title: story.title
      })
    ),
  ],
}; 