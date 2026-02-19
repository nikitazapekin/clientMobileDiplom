import DefaultPreference from 'react-native-default-preference';

let initializedStorage: { [key: string]: string } = {};

export const initializeStorage = async (): Promise<void> => {
  try {
    const allValues = await DefaultPreference.getAll();

    initializedStorage = allValues as { [key: string]: string };
    console.log('Storage initialized with keys:', Object.keys(initializedStorage));
  } catch (error) {
    console.log('Storage initialization error:', error);
    initializedStorage = {};
  }
};

export const getInitializedItem = (key: string): string | null => {
  return initializedStorage[key] || null;
};

export const SyncStorage = {
  setItem: (key: string, value: string): void => {

    initializedStorage[key] = value;

    DefaultPreference.set(key, value).catch((error) => {
      console.log('SyncStorage setItem error:', error);
    });
  },

  getItem: (key: string): string | null => {
    return initializedStorage[key] || null;
  },

  removeItem: (key: string): void => {

    delete initializedStorage[key];

    DefaultPreference.clear(key).catch((error) => {
      console.log(' SyncStorage removeItem error:', error);
    });
  },

  clear: (): void => {

    initializedStorage = {};

    DefaultPreference.clearAll().catch((error) => {
      console.log('SyncStorage clear error:', error);
    });
  },

  getAllKeys: (): string[] => {
    return Object.keys(initializedStorage);
  },

  getMultiple: (keys: string[]): { [key: string]: string | null } => {
    const result: { [key: string]: string | null } = {};

    keys.forEach(key => {
      result[key] = initializedStorage[key] || null;
    });

    return result;
  },

  setMultiple: (keyValuePairs: [string, string][]): void => {
    keyValuePairs.forEach(([key, value]) => {
      initializedStorage[key] = value;
      DefaultPreference.set(key, value).catch((error) => {
        console.log('❌ SyncStorage setMultiple error for key:', key, error);
      });
    });
  }
};

export default SyncStorage;
