const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

/**
 * Build configuration from apps.json
 *
 * Simple rules:
 * - All apps except "hidden" are built
 * - HTML filename comes from route (e.g., /boats-animation → boats-animation.html)
 * - Every page loads the same main bundle (./src/index.tsx), which picks the story from the URL
 *   and lazy-loads that app's chunk
 * - Apps are sorted by priority field
 * - One repo, two sites: SITE=relax builds the relax site into dist-relax/, anything else the
 *   Lanzarote site into dist/. Each builds only the apps whose "site" is its own (Lanzarote
 *   unless set), so neither ships the other's code or terrain.
 */

const appsConfig = require('./src/config/apps.json');

const SITE = process.env.SITE === 'relax' ? 'relax' : 'lanzarote';
const SITES = {
  lanzarote: {
    dist: 'dist',
    open: 'home.html',
    title: 'Lanzarote Paragliding',
    description:
      'Experience paragliding in Lanzarote with all your senses!. Tandem flights, pilot guides, real time wind conditions and more!',
    // Search engines only know the Lanzarote site
    extras: ['robots.txt', 'sitemap.xml'],
  },
  relax: {
    dist: 'dist-relax',
    open: 'index.html',
    title: 'Relax - paragliding in 3D',
    description: appsConfig.apps.relax.description,
    extras: [],
  },
};
const site = SITES[SITE];
const siteApps = Object.entries(appsConfig.apps).filter(
  ([_, app]) => (app.site || 'lanzarote') === SITE
);
// Lazy-loaded app folders this site may import: ./<folder> and anything under it
const appFolders = siteApps.map(([_, app]) => app.route.replace(/^\//, ''));
const appFolderPattern = new RegExp(`^\\./(${appFolders.join('|')})(/|$)`);

// Build list of apps to compile
const showcaseApps = siteApps
  .filter(([_, app]) => app.visibility !== 'hidden')
  .map(([appKey, app]) => ({
    name: appKey,
    title: `Lanzarote - ${app.name}`,
    description:
      app.description ||
      'Experience paragliding in Lanzarote!. Tandem flights, pilot guides, real time wind conditions and more!',
    filename: app.route.replace(/^\//, '') + '.html',
  }))
  .sort((a, b) => {
    const priorityA = appsConfig.apps[a.name]?.priority || 999;
    const priorityB = appsConfig.apps[b.name]?.priority || 999;
    return priorityA - priorityB;
  });

console.log(`Building the ${SITE} site: ${showcaseApps.length} applications...`);

module.exports = {
  entry: { main: './src/index.tsx' },
  output: {
    path: path.join(__dirname, site.dist),
    filename: '[name].bundle.js',
  },
  externals: {
    glStats: 'glStats',
    threeStats: 'threeStats',
  },
  devServer: {
    port: 8080,
    open: {
      target: [site.open], // Open default app instead of file browser
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
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|mp4)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[hash][ext]',
        },
      },
      {
        test: /\.(glb|gltf)$/,
        type: 'asset/resource',
      },
      {
        test: /\.obj$/,
        type: 'asset/resource',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        // Exclude HTML and MD files from being processed as modules
        // But not the showcase template which is used by HtmlWebpackPlugin
        test: /\.(html|md)$/,
        exclude: /src\/templates\/showcase\.html/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  plugins: [
    // Generate HTML plugins dynamically for each app
    ...showcaseApps.map(
      app =>
        new HtmlWebpackPlugin({
          template: path.join(__dirname, 'src/templates/showcase.html'),
          chunks: ['main'],
          filename: app.filename,
          title: app.title,
          description: app.description,
          inject: 'body',
          minify: false,
        })
    ),
    // Create index.html that loads the site's home app
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src/templates/showcase.html'),
      chunks: ['main'],
      filename: 'index.html',
      title: site.title,
      description: site.description,
      inject: 'body',
      minify: false,
    }),
    // The app loader imports ../applications/<folder>: bundle only this site's folders
    new webpack.ContextReplacementPlugin(/src[\\/]applications$/, appFolderPattern),
    new webpack.DefinePlugin({ 'process.env.SITE': JSON.stringify(SITE) }),
    // Copy assets folder to dist for production deployment
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'assets',
          to: 'assets',
          // Other places' terrain is imported by the relax app, so it ships only with that
          globOptions: { ignore: ['**/locations/**'] },
        },
        {
          from: 'assets/favicon.svg',
          to: 'favicon.svg',
        },
        ...site.extras.map(file => ({ from: `assets/${file}`, to: file })),
      ],
    }),
    // Load environment variables from .env file
    new Dotenv({
      systemvars: true, // Also load system env vars
    }),
  ],
};
