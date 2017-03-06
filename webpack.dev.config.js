var webpack = require('webpack');

module.exports = {
  entry: './source/sharedb-ace.js',
  output: {
    library: "sharedbAce",
    libraryTarget: "umd",
    filename: "distribution/sharedb-ace.js"
  },
  plugins: [
    new webpack.DefinePlugin({
      ENVIRONMENT: JSON.stringify("development"),
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
