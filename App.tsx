import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  BackHandler,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Users, ArrowUpDown, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useContacts } from './src/hooks/useContacts';
import { SettingsView } from './src/components/SettingsView';
import { ProfileView } from './src/components/ProfileView';
import { ContactItem } from './src/components/ContactItem';
import { formatNameWithConfig } from './src/utils/format';
import { LIGHT_THEME, DARK_THEME, THEME } from './src/constants/theme';
import { defaultUserConfig, UserConfig, CENTER_ID } from './src/constants/config';
import { ContactWithDistance, Group } from './src/types';
import { Contact } from './src/types/index';

export default function App() {
  const [config, setConfig] = useState<UserConfig>(defaultUserConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedContact, setSelectedContact] = useState<ContactWithDistance | null>(null);

  const currentTheme = useMemo(() => config.darkTheme ? DARK_THEME : LIGHT_THEME, [config.darkTheme]);

  // Scroll tracking for tabs

  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [viewWidth, setViewWidth] = useState(0);

  const { contacts, groups, loading } = useContacts();

  const tabs = useMemo(() => {
    const defaultTabs = [
      { id: 'All', name: 'All' },
      { id: 'Friends', name: 'Friends' },
      { id: 'Family', name: 'Family' }
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

  useEffect(() => {
    const backAction = () => {
      if (selectedContact) {
        setSelectedContact(null);
        return true;
      }
      if (showSettings) {
        setShowSettings(false);
        return true;
      }
      return false; // Let the default back button behavior happen (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [selectedContact, showSettings]);

  const formatName = (identity: Contact['identity']) => formatNameWithConfig(identity, config);

  const contactMap = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach(c => {
      map.set(c.identifier, formatName(c.identity));
    });
    return map;
  }, [contacts, config]);

  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Filter by deceased
    if (!config.showDeceasedPeople && !searchQuery) {
      result = result.filter(c => c.identity.is_alive !== false);
    }

    // Filter by search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => 
        formatName(c.identity).toLowerCase().includes(lowerQuery)
      );
    }

    const coreFamilyTypes = ['Sibling', 'Parent', 'Child', 'Half-Sibling'];

    // Filter by tab
    if (activeTab === 'Family') {
      result = result.filter(c => {
        if (c.identifier === CENTER_ID) return true;
        if (c.distance === Infinity || c.relations.length === 0) return false;
        
        for (let i = 0; i < c.relations.length; i++) {
          const rel = c.relations[i];
          const isLast = i === c.relations.length - 1;
          
          if (coreFamilyTypes.includes(rel)) {
            continue;
          }
          
          if (rel === 'Spouse' && isLast) {
            continue; 
          }
          
          return false;
        }
        
        return true;
      });
    } else if (activeTab === 'Friends') {
      result = result.filter(c => {
        if (c.identifier === CENTER_ID) return true;
        if (c.distance === Infinity || c.relations.length === 0) return false;
        
        const allowedFriendsTypes = ['Friend', 'Partner', 'Spouse'];
        return c.relations.every(rel => allowedFriendsTypes.includes(rel));
      });
    } else if (activeTab !== 'All') {
      // Group filter
      const getRelevantGroupIds = (id: string, allGroups: Group[]): string[] => {
        const findGroup = (gs: Group[]): Group | undefined => {
          for (const g of gs) {
            if (g.identifier === id) return g;
            if (g.subgroups) {
              const found = findGroup(g.subgroups);
              if (found) return found;
            }
          }
          return undefined;
        };

        const target = findGroup(allGroups);
        if (!target) return [id];

        const ids = [target.identifier];
        const collectSubIds = (gs: Group[]) => {
          gs.forEach(sub => {
            ids.push(sub.identifier);
            if (sub.subgroups) collectSubIds(sub.subgroups);
          });
        };
        if (target.subgroups) collectSubIds(target.subgroups);
        return ids;
      };

      const groupIds = getRelevantGroupIds(activeTab, groups);
      result = result.filter(c => c.groups?.some(gid => groupIds.includes(gid)));
    }

    // Sort
    const sorted = [...result].sort((a, b) => {
      if (config.sortBy === 'ALPHABETICAL') {
        const nameA = formatName(a.identity);
        const nameB = formatName(b.identity);
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      }
      
      // Default: PROXIMITY
      const distA = a.distance === Infinity ? Number.MAX_SAFE_INTEGER : a.distance;
      const distB = b.distance === Infinity ? Number.MAX_SAFE_INTEGER : b.distance;
      
      if (sortOrder === 'asc') {
        if (distA < distB) return -1;
        if (distA > distB) return 1;
      } else {
        if (distA > distB) return -1;
        if (distA < distB) return 1;
      }
      return 0;
    });

    return sorted;
  }, [contacts, searchQuery, activeTab, sortOrder, config]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  if (showSettings) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
         <SettingsView config={config} onUpdate={setConfig} onClose={() => setShowSettings(false)} theme={currentTheme} />
         <StatusBar style={config.darkTheme ? 'light' : 'dark'} />
      </SafeAreaView> 
    );
  }

  if (selectedContact) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
         <ProfileView 
            contact={selectedContact} 
            onClose={() => setSelectedContact(null)} 
            contactMap={contactMap} 
            formatName={formatName} 
            groups={groups}
            allContacts={contacts}
            onSelectContact={setSelectedContact}
            config={config}
            theme={currentTheme}
          />
         <StatusBar style={config.darkTheme ? 'light' : 'dark'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: currentTheme.text }]}>Your Network</Text>
            <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>{filteredContacts.length} connections found</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
              onPress={() => setShowSettings(true)}
            >
              <Settings size={20} color={currentTheme.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
              onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown size={20} color={currentTheme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
          <Search size={20} color={currentTheme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: currentTheme.text }]}
            placeholder="Search contacts..."
            placeholderTextColor={currentTheme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <View 
          style={styles.tabsWrapper}
          onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
            bounces={true}
            scrollEventThrottle={16}
            onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
            onContentSizeChange={(w) => setContentWidth(w)}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                    styles.tab, 
                    activeTab === tab.id 
                       ? { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary } 
                       : { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[
                   styles.tabText, 
                   activeTab === tab.id 
                     ? { color: currentTheme.primaryForeground } 
                     : { color: currentTheme.text }
                ]}>
                  {tab.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {true && (
            <LinearGradient
              colors={[currentTheme.background, 'transparent']}
              locations={[0.3, 0.43]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fadeLeft}
              pointerEvents="none"
            />
          )}
          {true && (
            <LinearGradient
              colors={['transparent', currentTheme.background]}
              locations={[0.56, 0.69]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fadeRight}
              pointerEvents="none"
            />
          )}
        </View>

        {/* List */}
        <FlatList
          data={filteredContacts}
          extraData={currentTheme}
          keyExtractor={(item) => item.identifier}
          renderItem={({ item }) => (
            <ContactItem 
              item={item} 
              onSelect={setSelectedContact} 
              formatName={formatName} 
              theme={currentTheme}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          bounces={true}
          overScrollMode="always"
          indicatorStyle={config.darkTheme ? "white" : "black"}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={48} color={currentTheme.border} />
              <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>No contacts found</Text>
            </View>
          }
        />
      </View>
      <StatusBar style={config.darkTheme ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingTop: Platform.OS === 'web' ? 0 : 30,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.textMuted,
    marginTop: 4,
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: THEME.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
    height: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
      default: {},
    }) as any,
  },
  tabsWrapper: {
    position: 'relative',
    height: 44,
    marginBottom: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
    zIndex: 1,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    zIndex: 1,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  activeTab: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.textMuted,
  },
  activeTabText: {
    color: THEME.primaryForeground,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: THEME.textMuted,
  },
});

