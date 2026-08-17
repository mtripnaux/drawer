import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { ChevronLeft, Plus, Trash2, FolderTree } from 'lucide-react-native';
import { LIGHT_THEME, DARK_THEME, THEME } from '../constants/theme';
import { useConfig } from '../contexts/ConfigContext';
import { useContacts } from '../contexts/ContactsContext';
import { useNavigation } from '../navigation/NavigationContext';
import { Group } from '../types';

type ThemeType = typeof THEME;

const ROW_H = 36;
const DOT_S = 8;
const LINE_X = DOT_S / 2 - 0.5;
const ELBOW_W = 20;
// Sentinel used in `addingParentId` to mean "adding a top-level group" (real
// group identifiers are UUIDs and can never be an empty string).
const TOP_LEVEL = '';

interface AddRowProps {
  theme: ThemeType;
  value: string;
  onChangeText: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  disabled: boolean;
}

const AddRow = ({ theme, value, onChangeText, onConfirm, onCancel, disabled }: AddRowProps) => (
  <View style={styles.addRow}>
    <TextInput
      style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
      value={value}
      onChangeText={onChangeText}
      placeholder="Group name"
      placeholderTextColor={theme.textMuted}
      autoFocus
      editable={!disabled}
      onSubmitEditing={onConfirm}
    />
    <TouchableOpacity onPress={onConfirm} disabled={disabled || !value.trim()} style={styles.addRowBtn}>
      <Text style={[styles.addRowBtnText, { color: (disabled || !value.trim()) ? theme.textMuted : theme.primary }]}>Add</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onCancel} style={styles.addRowBtn}>
      <Text style={[styles.addRowBtnText, { color: theme.textMuted }]}>Cancel</Text>
    </TouchableOpacity>
  </View>
);

interface GroupNodeProps {
  group: Group;
  theme: ThemeType;
  addingParentId: string | null;
  newGroupName: string;
  creating: boolean;
  onStartAdd: (parentId: string) => void;
  onChangeNewGroupName: (text: string) => void;
  onConfirmAdd: () => void;
  onCancelAdd: () => void;
  onDelete: (group: Group) => void;
}

