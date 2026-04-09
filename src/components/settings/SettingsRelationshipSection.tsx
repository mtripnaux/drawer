import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { RotateCcw, Link2, Gem, Heart, Handshake, BriefcaseBusiness, Baby, Users, Smile, HeartCrack } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { UserConfig, DEFAULT_RELATION_WEIGHTS } from '../../constants/config';

type ThemeType = typeof THEME;

interface SettingsRelationshipSectionProps {
  config: UserConfig;
  onUpdate: (c: UserConfig) => void;
  theme: ThemeType;
}

const SYMMETRIC_RELATION_GROUPS: Array<{ label: string; keys: string[] }> = [
  { label: 'Hierarchical', keys: ['Boss', 'Employee'] },
  { label: 'Parent / Child', keys: ['Parent', 'Child'] },
];
const RELATION_DEFAULT_ORDER = Object.keys(DEFAULT_RELATION_WEIGHTS);

const getRelationIcon = (label: string): React.ComponentType<{ size: number; color: string }> => {
  switch (label) {
    case 'Spouse':
      return Gem;
    case 'Partner':
      return Heart;
    case 'Colleague':
      return Handshake;
    case 'Hierarchical':
      return BriefcaseBusiness;
    case 'Parent / Child':
      return Baby;
    case 'Sibling':
    case 'Half-Sibling':
      return Users;
    case 'Friend':
      return Smile;
    case 'Ex':
      return HeartCrack;
    default:
      return Link2;
  }
};

export const SettingsRelationshipSection = ({ config, onUpdate, theme }: SettingsRelationshipSectionProps) => {
  const [weights, setWeights] = useState<Record<string, number>>({ ...config.relationWeights });

  useEffect(() => {
    setWeights({ ...config.relationWeights });
  }, [config.relationWeights]);

  const handleWeightChange = (relations: string[], value: number) => {
    setWeights(prev => {
      const next = { ...prev };
      relations.forEach((relation) => {
        if (relation in next) {
          next[relation] = value;
        }
      });
      return next;
    });
  };

  const handleWeightCommit = (relations: string[], value: number) => {
    const newWeights = { ...config.relationWeights };
    relations.forEach((relation) => {
      if (relation in newWeights) {
        newWeights[relation] = value;
      }
    });
    onUpdate({ ...config, relationWeights: newWeights });
  };

  const handleResetAll = () => {
    setWeights({ ...DEFAULT_RELATION_WEIGHTS });
    onUpdate({ ...config, relationWeights: { ...DEFAULT_RELATION_WEIGHTS } });
  };

  const displayedRelations = useMemo(() => {
    const groupByKey = new Map<string, { label: string; keys: string[] }>();
    SYMMETRIC_RELATION_GROUPS.forEach((group) => {
      group.keys.forEach((key) => groupByKey.set(key, group));
    });

    const items: Array<{ id: string; label: string; relations: string[]; value: number }> = [];
    const added = new Set<string>();

    for (const relation of RELATION_DEFAULT_ORDER) {
      if (!(relation in weights)) continue;

      const group = groupByKey.get(relation);
      if (group) {
        const id = group.keys.join('|');
        if (added.has(id)) continue;
        const presentKeys = group.keys.filter((key) => key in weights);
        if (presentKeys.length === 0) continue;

        const value = presentKeys.reduce((sum, key) => sum + weights[key], 0) / presentKeys.length;
        items.push({ id, label: group.label, relations: presentKeys, value });
        added.add(id);
      } else {
        if (added.has(relation)) continue;
        items.push({ id: relation, label: relation, relations: [relation], value: weights[relation] });
        added.add(relation);
      }
    }

    Object.entries(weights).forEach(([relation, value]) => {
      const group = groupByKey.get(relation);
      if (group) {
        const id = group.keys.join('|');
        if (added.has(id)) return;
        const presentKeys = group.keys.filter((key) => key in weights);
        if (presentKeys.length === 0) return;

        const groupValue = presentKeys.reduce((sum, key) => sum + weights[key], 0) / presentKeys.length;
        items.push({ id, label: group.label, relations: presentKeys, value: groupValue });
        added.add(id);
      } else if (!added.has(relation)) {
        items.push({ id: relation, label: relation, relations: [relation], value });
        added.add(relation);
      }
    });

    return items;
  }, [weights]);

  return (
    <View style={[styles.section, { borderBottomColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Relationship Distances</Text>
      <Text style={[styles.hint, { color: theme.textMuted }]}>
        Select proximity values for each relation type
      </Text>

      <ScrollView scrollEnabled={false}>
        {displayedRelations.map((item, index) => {
          const RelationIcon = getRelationIcon(item.label);

          return (
            <View
              key={item.id}
              style={[
                styles.row,
                { backgroundColor: theme.surface, borderColor: theme.border },
                index === displayedRelations.length - 1 && styles.rowLast,
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: theme.primary + '18' }]}>
                <RelationIcon size={18} color={theme.primary} />
              </View>

              <View style={styles.labelWrap}>
                <Text style={[styles.label, { color: theme.text }]}>{item.label}</Text>
              </View>

              <View style={styles.sliderWrap}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={3}
                  step={0.05}
                  minimumTrackTintColor={theme.text}
                  maximumTrackTintColor={theme.border}
                  thumbTintColor={theme.text}
                  value={Math.min(3, item.value)}
                  onValueChange={(newValue) => handleWeightChange(item.relations, newValue)}
                  onSlidingComplete={(newValue) => handleWeightCommit(item.relations, newValue)}
                />
              </View>
            </View>
          );
        })}
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
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    color: THEME.textMuted,
    marginBottom: 16,
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
  rowLast: {
    marginBottom: 0,
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
    color: THEME.text,
  },
  sliderWrap: {
    width: 130,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
