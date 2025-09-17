import { createRequire } from "module";

const require = createRequire(import.meta.url);

export const isReactNative = (): boolean => {
  try {
    require("react-native");
    return true;
  } catch {
    return false;
  }
};
