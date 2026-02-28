import React, { useMemo } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { useNavigation } from '../navigation/NavigationContext';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';
import { SettingsView } from '../components/SettingsView';

export const SettingsScreen = () => {
  const { config, setConfig } = useConfig();
  const { pop } = useNavigation();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);

  return (
    <SettingsView
      config={config}
      onUpdate={setConfig}
      onClose={pop}
      theme={theme}
    />
  );
};
