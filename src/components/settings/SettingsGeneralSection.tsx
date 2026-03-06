import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { User, X } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { UserConfig } from '../../constants/config';
import { useContacts } from '../../contexts/ContactsContext';

type ThemeType = typeof THEME;

interface SettingsGeneralSectionProps {
  config: UserConfig;
  onUpdate: (c: UserConfig) => void;
  theme: ThemeType;
}

export const SettingsGeneralSection = ({ config, onUpdate, theme }: SettingsGeneralSectionProps) => {
  const { contacts, formatName } = useContacts();

  // Local draft state for fields that trigger a full reload on commit
  const [tupperBaseUri, setTupperBaseUri] = useState(config.tupperBaseUri);
  const [secretAccessToken, setSecretAccessToken] = useState(config.secretAccessToken);

  // Contact search state for Point of View
  const [centerSearch, setCenterSearch] = useState('');
  const [centerDropdownActive, setCenterDropdownActive] = useState(false);

  // Resolve initial display name from loaded contacts
  useEffect(() => {
    if (config.centerId && contacts.length > 0) {
      const found = contacts.find(c => c.identifier === config.centerId);
      if (found) setCenterSearch(formatName(found.identity));
    }
  }, [config.centerId, contacts]);

  const centerResults = useMemo(() => {
    if (!centerDropdownActive || centerSearch.trim().length < 1) return [];
    return contacts
      .filter(c => formatName(c.identity).toLowerCase().includes(centerSearch.toLowerCase().trim()))
      .slice(0, 6);
  }, [centerDropdownActive, centerSearch, contacts, formatName]);

  // Keep drafts in sync if config changes from outside
  useEffect(() => { setTupperBaseUri(config.tupperBaseUri); }, [config.tupperBaseUri]);
  useEffect(() => { setSecretAccessToken(config.secretAccessToken); }, [config.secretAccessToken]);

  return (
  <View style={[styles.section, { borderBottomColor: theme.border }]}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>General</Text>

    <Text style={[styles.subtitle, { marginTop: 0, color: theme.textMuted }]}>Tupp Server Base URI</Text>
    <TextInput
      style={[styles.input, { marginBottom: 20, borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
      value={tupperBaseUri}
      onChangeText={setTupperBaseUri}
      onBlur={() => onUpdate({ ...config, tupperBaseUri })}
      placeholder="e.g. http://217.145.72.68:3058"
      placeholderTextColor={theme.textMuted}
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="url"
    />

    <Text style={[styles.subtitle, { marginTop: 0, color: theme.textMuted }]}>Secret Access Token</Text>
    <TextInput
      style={[styles.input, { marginBottom: 20, borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
      value={secretAccessToken}
      onChangeText={setSecretAccessToken}
      onBlur={() => onUpdate({ ...config, secretAccessToken })}
      placeholder="Bearer token"
      placeholderTextColor={theme.textMuted}
      autoCapitalize="none"
      autoCorrect={false}
      secureTextEntry
    />

    <Text style={[styles.subtitle, { marginTop: 0, color: theme.textMuted }]}>Point of View (who you are)</Text>
    <View style={[styles.searchContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <User size={16} color={theme.textMuted} style={styles.searchIcon} />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        value={centerSearch}
        onChangeText={v => {
          setCenterSearch(v);
          setCenterDropdownActive(true);
          if (!v.trim()) onUpdate({ ...config, centerId: '' });
        }}
        onFocus={() => setCenterDropdownActive(true)}
        placeholder="Search your contact…"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {centerSearch.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            setCenterSearch('');
            setCenterDropdownActive(false);
            onUpdate({ ...config, centerId: '' });
          }}
          style={styles.clearBtn}
        >
          <X size={14} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    </View>
    {centerResults.length > 0 && (
      <View style={[styles.dropdown, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        {centerResults.map(c => (
          <TouchableOpacity
            key={c.identifier}
            onPress={() => {
              const name = formatName(c.identity);
              setCenterSearch(name);
              setCenterDropdownActive(false);
              onUpdate({ ...config, centerId: c.identifier });
            }}
            style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
          >
            <Text style={{ color: theme.text, fontSize: 14 }}>{formatName(c.identity)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}

    <Text style={[styles.subtitle, { marginTop: 20, color: theme.textMuted }]}>Name Display Pattern</Text>
    <TextInput
      style={[styles.input, { marginBottom: 20, borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
      value={config.nameDisplayPattern}
      onChangeText={(text) => onUpdate({ ...config, nameDisplayPattern: text })}
      placeholder="e.g. TITLE FIRST LAST"
      placeholderTextColor={theme.textMuted}
    />

    <Text style={[styles.subtitle, { marginTop: 0, color: theme.textMuted }]}>Date Format Pattern</Text>
    <TextInput
      style={[styles.input, { marginBottom: 20, borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
      value={config.dateFormat}
      onChangeText={(text) => onUpdate({ ...config, dateFormat: text })}
      placeholder="e.g. MONTH DD, YYYY"
      placeholderTextColor={theme.textMuted}
    />

    <Text style={[styles.subtitle, { marginTop: 0, color: theme.textMuted }]}>Contacts Sorted By</Text>
    <View style={[styles.row, { marginTop: 10, gap: 10 }]}>
      {(['PROXIMITY', 'ALPHABETICAL', 'RECENTLY_ADDED'] as const).map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.chip,
            config.sortBy === option
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => onUpdate({ ...config, sortBy: option })}
        >
          <Text
            style={[
              styles.chipText,
              config.sortBy === option ? { color: theme.primaryForeground } : { color: theme.text },
            ]}
          >
            {option === 'PROXIMITY' ? 'Proximity' : option === 'ALPHABETICAL' ? 'Alphabetical' : 'Recently'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
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
      web: { outlineStyle: 'none' },
      default: {},
    }) as any,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    ...Platform.select({
      web: { outlineStyle: 'none' },
      default: {},
    }) as any,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
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
  chipText: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '500',
  },
});
