import swc from "@rollup/plugin-swc";

const isDev = process.env.NODE_ENV === "dev";

export default {
  input: "./src/backend/main.ts",
  output: {
    dir: "./dist/backend",
    format: "esm",
    sourcemap: isDev ? "inline" : true,
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
          },
          target: "es2022",
          transform: {
            decoratorVersion: "2022-03",
          },
        },
      },
    }),
  ],
};