const GroupNode = (props: GroupNodeProps) => {
  const { group, theme, addingParentId, onStartAdd, onDelete } = props;
  const children = group.subgroups ?? [];
  const isAddingHere = addingParentId === group.identifier;

  return (
    <View>
      <View style={styles.nodeRow}>
        <View style={[styles.dot, { backgroundColor: theme.primary }]} />
        {(children.length > 0 || isAddingHere) && (
          <View style={[styles.lineDown, { backgroundColor: theme.border }]} />
        )}
        <Text style={[styles.label, { color: theme.text }]} numberOfLines={2}>
          {group.name}
        </Text>
        <TouchableOpacity onPress={() => onStartAdd(group.identifier)} style={styles.iconBtn}>
          <Plus size={16} color={theme.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(group)} style={styles.iconBtn}>
          <Trash2 size={16} color={theme.danger} />
        </TouchableOpacity>
      </View>

      {children.map((child, i) => {
        const isLast = i === children.length - 1;
        return (
          <View key={child.identifier} style={styles.childRow}>
            <View style={styles.connectorCol}>
              <View style={[
                styles.connectorVert,
                { backgroundColor: theme.border },
                isLast && !isAddingHere ? styles.connectorVertHalf : styles.connectorVertFull,
              ]} />
              <View style={[styles.connectorHoriz, { backgroundColor: theme.border }]} />
            </View>
            <View style={{ flex: 1 }}>
              <GroupNode {...props} group={child} />
            </View>
          </View>
        );
      })}

      {isAddingHere && (
        <View style={styles.childRow}>
          <View style={styles.connectorCol}>
            <View style={[styles.connectorVert, styles.connectorVertHalf, { backgroundColor: theme.border }]} />
            <View style={[styles.connectorHoriz, { backgroundColor: theme.border }]} />
          </View>
          <View style={{ flex: 1 }}>
            <AddRow
              theme={theme}
              value={props.newGroupName}
              onChangeText={props.onChangeNewGroupName}
              onConfirm={props.onConfirmAdd}
              onCancel={props.onCancelAdd}
              disabled={props.creating}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export const GroupsScreen = () => {
  const { config } = useConfig();
  const { groups, createGroup, deleteGroup } = useContacts();
  const { pop } = useNavigation();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);

  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const startAdd = (parentId: string) => {
    setAddingParentId(parentId);
    setNewGroupName('');
  };

  const cancelAdd = () => {
    setAddingParentId(null);
    setNewGroupName('');
  };

  const confirmAdd = async () => {
    const name = newGroupName.trim();
    if (!name || addingParentId === null) return;
    setCreating(true);
    try {
      await createGroup(name, addingParentId === TOP_LEVEL ? undefined : addingParentId);
      setAddingParentId(null);
      setNewGroupName('');
    } catch (err) {
      Alert.alert('Could not create group', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (group: Group) => {
    const hasChildren = (group.subgroups?.length ?? 0) > 0;
    const message = hasChildren
      ? `Delete "${group.name}"? Its subgroups will also be removed, and it will be unlinked from every contact.`
      : `Delete "${group.name}"? It will be unlinked from every contact.`;

    const doDelete = async () => {
      try {
        await deleteGroup(group.identifier);
      } catch (err) {
        Alert.alert('Could not delete group', err instanceof Error ? err.message : 'Unknown error');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) doDelete();
      return;
    }
    Alert.alert('Delete group', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={pop}
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Groups</Text>
        <TouchableOpacity
          onPress={() => startAdd(TOP_LEVEL)}
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Plus size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {addingParentId === TOP_LEVEL && (
          <AddRow
            theme={theme}
            value={newGroupName}
            onChangeText={setNewGroupName}
            onConfirm={confirmAdd}
            onCancel={cancelAdd}
            disabled={creating}
          />
        )}

        {groups.length === 0 && addingParentId !== TOP_LEVEL ? (
          <View style={styles.empty}>
            <FolderTree size={48} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No groups yet</Text>
          </View>
        ) : (
          groups.map((g, i) => (
            <View key={g.identifier} style={i > 0 ? { marginTop: 8 } : undefined}>
              <GroupNode
                group={g}
                theme={theme}
                addingParentId={addingParentId}
                newGroupName={newGroupName}
                creating={creating}
                onStartAdd={startAdd}
                onChangeNewGroupName={setNewGroupName}
                onConfirmAdd={confirmAdd}
                onCancelAdd={cancelAdd}
                onDelete={handleDelete}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
  nodeRow: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    gap: 4,
  },
  dot: { width: DOT_S, height: DOT_S, borderRadius: DOT_S / 2, marginRight: 12, zIndex: 1 },
  lineDown: {
    position: 'absolute', left: LINE_X,
    top: ROW_H / 2 + DOT_S / 2 + 5,
    height: ROW_H / 2 - DOT_S / 2 - 4,
    width: 1,
  },
  label: { fontSize: 15, fontWeight: '400', flex: 1 },
  iconBtn: { padding: 8 },
  childRow: { flexDirection: 'row', alignItems: 'stretch' },
  connectorCol: { width: ELBOW_W },
  connectorVert: { position: 'absolute', left: LINE_X, top: 0, width: 1 },
  connectorVertHalf: { height: ROW_H / 2 },
  connectorVertFull: { bottom: 0 },
  connectorHoriz: {
    position: 'absolute', left: LINE_X,
    top: ROW_H / 2 - 0.5,
    width: ELBOW_W - LINE_X - 4,
    height: 1,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    ...Platform.select({
      web: { outlineStyle: 'none' },
      default: {},
    }) as any,
  },
  addRowBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  addRowBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
