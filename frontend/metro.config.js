const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prefer CJS entry points so metadata is required as `*.json` (Metro-safe).
config.resolver.unstable_enablePackageExports = false;

// libphonenumber-js ESM files import metadata as `*.json.js`.
// Metro treats `.json` as the extension, so those modules fail to resolve.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.json.js')) {
    return context.resolveRequest(context, moduleName.replace(/\.json\.js$/, '.json'), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
