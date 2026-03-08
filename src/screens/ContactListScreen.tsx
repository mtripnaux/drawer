import React, { useState, useMemo, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Platform, BackHandler } from 'react-native';
import { Users, Plus, WifiOff } from 'lucide-react-native';

import { useConfig } from '../contexts/ConfigContext';
import { useContacts } from '../contexts/ContactsContext';
import { useNavigation } from '../navigation/NavigationContext';
import { useFilteredContacts } from '../hooks/useFilteredContacts';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';
import { Group } from '../types';

import { HomeHeader } from '../components/HomeHeader';
import { SearchBar } from '../components/SearchBar';
import { TabsBar } from '../components/TabsBar';
import { ContactItem } from '../components/ContactItem';

export const ContactListScreen = () => {
  const { config } = useConfig();
  const { contacts, groups, loading, refetching, saving, error, formatName, refetch } = useContacts();
  const { push, pendingGroupFilter, clearPendingGroupFilter, stack } = useNavigation();
  const isAtRoot = stack.length === 1;

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (pendingGroupFilter) {
      setActiveTab(pendingGroupFilter);
      clearPendingGroupFilter();
    }
  }, [pendingGroupFilter, clearPendingGroupFilter]);

  // When at root with an active group filter, back should clear the filter first
  useEffect(() => {
    if (!isAtRoot) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab !== 'All') {
        setActiveTab('All');
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [isAtRoot, activeTab]);

  const tabs = useMemo(() => {
    const defaultTabs = [
      { id: 'All', name: 'All' },
      { id: 'Friends', name: 'Friends' },
      { id: 'Family', name: 'Family' },
    ];
    const flattenGroups = (gs: Group[]): { id: string; name: string }[] => {
      let res: { id: string; name: string }[] = [];
      gs.forEach(g => {
        res.push({ id: g.identifier, name: g.name });
        if (g.subgroups) res = res.concat(flattenGroups(g.subgroups));
      });
      return res;
    };
    return [...defaultTabs, ...flattenGroups(groups)];
  }, [groups]);

  const filteredContacts = useFilteredContacts(
    contacts, groups, config, formatName, searchQuery, activeTab, sortOrder
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <HomeHeader
        count={filteredContacts.length}
        onSettings={() => push({ name: 'Settings' })}
        onToggleSort={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
        onRefetch={refetch}
        refetching={loading || refetching}
        theme={theme}
      />
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.surface, borderColor: '#f87171' }]}>
          <WifiOff size={14} color='#ef4444' />
          <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
        </View>
      )}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} theme={theme} />
      <TabsBar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} theme={theme} />
      <FlatList
        data={filteredContacts}
        extraData={theme}
        keyExtractor={(item) => item.identifier}
        renderItem={({ item }) => (
          <ContactItem
            item={item}
            onSelect={(contact) => push({ name: 'Profile', params: { contactId: contact.identifier } })}
            formatName={formatName}
            theme={theme}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        bounces={true}
        overScrollMode="always"
        indicatorStyle={config.darkTheme ? 'white' : 'black'}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={48} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No contacts found</Text>
          </View>
        }
      />
      {/* FAB — create new contact */}
      <TouchableOpacity
        onPress={() => push({ name: 'EditContact', params: {} })}
        disabled={saving}
        style={[styles.fab, { backgroundColor: theme.primary, opacity: saving ? 0.4 : 1 }]}
      >
        <Plus size={22} color={theme.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: 10, fontSize: 16 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: { fontSize: 13, flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)' },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
});
