import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { defaultUserConfig, UserConfig } from '../constants/config';

const CONFIG_STORAGE_KEY = '@user_config';

const storageGet = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  return AsyncStorage.getItem(key);
};

const storageSet = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, value); } catch {}
    return;
  }
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  AsyncStorage.setItem(key, value).catch(() => {});
};

interface ConfigContextType {
  config: UserConfig;
  setConfig: (c: UserConfig) => void;
  /** True once the persisted config has been read from AsyncStorage. */
  configLoaded: boolean;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfigState] = useState<UserConfig>(defaultUserConfig);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    storageGet(CONFIG_STORAGE_KEY)
      .then(stored => {
        if (stored) {
          const parsed = JSON.parse(stored);
          setConfigState({ ...defaultUserConfig, ...parsed });
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, []);

  const setConfig = useCallback((c: UserConfig) => {
    setConfigState(c);
    storageSet(CONFIG_STORAGE_KEY, JSON.stringify(c)).catch(() => {});
  }, []);

  return (
    <ConfigContext.Provider value={{ config, setConfig, configLoaded }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
};
