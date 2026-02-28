import React, { createContext, useContext, useState } from 'react';
import { defaultUserConfig, UserConfig } from '../constants/config';

interface ConfigContextType {
  config: UserConfig;
  setConfig: (c: UserConfig) => void;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<UserConfig>(defaultUserConfig);

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
};
