import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Settings, ArrowUpDown, RefreshCw } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { useSpinAnimation } from '../hooks/useSpinAnimation';

type ThemeType = typeof THEME;

interface HomeHeaderProps {
  count: number;
  onSettings: () => void;
  onToggleSort: () => void;
  onRefetch: () => void;
  refetching?: boolean;
  theme: ThemeType;
}

export const HomeHeader = ({ count, onSettings, onToggleSort, onRefetch, refetching, theme }: HomeHeaderProps) => {
  const { rotate } = useSpinAnimation(!!refetching);

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.title, { color: theme.text }]}>Your Network</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{count} connections found</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onRefetch}
          disabled={refetching}
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <RefreshCw size={20} color={refetching ? theme.textMuted : theme.text} />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onToggleSort}
        >
          <ArrowUpDown size={20} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onSettings}
        >
          <Settings size={20} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
