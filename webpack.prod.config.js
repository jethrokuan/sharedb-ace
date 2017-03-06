var webpack = require('webpack');

module.exports = {
  entry: './source/sharedb-ace.js',
  output: {
    library: "sharedbAce",
    libraryTarget: "umd",
    filename: "distribution/sharedb-ace.min.js"
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      } 
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  }
 }
