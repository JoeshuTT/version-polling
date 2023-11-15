import typescript from "@rollup/plugin-typescript";
import { babel } from "@rollup/plugin-babel";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import { readFileSync } from "node:fs";
const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url))
);

const banner = `/*!
  * version-polling v${pkg.version}
  * (c) 2023 JoeshuTT
  * @license MIT
  */`;

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.module,
      format: "esm",
      banner,
      name: "VersionPolling",
    },
    {
      file: pkg.main,
      format: "cjs",
      banner,
      name: "VersionPolling",
    },
    {
      file: pkg.browser,
      format: "umd",
      banner,
      name: "VersionPolling",
    },
    {
      file: pkg.unpkg,
      format: "umd",
      banner,
      name: "VersionPolling",
      plugins: [terser()],
    },
  ],
  plugins: [
    typescript(),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      extensions: [...DEFAULT_EXTENSIONS, ".ts"],
    }),
    json(),
  ],
};
