import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, Pressable, Animated, Easing } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { UserConfig } from '../constants/config';

type ThemeType = typeof THEME;


interface SettingsViewProps {
  config: UserConfig;
  onUpdate: (c: UserConfig) => void;
  onClose: () => void;
  theme: ThemeType;
}

const OptionRow = ({ onPress, label, textColor, children }: { onPress: () => void; label: string; textColor: string; children: React.ReactNode }) => {
  const opacity = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacity, { toValue: 0.5, duration: 80, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacity, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  };

  return (
    <Pressable style={styles.optionRow} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.Text style={[styles.optionText, { color: textColor, opacity }]}>{label}</Animated.Text>
      {children}
    </Pressable>
  );
};

export const SettingsView = ({ config, onUpdate, onClose, theme }: SettingsViewProps) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: 20, color: theme.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>
      
      <View style={[styles.section, { borderBottomColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>General</Text>
        
        <Text style={[styles.subtitle, {marginTop: 0, color: theme.textMuted }]}>Name Display Pattern</Text>
        <TextInput
          style={[styles.input, { marginBottom: 20, borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
          value={config.nameDisplayPattern}
          onChangeText={(text) => onUpdate({...config, nameDisplayPattern: text})}
          placeholder="e.g. TITLE FIRST LAST"
          placeholderTextColor={theme.textMuted}
        />

        <Text style={[styles.subtitle, {marginTop: 0, color: theme.textMuted }]}>Date Format Pattern</Text>
        <TextInput
          style={[styles.input, { marginBottom: 20, borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
          value={config.dateFormat}
          onChangeText={(text) => onUpdate({...config, dateFormat: text})}
          placeholder="e.g. MONTH DD, YYYY"
          placeholderTextColor={theme.textMuted}
        />

        <Text style={[styles.subtitle, {marginTop: 0, color: theme.textMuted }]}>Sort By</Text>
        <View style={[styles.row, { marginTop: 10, gap: 10 }]}>
            {['PROXIMITY', 'ALPHABETICAL'].map((option) => (
                <TouchableOpacity
                    key={option}
                    style={[
                        styles.chip, 
                        config.sortBy === option 
                            ? { backgroundColor: theme.primary, borderColor: theme.primary } 
                            : { backgroundColor: theme.surface, borderColor: theme.border }
                    ]}
                    onPress={() => onUpdate({...config, sortBy: option})}
                >
                    <Text style={[
                        styles.chipText, 
                        config.sortBy === option ? { color: theme.primaryForeground } : { color: theme.text }
                    ]}>
                        {option === 'PROXIMITY' ? 'Proximity' : 'Alphabetical'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>
      

      <View style={[styles.section, { borderBottomColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance & Visibility</Text>
        
        <OptionRow
          onPress={() => onUpdate({...config, darkTheme: !config.darkTheme})}
          label="Dark Theme (experimental)"
          textColor={theme.text}
        >
          <View style={[styles.toggle, config.darkTheme ? { backgroundColor: theme.primary } : { backgroundColor: theme.border }]}>
            <View style={[
                styles.toggleKnob,
                config.darkTheme ? { backgroundColor: theme.primaryForeground } : {},
                config.darkTheme && styles.toggleKnobActive
            ]} />
          </View>
        </OptionRow>

        <OptionRow
          onPress={() => onUpdate({...config, showDeceasedPeople: !config.showDeceasedPeople})}
          label="Show Deceased People"
          textColor={theme.text}
        >
          <View style={[styles.toggle, config.showDeceasedPeople ? { backgroundColor: theme.primary } : { backgroundColor: theme.border }]}>
            <View style={[
                styles.toggleKnob,
                config.showDeceasedPeople ? { backgroundColor: theme.primaryForeground } : {},
                config.showDeceasedPeople && styles.toggleKnobActive
            ]} />
          </View>
        </OptionRow>

        <OptionRow
          onPress={() => onUpdate({...config, hideContactsWithoutPhone: !config.hideContactsWithoutPhone})}
          label="Hide Contacts Without Phone"
          textColor={theme.text}
        >
          <View style={[styles.toggle, config.hideContactsWithoutPhone ? { backgroundColor: theme.primary } : { backgroundColor: theme.border }]}>
            <View style={[
                styles.toggleKnob,
                config.hideContactsWithoutPhone ? { backgroundColor: theme.primaryForeground } : {},
                config.hideContactsWithoutPhone && styles.toggleKnobActive
            ]} />
          </View>
        </OptionRow>
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
    backgroundColor: '#fff', // Default for inactive state (on gray background)
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
    }),
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  row: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  chipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  chipText: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
});
