import React, { useState, useMemo } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';

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
  const { contacts, groups, formatName } = useContacts();
  const { push } = useNavigation();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
        theme={theme}
      />
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} theme={theme} />
      <TabsBar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} theme={theme} />
      <FlatList
        data={filteredContacts}
        extraData={theme}
        keyExtractor={(item) => item.identifier}
        renderItem={({ item }) => (
          <ContactItem
            item={item}
            onSelect={(contact) => push({ name: 'Profile', params: { contact } })}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: 10, fontSize: 16 },
});
