import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { UserConfig, DEFAULT_RELATION_WEIGHTS } from '../../constants/config';

type ThemeType = typeof THEME;

interface SettingsRelationshipSectionProps {
  config: UserConfig;
  onUpdate: (c: UserConfig) => void;
  theme: ThemeType;
}

export const SettingsRelationshipSection = ({ config, onUpdate, theme }: SettingsRelationshipSectionProps) => {
  const [weights, setWeights] = useState<Record<string, string>>(
    Object.entries(config.relationWeights).reduce((acc, [key, val]) => {
      acc[key] = val.toString();
      return acc;
    }, {} as Record<string, string>)
  );

  useEffect(() => {
    // Sync weights from config
    setWeights(
      Object.entries(config.relationWeights).reduce((acc, [key, val]) => {
        acc[key] = val.toString();
        return acc;
      }, {} as Record<string, string>)
    );
  }, [config.relationWeights]);

  const handleWeightChange = (relation: string, value: string) => {
    setWeights(prev => ({ ...prev, [relation]: value }));
  };

  const handleWeightBlur = (relation: string) => {
    const value = parseFloat(weights[relation]);
    if (!isNaN(value) && value >= 0) {
      const newWeights = { ...config.relationWeights, [relation]: value };
      onUpdate({ ...config, relationWeights: newWeights });
    } else {
      // Reset to previous value on invalid input
      setWeights(prev => ({
        ...prev,
        [relation]: config.relationWeights[relation].toString(),
      }));
    }
  };

  const handleResetAll = () => {
    setWeights(
      Object.entries(DEFAULT_RELATION_WEIGHTS).reduce((acc, [key, val]) => {
        acc[key] = val.toString();
        return acc;
      }, {} as Record<string, string>)
    );
    onUpdate({ ...config, relationWeights: { ...DEFAULT_RELATION_WEIGHTS } });
  };

  // Sort relations by weight for better UX
  const sortedRelations = Object.entries(weights).sort(
    ([, a], [, b]) => parseFloat(a) - parseFloat(b)
  );

  return (
    <View style={[styles.section, { borderBottomColor: theme.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Relationship Distances</Text>
        <TouchableOpacity
          onPress={handleResetAll}
          style={[styles.resetButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <RotateCcw size={16} color={theme.text} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.subtitle, { color: theme.textMuted, marginBottom: 16 }]}>
        Lower values = closer relationships. Adjust to customize proximity calculations.
      </Text>

      <ScrollView scrollEnabled={false}>
        {sortedRelations.map(([relation, value]) => (
          <View key={relation} style={styles.inputRow}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, { color: theme.text }]}>{relation}</Text>
              <Text style={[styles.hint, { color: theme.textMuted }]}>
                {parseFloat(value) < 1
                  ? 'Very Close'
                  : parseFloat(value) < 1.5
                  ? 'Close'
                  : parseFloat(value) < 2.5
                  ? 'Moderate'
                  : 'Distant'}
              </Text>
            </View>
            <TextInput
              style={[
                styles.numberInput,
                { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface },
              ]}
              value={value}
              onChangeText={(text) => handleWeightChange(relation, text)}
              onBlur={() => handleWeightBlur(relation)}
              placeholder="0.0"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              maxLength={5}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.textMuted,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: THEME.border,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.text,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  numberInput: {
    width: 70,
    height: 40,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    color: THEME.text,
    backgroundColor: THEME.surface,
    textAlign: 'center',
    marginLeft: 12,
    ...Platform.select({
      web: { outlineStyle: 'none' },
      default: {},
    }) as any,
  },
});
