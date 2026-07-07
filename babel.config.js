module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      // "nativewind/babel", <--- COMENTA ESTA LÍNEA CON DOBLE DIAGONAL
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};