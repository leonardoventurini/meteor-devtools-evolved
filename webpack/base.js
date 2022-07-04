const path = require('path')
const { merge } = require('webpack-merge')
const { DefinePlugin } = require('webpack')
const { getTypeScriptAliases } = require('./utils')

const src = path.join(__dirname, '../src/')

const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const aliases = getTypeScriptAliases()

const manifestVersion = {
  chrome: 3,
  firefox: 2,
}

module.exports = (browser = 'chrome', override) => {
  const extDir = path.join(__dirname, `../extension`)
  const distPath = `${extDir}/${browser}/dist/`

  return merge(
    {
      entry: {
        bundle: path.resolve(src, 'App.tsx'),
        inject: path.resolve(src, 'Browser', 'Inject.ts'),
        background: path.resolve(src, 'Browser', 'Background.ts'),
        content: path.resolve(src, 'Browser', 'Content.ts'),
        devtools: path.resolve(src, 'Browser', 'DevTools.ts'),
      },

      output: {
        chunkFilename: '[name].js',
        path: distPath,
        publicPath: '/dist/',
      },

      plugins: [
        new CleanWebpackPlugin(),

        new DefinePlugin({
          'process.env.MODE': JSON.stringify(override.mode),
        }),
        new CopyPlugin({
          patterns: [
            {
              from: extDir,
              to: `${extDir}/${browser}`,
              globOptions: {
                dot: true,
                gitignore: true,
                ignore: [
                  '**/manifest-v2.json',
                  '**/manifest-v3.json',
                  '**/firefox',
                  '**/chrome',
                ],
              },
            },
            {
              from: `${extDir}/manifest-v${manifestVersion[browser]}.json`,
              to: `${extDir}/${browser}/manifest.json`,
            },
          ],
        }),
      ],

      module: {
        rules: [
          {
            parser: {
              amd: false,
            },
          },
          {
            test: /\.js/,
            use: 'babel-loader',
            include: src,
          },
          { test: /\.tsx?$/, use: 'ts-loader' },
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader', 'postcss-loader'],
          },
          {
            test: /\.scss$/,
            use: ['style-loader', 'css-loader', 'sass-loader'],
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
          {
            test: /\.(gif|png|jpg)$/,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]',
                  outputPath: 'assets/',
                },
              },
            ],
          },
        ],
      },

      resolve: {
        alias: aliases,

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
          '.gif',
          '.ts',
          '.tsx',
          '.woff',
          '.jpg',
          '.png',
        ],
      },

      performance: {
        hints: false,
      },
    },
    override,
  )
}
