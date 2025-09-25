//webpack.config.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    main: "./src/showcase-entry.tsx",
    game: "./src/apps/experiences/game/index.tsx",
    flyzones: "./src/apps/experiences/flyzones/index.tsx"
  },
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
        options: {
          transpileOnly: true, // Skip type checking for faster builds
        },
      },
      {
        test: /\.styl?$/,
        loader: "stylus-loader", // compiles Styl to CSS
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
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./src/templates/showcase.html"),
      chunks: ['main'],
      filename: 'index.html',
      title: 'Lanzarote 3D'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./src/apps/experiences/game/index.html"),
      chunks: ['game'],
      filename: 'game.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./src/apps/experiences/flyzones/index.html"),
      chunks: ['flyzones'],
      filename: 'flyzones.html'
    }),
  ],
};
