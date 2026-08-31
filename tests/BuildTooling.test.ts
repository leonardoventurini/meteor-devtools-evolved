import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

type PackageJson = {
  scripts: Record<string, string>
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

const projectRoot = path.resolve(import.meta.dirname, '..')
const packageJson = JSON.parse(
  readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
) as PackageJson

const webpackPackages = [
  '@babel/core',
  '@babel/preset-env',
  '@babel/preset-react',
  'babel-loader',
  'clean-webpack-plugin',
  'copy-webpack-plugin',
  'css-loader',
  'postcss-loader',
  'sass-loader',
  'style-loader',
  'terser-webpack-plugin',
  'ts-loader',
  'webpack',
  'webpack-cli',
  'webpack-merge',
]

describe('extension build tooling', () => {
  it('uses WXT for browser development and production builds', () => {
    expect(packageJson.scripts['build:chrome']).toBe('wxt build -b chrome')
    expect(packageJson.scripts['build:firefox']).toBe(
      'wxt build -b firefox --mv2',
    )
    expect(packageJson.scripts['dev:chrome']).toContain('wxt -b chrome')
    expect(packageJson.scripts['dev:firefox']).toContain('wxt -b firefox --mv2')
  })

  it('contains WXT entrypoints and no Webpack configuration', () => {
    expect(existsSync(path.join(projectRoot, 'wxt.config.ts'))).toBe(true)
    expect(
      existsSync(path.join(projectRoot, 'src/entrypoints/background.ts')),
    ).toBe(true)
    expect(
      existsSync(path.join(projectRoot, 'src/entrypoints/content.ts')),
    ).toBe(true)
    expect(
      existsSync(path.join(projectRoot, 'src/entrypoints/inject.ts')),
    ).toBe(true)
    expect(
      existsSync(path.join(projectRoot, 'src/entrypoints/devtools/index.html')),
    ).toBe(true)
    expect(existsSync(path.join(projectRoot, 'webpack'))).toBe(false)
  })

  it('does not retain Webpack-only dependencies', () => {
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    for (const packageName of webpackPackages) {
      expect(allDependencies).not.toHaveProperty(packageName)
    }
  })
})
