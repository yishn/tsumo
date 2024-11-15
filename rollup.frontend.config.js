import swc from "@rollup/plugin-swc";
import alias from "@rollup/plugin-alias";
import svgr from "@svgr/rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import env from "rollup-plugin-process-env";

const isDev = process.env.NODE_ENV === "dev";

export default {
  input: "./src/frontend/main.ts",
  output: {
    dir: "./dist/frontend",
    format: "esm",
    sourcemap: isDev ? "inline" : true,
  },
  plugins: [
    nodeResolve({
      browser: true,
    }),
    !isDev &&
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
            decoratorVersion: "2022-03",
            react: {
              runtime: "automatic",
              importSource: "sinho",
              throwIfNamespace: false,
            },
          },
        },
      },
    }),
    env({
      NODE_ENV: process.env.NODE_ENV,
      MJ_SERVER: isDev ? "ws://localhost:8080" : process.env.MJ_SERVER,
    }),
    !isDev && terser(),
  ],
};
