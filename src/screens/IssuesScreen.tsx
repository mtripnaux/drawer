import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { AlertTriangle, RefreshCw, Settings, ShieldCheck, WifiOff, Link2Off, Repeat, Cake } from 'lucide-react-native';
import { LIGHT_THEME, DARK_THEME, THEME } from '../constants/theme';
import { useConfig } from '../contexts/ConfigContext';
import { useContacts } from '../contexts/ContactsContext';
import { useNavigation } from '../navigation/NavigationContext';
import { computeAge, normalizeSearch } from '../utils/format';
import { useSpinAnimation } from '../hooks/useSpinAnimation';

type Severity = 'warning';

interface IssueItem {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  contactIds: string[];
}

const dedupe = (ids: string[]) => Array.from(new Set(ids));

const toNamePreview = (
  ids: string[],
  getName: (id: string) => string | null,
  max: number = 3,
) => {
  const names = dedupe(ids)
    .map(getName)
    .filter((v): v is string => !!v);
  if (names.length === 0) return '';
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return extra > 0 ? `${shown.join(', ')} +${extra} more` : shown.join(', ');
};

export const IssuesScreen = () => {
  const { config } = useConfig();
  const { contacts, loading, refetching, error, formatName, refetch } = useContacts();
  const { push } = useNavigation();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);
  const { rotate } = useSpinAnimation(loading || refetching);

  const issues = useMemo<IssueItem[]>(() => {
    const all: IssueItem[] = [];
    const byId = new Map(contacts.map(c => [c.identifier, c]));

    const getNameById = (id: string) => {
      const contact = byId.get(id);
      return contact ? formatName(contact.identity) : null;
    };

    // 1) Missing links / self links
    const missingTargetContacts: string[] = [];
    const selfLinkedContacts: string[] = [];

    contacts.forEach((c) => {
      (c.links || []).forEach((l) => {
        if (l.target === c.identifier) selfLinkedContacts.push(c.identifier);
        if (!byId.has(l.target)) missingTargetContacts.push(c.identifier);
      });
    });

    if (missingTargetContacts.length > 0) {
      all.push({
        id: 'missing-link-target',
        title: 'Links to missing contacts',
        description: `Some links point to contacts that do not exist anymore. ${toNamePreview(missingTargetContacts, getNameById)}`,
        severity: 'warning',
        contactIds: dedupe(missingTargetContacts),
      });
    }

    if (selfLinkedContacts.length > 0) {
      all.push({
        id: 'self-links',
        title: 'Self-referential links',
        description: `Some contacts link to themselves. ${toNamePreview(selfLinkedContacts, getNameById)}`,
        severity: 'warning',
        contactIds: dedupe(selfLinkedContacts),
      });
    }

    // 2) Parent/child cycle detection (directed graph)
    const parentToChildren = new Map<string, Set<string>>();
    contacts.forEach((c) => parentToChildren.set(c.identifier, new Set()));

    contacts.forEach((c) => {
      (c.links || []).forEach((l) => {
        if (!byId.has(l.target)) return;
        if (l.relation === 'Parent') {
          parentToChildren.get(c.identifier)?.add(l.target);
        } else if (l.relation === 'Child') {
          parentToChildren.get(l.target)?.add(c.identifier);
        }
      });
    });

    const color = new Map<string, 0 | 1 | 2>();
    const stack: string[] = [];
    const cycleNodes = new Set<string>();

    const dfs = (node: string) => {
      color.set(node, 1);
      stack.push(node);

      for (const next of parentToChildren.get(node) || []) {
        const state = color.get(next) || 0;
        if (state === 0) {
          dfs(next);
        } else if (state === 1) {
          const idx = stack.indexOf(next);
          if (idx >= 0) {
            for (let i = idx; i < stack.length; i++) cycleNodes.add(stack[i]);
          }
          cycleNodes.add(next);
          cycleNodes.add(node);
        }
      }

      stack.pop();
      color.set(node, 2);
    };

    contacts.forEach((c) => {
      if ((color.get(c.identifier) || 0) === 0) dfs(c.identifier);
    });

    if (cycleNodes.size > 0) {
      const ids = Array.from(cycleNodes);
      all.push({
        id: 'family-cycles',
        title: 'Family cycles detected',
        description: `Parent/child relationships contain one or more cycles. ${toNamePreview(ids, getNameById)}`,
        severity: 'warning',
        contactIds: ids,
      });
    }

    // 3) Age constraints
    const olderThan120: string[] = [];
    const futureBirthYear: string[] = [];
    const currentYear = new Date().getFullYear();

    contacts.forEach((c) => {
      const age = computeAge(c.identity.birth_date);
      if (age && age.age > 120) olderThan120.push(c.identifier);
      if ((c.identity.birth_date?.year || 0) > currentYear) futureBirthYear.push(c.identifier);
    });

    if (olderThan120.length > 0) {
      all.push({
        id: 'age-over-120',
        title: 'Ages over 120 years',
        description: `Some contacts have an age above 120. ${toNamePreview(olderThan120, getNameById)}`,
        severity: 'warning',
        contactIds: dedupe(olderThan120),
      });
    }

    if (futureBirthYear.length > 0) {
      all.push({
        id: 'future-birth-year',
        title: 'Birth dates in the future',
        description: `Some contacts have a future birth year. ${toNamePreview(futureBirthYear, getNameById)}`,
        severity: 'warning',
        contactIds: dedupe(futureBirthYear),
      });
    }

    // 4) Potential duplicates by identity (same name + same birth date)
    const identityGroups = new Map<string, string[]>();

    contacts.forEach((c) => {
      const first = normalizeSearch(c.identity.first_name || '');
      const last = normalizeSearch(c.identity.last_name || '');
      const year = c.identity.birth_date?.year ?? null;
      const month = c.identity.birth_date?.month ?? null;
      const day = c.identity.birth_date?.day ?? null;

      if (!first || !last || !year || !month || !day) return;

      const key = `${first}|${last}|${year}-${month}-${day}`;
      const arr = identityGroups.get(key) || [];
      arr.push(c.identifier);
      identityGroups.set(key, arr);
    });

    const duplicateIdentityIds = Array.from(identityGroups.values())
      .filter(ids => ids.length > 1)
      .flat();

    if (duplicateIdentityIds.length > 0) {
      all.push({
        id: 'duplicate-identity',
        title: 'Potential duplicate contacts',
        description: `Same full name and birth date detected multiple times. ${toNamePreview(duplicateIdentityIds, getNameById)}`,
        severity: 'warning',
        contactIds: dedupe(duplicateIdentityIds),
      });
    }

    // 5) Duplicate email addresses
    const emailGroups = new Map<string, string[]>();
    contacts.forEach((c) => {
      (c.emails || []).forEach((email) => {
        const key = normalizeSearch(email.address || '').trim();
        if (!key) return;
        const arr = emailGroups.get(key) || [];
        arr.push(c.identifier);
        emailGroups.set(key, arr);
      });
    });

    const duplicateEmailIds = Array.from(emailGroups.values())
      .filter(ids => new Set(ids).size > 1)
      .flat();

    if (duplicateEmailIds.length > 0) {
      all.push({
        id: 'duplicate-email',
        title: 'Duplicate email addresses',
        description: `The same email appears on multiple contacts. ${toNamePreview(duplicateEmailIds, getNameById)}`,
        severity: 'warning',
        contactIds: dedupe(duplicateEmailIds),
      });
    }

    // 6) Duplicate phone numbers
    const phoneGroups = new Map<string, string[]>();
    contacts.forEach((c) => {
      (c.phones || []).forEach((phone) => {
        const cc = `${phone.country_code || ''}`.replace(/\D/g, '');
        const num = `${phone.number || ''}`.replace(/\D/g, '');
        const key = `${cc}|${num}`;
        if (!num) return;
        const arr = phoneGroups.get(key) || [];
        arr.push(c.identifier);
        phoneGroups.set(key, arr);
      });
    });

    const duplicatePhoneIds = Array.from(phoneGroups.values())
      .filter(ids => new Set(ids).size > 1)
      .flat();

    if (duplicatePhoneIds.length > 0) {
      all.push({
        id: 'duplicate-phone',
        title: 'Duplicate phone numbers',
        description: `The same phone number appears on multiple contacts. ${toNamePreview(duplicatePhoneIds, getNameById)}`,
        severity: 'warning',
        contactIds: dedupe(duplicatePhoneIds),
      });
    }

    return all;
  }, [contacts, formatName]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Issues</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}> 
            {issues.length === 0
              ? 'All checks passed'
              : `${issues.length} warning${issues.length > 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={refetch}
            disabled={loading || refetching}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <RefreshCw size={20} color={(loading || refetching) ? theme.textMuted : theme.text} />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => push({ name: 'Settings' })}
          >
            <Settings size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.surface, borderColor: '#f87171' }]}> 
          <WifiOff size={14} color='#ef4444' />
          <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
        </View>
      )}

      {issues.length === 0 ? (
        <View style={styles.empty}> 
          <ShieldCheck size={48} color={theme.primary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No issues found</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Contacts look healthy.</Text>
        </View>
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const borderColor = theme.border;
            const iconColor = '#f59e0b';
            const iconBg = config.darkTheme ? 'rgba(245,158,11,0.18)' : '#fef3c7';

            return (
              <View style={[styles.issueCard, { backgroundColor: theme.surface, borderColor }]}> 
                <View style={[styles.issueIconWrap, { backgroundColor: iconBg }]}> 
                  {item.id === 'family-cycles' ? (
                    <Repeat size={18} color={iconColor} />
                  ) : item.id === 'age-over-120' || item.id === 'future-birth-year' ? (
                    <Cake size={18} color={iconColor} />
                  ) : item.id === 'missing-link-target' ? (
                    <Link2Off size={18} color={iconColor} />
                  ) : (
                    <AlertTriangle size={18} color={iconColor} />
                  )}
                </View>
                <View style={styles.issueContent}>
                  <Text style={[styles.issueTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.issueDescription, { color: theme.textMuted }]}>{item.description}</Text>
                  <Text style={[styles.issueMeta, { color: theme.textMuted }]}>
                    {dedupe(item.contactIds).length} contact{dedupe(item.contactIds).length > 1 ? 's' : ''} impacted
                  </Text>
                </View>
              </View>
            );
          }}
          showsVerticalScrollIndicator
          indicatorStyle={config.darkTheme ? 'white' : 'black'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
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
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  issueCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  issueIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  issueContent: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },
  issueDescription: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: THEME.textMuted,
  },
  issueMeta: {
    marginTop: 8,
    fontSize: 12,
    color: THEME.textMuted,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 70,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 14,
  },
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
});
