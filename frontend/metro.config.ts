import path from "path";
import { getDefaultConfig } from "expo/metro-config";

const config = getDefaultConfig(__dirname);

const resolver = config.resolver ?? {};
(resolver as { alias?: Record<string, string> }).alias = {
  "@": path.resolve(__dirname, "src"),
  "@components": path.resolve(__dirname, "src/components"),
  "@screens": path.resolve(__dirname, "src/screens"),
  "@utils": path.resolve(__dirname, "src/utils"),
  "@types": path.resolve(__dirname, "src/types"),
  "@services": path.resolve(__dirname, "src/services"),
  "@assets": path.resolve(__dirname, "assets"),
};

config.resolver = resolver;
config.resolver.sourceExts = [...(config.resolver.sourceExts ?? []), "ts", "tsx"];

export default config;
