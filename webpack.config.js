 module.exports = {
   entry: './source/sharedb-ace.js',
   output: {
     library: "sharedbAce",
     libraryTarget: "umd",
     filename: "distribution/sharedb-ace.js"
   },
   module: {
     loaders: [{
       test: /\.js$/,
       exclude: /node_modules/,
       loader: 'babel-loader'
     }]
   }
 }
