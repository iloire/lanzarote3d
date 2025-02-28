//webpack.config.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    main: "./src/apps/main/index.tsx",
    animation1: "./src/apps/animation1/index.tsx",
    game: "./src/apps/game/index.tsx",
    flyzones: "./src/apps/flyzones/index.tsx",
    animation2: "./src/apps/animation2/index.tsx"
  },
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "[name].bundle.js",
  },
  externals: {
    rStats: "rStats",
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
      template: path.join(__dirname, "./src/apps/main/index.html"),
      chunks: ['main'],
      filename: 'index.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./src/apps/animation1/index.html"),
      chunks: ['animation1'],
      filename: 'animation1.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./src/apps/game/index.html"),
      chunks: ['game'],
      filename: 'game.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./src/apps/flyzones/index.html"),
      chunks: ['flyzones'],
      filename: 'flyzones.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./src/apps/animation2/index.html"),
      chunks: ['animation2'],
      filename: 'animation2.html'
    }),
  ],
};
