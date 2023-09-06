import typescript from "@rollup/plugin-typescript"

/**@type {import('rollup').RollupOptions} */
const options = {
  input: "src/index.ts",
  output: [
    {
      file: "dist/bundle.cjs",
      format: "cjs",
    },
    {
      file: "dist/bundle.mjs",
      format: "esm",
    },
  ],
  plugins: [
    typescript({
      exclude: ["**/*.test.ts"],
    }),
  ],
}

export default options
