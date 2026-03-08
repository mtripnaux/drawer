import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { ContactWithDistance, Group } from '../../types';

type ThemeType = typeof THEME;

const ROW_H = 32;
const DOT_S = 8;
const LINE_X = DOT_S / 2 - 0.5; // 3.5 — same as ProfileRelationshipPath
const ELBOW_W = 20; // width of the L/T connector column

function hasAnyMatch(group: Group, ids: string[]): boolean {
  if (ids.includes(group.identifier)) return true;
  return !!group.subgroups?.some(g => hasAnyMatch(g, ids));
}

const GroupNode = ({
  group,
  contactGroupIds,
  onGroupPress,
  theme,
}: {
  group: Group;
  contactGroupIds: string[];
  onGroupPress: (groupId: string) => void;
  theme: ThemeType;
}) => {
  const visibleChildren = (group.subgroups ?? []).filter(g => hasAnyMatch(g, contactGroupIds));

  return (
    <View>
      {/* Row for this node */}
      <TouchableOpacity style={styles.nodeRow} onPress={() => onGroupPress(group.identifier)}>
        <View style={[styles.dot, { backgroundColor: theme.primary }]} />
        {visibleChildren.length > 0 && (
          <View style={[styles.lineDown, { backgroundColor: theme.border }]} />
        )}
        <Text style={[styles.label, { color: theme.text }]} numberOfLines={2}>
          {group.name}
        </Text>
      </TouchableOpacity>

      {/* Children with L/T connectors */}
      {visibleChildren.map((child, i) => {
        const isLast = i === visibleChildren.length - 1;
        return (
          <View key={child.identifier} style={styles.childRow}>
            <View style={styles.connectorCol}>
              <View style={[
                styles.connectorVert,
                { backgroundColor: theme.border },
                isLast ? styles.connectorVertHalf : styles.connectorVertFull,
              ]} />
              <View style={[styles.connectorHoriz, { backgroundColor: theme.border }]} />
            </View>
            <View style={{ flex: 1 }}>
              <GroupNode group={child} contactGroupIds={contactGroupIds} onGroupPress={onGroupPress} theme={theme} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

interface ProfileGroupsProps {
  contact: ContactWithDistance;
  groups: Group[];
  onGroupPress: (groupId: string) => void;
  theme: ThemeType;
}

export const ProfileGroups = ({ contact, groups, onGroupPress, theme }: ProfileGroupsProps) => {
  if (!contact.groups || contact.groups.length === 0) return null;

  const rootGroups = groups.filter(g => hasAnyMatch(g, contact.groups!));
  if (rootGroups.length === 0) return null;

  return (
    <View style={[styles.section, { borderBottomColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Groups and Subgroups</Text>
      <View style={styles.treeContainer}>
        {rootGroups.map((g, i) => (
          <View key={g.identifier} style={i > 0 ? { marginTop: 8 } : undefined}>
            <GroupNode group={g} contactGroupIds={contact.groups!} onGroupPress={onGroupPress} theme={theme} />
          </View>
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
  treeContainer: {
    marginLeft: 8,
  },
  nodeRow: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: DOT_S,
    height: DOT_S,
    borderRadius: DOT_S / 2,
    marginRight: 12,
    zIndex: 1,
  },
  // Short downward line below the parent dot, bridging to the first child connector
  lineDown: {
    position: 'absolute',
    left: LINE_X,
    top: ROW_H / 2 + DOT_S / 2 + 5,       // 5px gap below dot — matches RelationshipPath
    height: ROW_H / 2 - DOT_S / 2 - 4,    // reaches row boundary
    width: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '400',
    flex: 1,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'stretch', // lets connectorCol stretch to child subtree height
  },
  connectorCol: {
    width: ELBOW_W,
  },
  connectorVert: {
    position: 'absolute',
    left: LINE_X,
    top: 0,
    width: 1,
  },
  // Last child: L-shape — vertical reaches the horizontal bar exactly (gap only toward the dot)
  connectorVertHalf: {
    height: ROW_H / 2,
  },
  // Non-last child: T-shape — vertical continues through the whole subtree
  connectorVertFull: {
    bottom: 0,
  },
  connectorHoriz: {
    position: 'absolute',
    left: LINE_X,
    top: ROW_H / 2 - 0.5,
    width: ELBOW_W - LINE_X - 4, // 4px gap before child dot
    height: 1,
  },
});
