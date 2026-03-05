import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Phone, Mail, Calendar } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { UserConfig } from '../../constants/config';
import { ContactWithDistance } from '../../types';
import { getPhoneNumber, formatDate, computeAge } from '../../utils/format';

type ThemeType = typeof THEME;

interface ProfileContactInfoProps {
  contact: ContactWithDistance;
  config: UserConfig;
  theme: ThemeType;
}

export const ProfileContactInfo = ({ contact, config, theme }: ProfileContactInfoProps) => {
  const hasPhone = !!contact.phones?.length;
  const hasEmail = !!contact.emails?.length;

  if (!hasPhone && !hasEmail && !contact.identity.birth_date) return null;

  return (
    <View style={[styles.section, { borderBottomColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Informations</Text>

      {hasPhone && contact.phones?.map((phone, index) => (
        <TouchableOpacity
          key={`phone-${index}`}
          style={styles.infoRow}
          onPress={() => Linking.openURL(`tel:${getPhoneNumber(phone).replace(/\s/g, '')}`)}
        >
          <View style={styles.infoIconContainer}>
            <Phone size={20} color={theme.textMuted} />
          </View>
          <View>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
              Phone {phone.label && phone.label !== 'default' && (
                <Text style={{ color: theme.textMuted }}>({phone.label})</Text>
              )}
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{getPhoneNumber(phone)}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {hasEmail && contact.emails?.map((email, index) => (
        <View key={`email-${index}`} style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Mail size={20} color={theme.textMuted} />
          </View>
          <View>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
              Email {email.label && email.label !== 'default' && (
                <Text style={{ color: theme.textMuted }}>({email.label})</Text>
              )}
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{email.address}</Text>
          </View>
        </View>
      ))}

      {contact.identity.birth_date && (
        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Calendar size={20} color={theme.textMuted} />
          </View>
          <View>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Born</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {formatDate(contact.identity.birth_date, config)}
              {(() => {
                const result = computeAge(contact.identity.birth_date);
                if (!result) return null;
                const isDeceased = contact.identity.is_alive === false;
                const prefix = result.approximate ? 'about ' : '';
                if (!isDeceased && result.age < 2) {
                  const bd = contact.identity.birth_date!;
                  const today = new Date();
                  const birth = new Date(bd.year!, (bd.month ?? 1) - 1, bd.day ?? 1);
                  const months = (today.getFullYear() - birth.getFullYear()) * 12
                    + (today.getMonth() - birth.getMonth())
                    - (today.getDate() < birth.getDate() ? 1 : 0);
                  return <Text style={{ color: theme.textMuted }}>{' '}({prefix}{months} months old)</Text>;
                }
                const label = isDeceased ? 'at death' : 'years old';
                return <Text style={{ color: theme.textMuted }}>{' '}({prefix}{result.age} {label})</Text>;
              })()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: THEME.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: THEME.text,
  },
});
