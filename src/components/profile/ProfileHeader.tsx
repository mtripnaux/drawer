import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { ContactWithDistance, Contact } from '../../types';
import { getInitials } from '../../utils/format';

type ThemeType = typeof THEME;

interface ProfileHeaderProps {
  contact: ContactWithDistance;
  formatName: (id: Contact['identity']) => string;
  theme: ThemeType;
}

const getGenderColors = (gender: string | null | undefined, theme: ThemeType) => {
  if (gender === 'male' || gender === 'Male') return { bg: '#eff6ff', text: '#1d4ed8' };
  if (gender === 'female' || gender === 'Female') return { bg: '#fdf2f8', text: '#be185d' };
  return { bg: theme.surface, text: theme.textMuted };
};

export const ProfileHeader = ({ contact, formatName, theme }: ProfileHeaderProps) => {
  const colors = getGenderColors(contact.identity.gender, theme);

  return (
    <View style={[styles.profileHeader, { borderBottomColor: theme.border }]}>
      <View style={[styles.largeAvatar, { backgroundColor: colors.bg }]}>
        <Text style={[styles.largeAvatarText, { color: colors.text }]}>
          {getInitials(contact.identity.first_name || '?', contact.identity.last_name || '?')}
        </Text>
      </View>
      <Text style={[styles.profileName, { color: theme.text }]}>{formatName(contact.identity)}</Text>
      <Text style={[styles.relation, { color: theme.textMuted }]}>
        {contact.distance === Infinity
          ? 'Unreachable'
          : `${Math.round(contact.distance * 10) / 10} degrees away`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  largeAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  largeAvatarText: {
    fontSize: 32,
    fontWeight: '600',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  relation: {
    fontSize: 13,
    color: THEME.textMuted,
  },
});
