import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Phone } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { ContactWithDistance } from '../types';
import { getInitials } from '../utils/format';
import { Contact } from '../types';

type ThemeType = typeof THEME;

interface ContactItemProps {
  item: ContactWithDistance;
  onSelect: (contact: ContactWithDistance) => void;
  formatName: (identity: Contact['identity']) => string;
  theme: ThemeType;
}

export const ContactItem = ({ item, onSelect, formatName, theme }: ContactItemProps) => {
  const hasPhone = item.phones && item.phones.length > 0;
  const relationChain = item.relations || [];
  let relationText = '';

  if (item.distance === Infinity) {
    relationText = 'Unreachable';
  } else if (item.distance === 0) {
    relationText = 'Me';
  } else {
    if (relationChain.length <= 2) {
      relationText = relationChain.join(' › ');
    } else {
       relationText = `${relationChain.slice(0, 2).join(' › ')} › ...`;
    }
  }

  const handleCall = () => {
    if (!item.phones || item.phones.length === 0) return;
    const phone = item.phones[0];
    const phoneNumber = typeof phone === 'string' ? phone : phone.number;
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity style={[styles.card, { backgroundColor: theme.background }]} onPress={() => onSelect(item)}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: item.identity.gender === 'male' ? '#eff6ff' : '#fdf2f8' }]}>
            <Text style={[styles.avatarText, { color: item.identity.gender === 'male' ? '#1d4ed8' : '#be185d' }]}>
              {getInitials(item.identity.first_name!, item.identity.last_name!)}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={[styles.name, { color: theme.text }]}>{formatName(item.identity)}</Text>
          <Text style={[styles.relation, { color: theme.textMuted }]}>
            {relationText}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={[styles.separator, { backgroundColor: theme.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
  },
  separator: {
    height: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 0,
    paddingRight: 16,
    backgroundColor: THEME.background,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 2,
  },
  relation: {
    fontSize: 13,
    color: THEME.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
