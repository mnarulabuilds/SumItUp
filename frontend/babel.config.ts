import type { ConfigFunction } from "@babel/core";

const config: ConfigFunction = (api) => {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};

export default config;
