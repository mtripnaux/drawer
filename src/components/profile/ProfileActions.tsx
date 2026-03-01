import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Phone, MessageSquare, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react-native';
import { THEME } from '../../constants/theme';

type ThemeType = typeof THEME;

interface ProfileActionsProps {
  hasPhone: boolean;
  onCall: () => void;
  onSMS: () => void;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  onSocial: (network: string, username: string) => void;
  theme: ThemeType;
}

const ActionButton = ({
  label,
  icon,
  active,
  onPress,
  theme,
}: {
  label: string;
  icon: (color: string) => React.ReactNode;
  active: boolean;
  onPress?: () => void;
  theme: ThemeType;
}) => (
  <TouchableOpacity
    style={[styles.actionButton, !active && styles.actionButtonDisabled]}
    onPress={active ? onPress : undefined}
    disabled={!active}
  >
    <View style={[styles.iconCircle, { backgroundColor: active ? theme.primary : theme.surface }]}>
      {icon(active ? theme.primaryForeground : theme.textMuted)}
    </View>
    <Text style={[styles.actionText, { color: theme.text }]}>{label}</Text>
  </TouchableOpacity>
);

export const ProfileActions = ({
  hasPhone,
  onCall,
  onSMS,
  instagram,
  twitter,
  facebook,
  linkedin,
  onSocial,
  theme,
}: ProfileActionsProps) => (
  <View style={[styles.actionButtons, { borderBottomColor: theme.border }]}>
    <ActionButton label="Call" icon={(c) => <Phone size={24} color={c} />} active={hasPhone} onPress={onCall} theme={theme} />
    <ActionButton label="Message" icon={(c) => <MessageSquare size={24} color={c} />} active={hasPhone} onPress={onSMS} theme={theme} />
    <ActionButton label="Instagram" icon={(c) => <Instagram size={24} color={c} />} active={!!instagram} onPress={instagram ? () => onSocial('instagram', instagram) : undefined} theme={theme} />
    <ActionButton label="Facebook" icon={(c) => <Facebook size={24} color={c} />} active={!!facebook} onPress={facebook ? () => onSocial('facebook', facebook) : undefined} theme={theme} />
    <ActionButton label="LinkedIn" icon={(c) => <Linkedin size={24} color={c} />} active={!!linkedin} onPress={linkedin ? () => onSocial('linkedin', linkedin) : undefined} theme={theme} />
    <ActionButton label="Twitter" icon={(c) => <Twitter size={24} color={c} />} active={!!twitter} onPress={twitter ? () => onSocial('twitter', twitter) : undefined} theme={theme} />
  </View>
);

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: THEME.text,
    fontWeight: '500',
  },
});
