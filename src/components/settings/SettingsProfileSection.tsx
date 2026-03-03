import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Phone, MessageSquare, Instagram, Facebook, Linkedin, Twitter, ChevronUp, ChevronDown, Check } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { UserConfig, ProfileActionId } from '../../constants/config';

type ThemeType = typeof THEME;

interface SettingsProfileSectionProps {
  config: UserConfig;
  onUpdate: (c: UserConfig) => void;
  theme: ThemeType;
}

const ACTION_META: Record<ProfileActionId, { label: string; Icon: React.ComponentType<{ size: number; color: string }> }> = {
  phone: { label: 'Call', Icon: Phone },
  message: { label: 'Message', Icon: MessageSquare },
  instagram: { label: 'Instagram', Icon: Instagram },
  facebook: { label: 'Facebook', Icon: Facebook },
  linkedin: { label: 'LinkedIn', Icon: Linkedin },
  twitter: { label: 'Twitter', Icon: Twitter },
};

export const SettingsProfileSection = ({ config, onUpdate, theme }: SettingsProfileSectionProps) => {
  const actions = config.profileActions;

  const move = (index: number, direction: -1 | 1) => {
    const newList = [...actions];
    const target = index + direction;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    onUpdate({ ...config, profileActions: newList });
  };

  const toggle = (index: number) => {
    const newList = actions.map((n, i) =>
      i === index ? { ...n, enabled: !n.enabled } : n
    );
    onUpdate({ ...config, profileActions: newList });
  };

  return (
    <View style={[styles.section, { borderBottomColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile Actions</Text>
      <Text style={[styles.hint, { color: theme.textMuted }]}>
        Reorder and select — up to 4 enabled are shown on profile
      </Text>

      {actions.map((action, index) => {
        const meta = ACTION_META[action.id];
        if (!meta) return null;
        const { label, Icon } = meta;
        return (
          <View
            key={action.id}
            style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <TouchableOpacity
              onPress={() => toggle(index)}
              style={[
                styles.checkbox,
                {
                  backgroundColor: action.enabled ? theme.primary : 'transparent',
                  borderColor: action.enabled ? theme.primary : theme.border,
                },
              ]}
            >
              {action.enabled && <Check size={14} color={theme.primaryForeground} />}
            </TouchableOpacity>

            <View style={[styles.iconWrap, { backgroundColor: action.enabled ? theme.primary + '18' : theme.border + '40' }]}>
              <Icon size={18} color={action.enabled ? theme.primary : theme.textMuted} />
            </View>

            <View style={styles.labelWrap}>
              <Text style={[styles.label, { color: action.enabled ? theme.text : theme.textMuted }]}>
                {label}
              </Text>
            </View>

            <View style={styles.arrows}>
              <TouchableOpacity
                onPress={() => move(index, -1)}
                disabled={index === 0}
                style={[styles.arrowBtn, { opacity: index === 0 ? 0.3 : 1 }]}
              >
                <ChevronUp size={18} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => move(index, 1)}
                disabled={index === actions.length - 1}
                style={[styles.arrowBtn, { opacity: index === actions.length - 1 ? 0.3 : 1 }]}
              >
                <ChevronDown size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
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
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    color: THEME.textMuted,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  arrows: {
    flexDirection: 'row',
    gap: 4,
  },
  arrowBtn: {
    padding: 4,
  },
});
