import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { ContactWithDistance, Contact } from '../../types';
import { getInitials } from '../../utils/format';

type ThemeType = typeof THEME;

export type RelatedContact = ContactWithDistance & { relation: string };

interface ProfileRelatedContactsProps {
  relatedContacts: RelatedContact[];
  onSelectContact: (c: ContactWithDistance) => void;
  formatName: (id: Contact['identity']) => string;
  theme: ThemeType;
}

const getGenderColors = (gender: string | null | undefined, theme: ThemeType) => {
  if (gender === 'male' || gender === 'Male') return { bg: '#eff6ff', text: '#1d4ed8' };
  if (gender === 'female' || gender === 'Female') return { bg: '#fdf2f8', text: '#be185d' };
  return { bg: theme.surface, text: theme.textMuted };
};

export const ProfileRelatedContacts = ({
  relatedContacts,
  onSelectContact,
  formatName,
  theme,
}: ProfileRelatedContactsProps) => {
  if (relatedContacts.length === 0) return null;

  return (
    <View style={[styles.section, { borderBottomWidth: 0 }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Related Contacts</Text>
      <View style={styles.relatedList}>
        {relatedContacts.map((rc) => {
          const colors = getGenderColors(rc.identity.gender, theme);
          return (
            <TouchableOpacity
              key={rc.identifier}
              style={styles.relatedListItem}
              onPress={() => onSelectContact(rc)}
            >
              <View style={[styles.smallAvatar, { backgroundColor: colors.bg }]}>
                <Text style={[styles.smallAvatarText, { color: colors.text }]}>
                  {getInitials(rc.identity.first_name || '?', rc.identity.last_name || '?')}
                </Text>
              </View>
              <Text style={[styles.relatedName, { color: theme.text }]} numberOfLines={1}>
                {formatName(rc.identity)}{' '}
                <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '400' }}>({rc.relation})</Text>
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 16,
  },
  relatedList: {
    marginTop: 8,
    gap: 9,
  },
  relatedListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
  },
  smallAvatar: {
    width: 25,
    height: 25,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  smallAvatarText: {
    fontSize: 9,
    fontWeight: '600',
  },
  relatedName: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.text,
    marginLeft: 12,
  },
});
