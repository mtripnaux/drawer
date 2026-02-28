import React, { useMemo } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { useContacts } from '../contexts/ContactsContext';
import { useNavigation } from '../navigation/NavigationContext';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';
import { ProfileView } from '../components/ProfileView';
import { ContactWithDistance } from '../types';

interface ProfileScreenProps {
  contact: ContactWithDistance;
}

export const ProfileScreen = ({ contact }: ProfileScreenProps) => {
  const { config } = useConfig();
  const { contacts, groups, contactMap, formatName } = useContacts();
  const { pop, push } = useNavigation();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);

  return (
    <ProfileView
      contact={contact}
      onClose={pop}
      contactMap={contactMap}
      formatName={formatName}
      groups={groups}
      allContacts={contacts}
      onSelectContact={(c) => push({ name: 'Profile', params: { contact: c } })}
      config={config}
      theme={theme}
    />
  );
};
