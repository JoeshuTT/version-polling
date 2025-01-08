import { defineConfig } from '@rslib/core';
import pkg from './package.json';

const bannerContent = `/*!
  * ${pkg.name} v${pkg.version}
  * (c) 2023-present Joe Shu
  * @license MIT
  */`;

/**
 * 设置产物兼容性
 * 即使项目下有`.browserslistrc` 文件，也不会生效，可能是因为 `lib.syntax` 的默认值为 esnext 的缘故。使用 overrideBrowserslist 来解决。
 * ```js
 * const syntax = 'es2020'; // lib.syntax
 * https://github.com/web-infra-dev/rslib/blob/8d65f3728d60254bcf1a8e24d72902ad79dae959/packages/core/src/utils/syntax.ts#L42-L153
 */

export default defineConfig({
  lib: [
    {
      format: 'esm',
      banner: {
        js: bannerContent,
      },
      dts: true,
    },
    {
      format: 'cjs',
      banner: {
        js: bannerContent,
      },
    },
    {
      format: 'umd',

      banner: {
        js: bannerContent,
      },
      umdName: 'VersionPolling',
      autoExtension: false,
      output: {
        minify: true,
        filename: {
          js: `${pkg.name}.min.js`,
        },
      },
    },
    {
      format: 'umd',
      banner: {
        js: bannerContent,
      },
      umdName: 'VersionPolling',
      autoExtension: false,
      output: {
        filename: {
          js: `${pkg.name}.js`,
        },
      },
    },
  ],
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  output: {
    target: 'web',
    distPath: {
      root: './dist',
    },
    overrideBrowserslist: [
      'chrome >= 87',
      'edge >= 88',
      'firefox >= 78',
      'safari >= 14',
    ],
  },
});
