import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, Balloon, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { useNavigation } from '../navigation/NavigationContext';

type ThemeType = typeof THEME;

interface BottomTabBarProps {
  theme: ThemeType;
}

const TABS = [
  { name: 'ContactList' as const, label: 'Contacts', Icon: Users },
  { name: 'Birthdays' as const, label: 'Birthdays', Icon: Balloon },
  { name: 'Issues' as const, label: 'Issues', Icon: AlertTriangle },
];

export const BottomTabBar = ({ theme }: BottomTabBarProps) => {
  const { stack, resetTo } = useNavigation();
  const insets = useSafeAreaInsets();

  // Only show at root level (no detail screen pushed)
  if (stack.length > 1) return null;

  const activeTab = stack[0].name;

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom || 8 }]}>
      {TABS.map(({ name, label, Icon }) => {
        const active = activeTab === name;
        return (
          <TouchableOpacity
            key={name}
            style={styles.tab}
            onPress={() => { if (!active) resetTo({ name }); }}
          >
            <Icon
              size={22}
              color={active ? theme.primary : theme.textMuted}
            />
            <Text style={[styles.label, { color: active ? theme.primary : theme.textMuted }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
