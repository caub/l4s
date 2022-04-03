const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');


module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './theme.scss',
  output: {
    path: __dirname + '/assets',
    publicPath: '/',
    assetModuleFilename: '[contenthash][ext]'
  },
  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ]
      },
      {
        test: /\.(jpe?g|png)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(svg|woff2?|eot|ttf)$/,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]'
        }
      },
      {
        test: /\.svg$/,
        exclude: /\/fontawesome-pro\/webfonts\//,
        type: 'asset/inline',
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    }),
  ],
  optimization: {
    minimizer: [
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],
  },
  target: 'web',
};
