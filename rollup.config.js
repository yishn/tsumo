import swc from "@rollup/plugin-swc";
import alias from "@rollup/plugin-alias";
import svgr from "@svgr/rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "./src/frontend/main.ts",
  output: {
    dir: "./dist/frontend",
    format: "esm",
  },
  plugins: [
    nodeResolve({
      browser: true,
    }),
    alias({
      entries: [
        { find: "sinho", replacement: "sinho/min" },
        { find: "sinho/jsx-runtime", replacement: "sinho/min/jsx-runtime" },
      ],
    }),
    svgr({
      jsxRuntime: "automatic",
      babel: false,
      svgo: false,
      prettier: false,
      svgProps: { role: "img" },
    }),
    swc({
      swc: {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
          },
          target: "es2022",
          transform: {
            react: {
              runtime: "automatic",
              importSource: "sinho",
            },
          },
        },
      },
    }),
  ],
};
