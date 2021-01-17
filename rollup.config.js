import rollupTypescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";
import builtins from "builtin-modules";
import json from "@rollup/plugin-json";
export default [
  {
    input: "./src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "cjs"
      },
      {
        file: "dist/index.es.js",
        format: "es"
      }
    ],
    plugins: [
      json(),
      rollupTypescript({
        tsconfig: "./tsconfig.json",
        useTsconfigDeclarationDir: true
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      }),
    ],
    external: [...builtins, "yauzl"]
  }
];
