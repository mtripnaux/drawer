import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { ContactWithDistance, Group } from '../../types';

type ThemeType = typeof THEME;

const NestedGroups = ({
  groups,
  contactGroupIds,
  level = 0,
  theme,
}: {
  groups: Group[];
  contactGroupIds: string[];
  level?: number;
  theme: ThemeType;
}) => {
  const isMatch = (group: Group): boolean => {
    if (contactGroupIds.includes(group.identifier)) return true;
    return !!group.subgroups?.some(isMatch);
  };

  return (
    <View style={{ marginLeft: level * 16 }}>
      {groups.map((group) => {
        if (!isMatch(group)) return null;
        return (
          <View key={group.identifier} style={styles.groupItem}>
            <View style={styles.groupHeader}>
              <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
              <Text style={[styles.groupName, { color: theme.text }]}>{group.name}</Text>
            </View>
            {group.subgroups && (
              <NestedGroups
                groups={group.subgroups}
                contactGroupIds={contactGroupIds}
                level={level + 1}
                theme={theme}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

interface ProfileGroupsProps {
  contact: ContactWithDistance;
  groups: Group[];
  theme: ThemeType;
}

export const ProfileGroups = ({ contact, groups, theme }: ProfileGroupsProps) => {
  if (!contact.groups || contact.groups.length === 0) return null;

  return (
    <View style={[styles.section, { borderBottomColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Groups and Subgroups</Text>
      <NestedGroups groups={groups} contactGroupIds={contact.groups} theme={theme} />
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
  groupItem: {
    marginVertical: 0,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.primary,
    marginRight: 10,
  },
  groupName: {
    fontSize: 15,
    color: THEME.text,
  },
});
