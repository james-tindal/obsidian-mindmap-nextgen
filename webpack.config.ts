import CopyPlugin from 'copy-webpack-plugin'
import { resolve } from 'path'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import { type Configuration } from 'webpack'
import webpack from 'webpack'
import ForkTsCheckerPlugin from 'fork-ts-checker-webpack-plugin'

export default (env, argv): Configuration => ({
  mode: getMode(argv.mode),
  entry: './src/core/entry.ts',
  output: {
    path: resolve(import.meta.dirname, argv.mode === 'production' ? '.' : testPluginRoute),
    filename: 'main.js',
    libraryTarget: 'commonjs',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [new TsconfigPathsPlugin]
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.ts$/,
        loader: 'esbuild-loader'
      }
    ],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
    new CopyPlugin({
      patterns: [
        { from: 'styles.css', to: '.' },
        { from: 'manifest.json', to: '.' },
      ]
    }),
    new ForkTsCheckerPlugin
  ],
  externals: {
    electron: 'commonjs electron',
    obsidian: 'commonjs obsidian',
  },
  devtool: argv.mode === 'production' && 'eval-source-map',
  optimization: { splitChunks: false }
})

function getMode(mode) {
  if (['development', 'production'].includes(mode))
    return mode as 'development' | 'production'
  else
    throw 'Expected --mode development or production'
}

const testPluginRoute = 'test-vault/.obsidian/plugins/obsidian-mindmap-nextgen'
