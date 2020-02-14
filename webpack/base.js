const path = require('path');
const { extend } = require('lodash');

const src = path.join(__dirname, '../src/');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = override =>
  extend(
    {
      entry: {
        bundle: path.resolve(src, 'App.tsx'),
        inject: path.resolve(src, 'Injector.ts'),
        background: path.resolve(src, 'Browser', 'Background.ts'),
        content: path.resolve(src, 'Browser', 'Content.ts'),
        devtools: path.resolve(src, 'Browser', 'DevTools.ts'),
      },
      plugins: [new CleanWebpackPlugin()],
      module: {
        rules: [
          {
            test: /\.js/,
            loader: 'babel-loader',
            include: src,
          },
          { test: /\.tsx?$/, loader: 'ts-loader' },
          {
            test: /\.css$/,
            loader: 'style-loader!css-loader!postcss-loader',
          },
          {
            test: /\.scss$/,
            loaders: ['style-loader', 'css-loader', 'sass-loader'],
          },
          {
            test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]',
                  outputPath: 'fonts/',
                },
              },
            ],
          },
        ],
      },
      resolve: {
        alias: {},
        extensions: [
          '.css',
          '.eot',
          '.js',
          '.json',
          '.jsx',
          '.mjs',
          '.sass',
          '.scss',
          '.ttf',
          '.ts',
          '.tsx',
          '.woff',
        ],
      },
    },
    override,
  );
