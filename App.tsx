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
  BackHandler
} from 'react-native';
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Users, ArrowUpDown, Settings } from 'lucide-react-native';

import { useContacts } from './src/hooks/useContacts';
import { SettingsView } from './src/components/SettingsView';
import { ProfileView } from './src/components/ProfileView';
import { ContactItem } from './src/components/ContactItem';
import { formatNameWithConfig } from './src/utils/format';
import { THEME } from './src/constants/theme';
import { defaultUserConfig, UserConfig, CENTER_ID } from './src/constants/config';
import { ContactWithDistance } from './src/types';
import { Contact } from './src/utils/graph';

export default function App() {
  const [config, setConfig] = useState<UserConfig>(defaultUserConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Family' | 'Friends'>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedContact, setSelectedContact] = useState<ContactWithDistance | null>(null);

  const { contacts, loading } = useContacts();

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
            continue; // Spouse allowed but only at the end
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
    }

    // Sort
    result.sort((a, b) => {
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

    return result;
  }, [contacts, searchQuery, activeTab, sortOrder, config]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  if (showSettings) {
    return (
      <SafeAreaView style={styles.safeArea}>
         <SettingsView config={config} onUpdate={setConfig} onClose={() => setShowSettings(false)} />
         <StatusBar style="dark" />
      </SafeAreaView> 
    );
  }

  if (selectedContact) {
    return (
      <SafeAreaView style={styles.safeArea}>
         <ProfileView contact={selectedContact} onClose={() => setSelectedContact(null)} contactMap={contactMap} formatName={formatName} />
         <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Network</Text>
            <Text style={styles.subtitle}>{filteredContacts.length} connections found</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowSettings(true)}
            >
              <Settings size={20} color={THEME.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown size={20} color={THEME.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={THEME.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={THEME.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['All', 'Family', 'Friends'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.identifier}
          renderItem={({ item }) => (
            <ContactItem 
              item={item} 
              onSelect={setSelectedContact} 
              formatName={formatName} 
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          bounces={true}
          overScrollMode="always"
          indicatorStyle="black"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={48} color={THEME.border} />
              <Text style={styles.emptyText}>No contacts found</Text>
            </View>
          }
        />
      </View>
      <StatusBar style="dark" />
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
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

