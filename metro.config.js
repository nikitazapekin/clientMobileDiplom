import { getDefaultConfig } from 'expo/metro-config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('engine.io-client') || moduleName.startsWith('socket.io-client')) {
    const result = context.resolveRequest(context, moduleName, platform);
    return result;
  }
  return context.resolveRequest(context, moduleName, platform);
};

export default config;
