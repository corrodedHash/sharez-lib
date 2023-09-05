import type { BuildConfig } from "unbuild";

const result: BuildConfig = {
  entries: [{ input: "./src/index" }],
  rollup: {
    emitCJS: true,
  },
  declaration: "compatible",
};
export default result;
