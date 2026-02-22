import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { UserConfig } from '../constants/config';

interface SettingsViewProps {
  config: UserConfig;
  onUpdate: (c: UserConfig) => void;
  onClose: () => void;
}

export const SettingsView = ({ config, onUpdate, onClose }: SettingsViewProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
          <ChevronLeft size={20} color={THEME.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: 20 }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Name Display Pattern</Text>
        <Text style={styles.subtitle}>Available tokens: FIRST, LAST, MIDDLE, TITLE, POST, BIRTH_FIRST, BIRTH_MIDDLE, BIRTH_LAST</Text>
        <TextInput
          style={styles.input}
          value={config.nameDisplayPattern}
          onChangeText={(text) => onUpdate({...config, nameDisplayPattern: text})}
          placeholder="e.g. TITLE FIRST LAST"
          placeholderTextColor={THEME.textMuted}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visibility</Text>
        <TouchableOpacity 
          style={styles.optionRow}
          onPress={() => onUpdate({...config, showDeceasedPeople: !config.showDeceasedPeople})}
        >
          <Text style={styles.optionText}>Show Deceased People</Text>
          <View style={[styles.toggle, config.showDeceasedPeople && styles.toggleActive]}>
            <View style={[styles.toggleKnob, config.showDeceasedPeople && styles.toggleKnobActive]} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: -0.5,
  },
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
  subtitle: {
    fontSize: 14,
    color: THEME.textMuted,
    marginTop: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: THEME.text,
    backgroundColor: THEME.surface,
    marginTop: 8,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
      default: {},
    }) as any,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    color: THEME.text,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: THEME.primary,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
});
