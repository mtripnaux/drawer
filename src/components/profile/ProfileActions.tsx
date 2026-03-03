import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Phone, MessageSquare, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { UserConfig, ProfileActionId } from '../../constants/config';

type ThemeType = typeof THEME;

const ACTION_ICONS: Record<ProfileActionId, React.ComponentType<{ size: number; color: string }>> = {
  phone: Phone,
  message: MessageSquare,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
};

const ACTION_LABELS: Record<ProfileActionId, string> = {
  phone: 'Call',
  message: 'Message',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
};

interface ProfileActionsProps {
  hasPhone: boolean;
  onCall: () => void;
  onSMS: () => void;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  onSocial: (network: string, username: string) => void;
  profileActions: UserConfig['profileActions'];
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
  profileActions,
  theme,
}: ProfileActionsProps) => {
  const socials: Partial<Record<ProfileActionId, string>> = { instagram, facebook, linkedin, twitter };

  const isAvailable = (id: ProfileActionId) => {
    if (id === 'phone' || id === 'message') return hasPhone;
    return !!socials[id];
  };

  const getOnPress = (id: ProfileActionId) => {
    if (id === 'phone') return onCall;
    if (id === 'message') return onSMS;
    const username = socials[id];
    return username ? () => onSocial(id, username) : undefined;
  };

  const visibleActions = profileActions
    .filter(n => n.enabled && isAvailable(n.id))
    .slice(0, 4);

  if (visibleActions.length === 0) return null;

  return (
    <View style={[styles.actionButtons, { borderBottomColor: theme.border }]}>
      {visibleActions.map(n => {
        const Icon = ACTION_ICONS[n.id];
        return (
          <ActionButton
            key={n.id}
            label={ACTION_LABELS[n.id]}
            icon={(c) => <Icon size={24} color={c} />}
            active={true}
            onPress={getOnPress(n.id)}
            theme={theme}
          />
        );
      })}
    </View>
  );
};

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
