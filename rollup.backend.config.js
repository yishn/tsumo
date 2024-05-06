import swc from "@rollup/plugin-swc";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "./src/backend/main.ts",
  output: {
    dir: "./dist/backend",
    format: "esm",
  },
  onwarn(warning, warn) {
    if (warning.code === "UNRESOLVED_IMPORT") return;
    warn(warning);
  },
  plugins: [
    swc({
      swc: {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
          },
          target: "es2022",
        },
      },
    }),
  ],
};
