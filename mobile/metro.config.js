const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Permite que o Metro acesse arquivos fora do diretório mobile/
// necessário para carregar a Bíblia de biblias/ave maria/
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(__dirname, ".."),
];

module.exports = config;
