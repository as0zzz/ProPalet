module.exports = function babelConfig(api) {
  api.cache(true);

  const isProjectFile = (filename) =>
    Boolean(filename) && filename.startsWith(__dirname) && !filename.includes("node_modules");

  return {
    presets: ["babel-preset-expo"],
    overrides: [
      {
        test: isProjectFile,
        plugins: [
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          ["@babel/plugin-transform-typescript", { allowDeclareFields: true }],
          ["@babel/plugin-transform-class-properties", { loose: true }],
        ],
      },
    ],
  };
};
