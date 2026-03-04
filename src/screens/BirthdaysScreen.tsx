import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Settings, ArrowUpDown, RefreshCw, Gift, WifiOff } from 'lucide-react-native';
import { LIGHT_THEME, DARK_THEME, THEME } from '../constants/theme';
import { useConfig } from '../contexts/ConfigContext';
import { useContacts } from '../contexts/ContactsContext';
import { useNavigation } from '../navigation/NavigationContext';
import { ContactWithDistance } from '../types';
import { getInitials } from '../utils/format';
import { Animated } from 'react-native';
import { useSpinAnimation } from '../hooks/useSpinAnimation';

const daysUntilNextBirthday = (month: number, day: number): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bday = new Date(today.getFullYear(), month - 1, day);
  if (bday < today) bday.setFullYear(today.getFullYear() + 1);
  return Math.round((bday.getTime() - today.getTime()) / 86400000);
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const getGenderColors = (gender: string | null | undefined, theme: typeof THEME) => {
  if (gender === 'male' || gender === 'Male') return { bg: '#eff6ff', text: '#1d4ed8' };
  if (gender === 'female' || gender === 'Female') return { bg: '#fdf2f8', text: '#be185d' };
  return { bg: theme.surface, text: theme.textMuted };
};

type BirthdayContact = ContactWithDistance & {
  daysUntil: number;
  turnsAge: number | null;
};

export const BirthdaysScreen = () => {
  const { config } = useConfig();
  const { contacts, loading, refetching, error, formatName, refetch } = useContacts();
  const { push } = useNavigation();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);

  const { rotate } = useSpinAnimation(loading || refetching);

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const birthdayContacts = useMemo<BirthdayContact[]>(() => {
    return contacts
      .filter(c => c.identity.birth_date?.month && c.identity.birth_date?.day)
      .map(c => {
        const { month, day, year } = c.identity.birth_date!;
        const daysUntil = daysUntilNextBirthday(month!, day!);
        const turnsAge = year
          ? new Date().getFullYear() + (daysUntil === 0 ? 0 : 1) - year
          : null;
        return { ...c, daysUntil, turnsAge };
      })
      .sort((a, b) => sortOrder === 'asc' ? a.daysUntil - b.daysUntil : b.daysUntil - a.daysUntil);
  }, [contacts, sortOrder]);

  const renderItem = ({ item }: { item: BirthdayContact }) => {
    const colors = getGenderColors(item.identity.gender, theme);
    const { month, day } = item.identity.birth_date!;
    const isToday = item.daysUntil === 0;
    const label = isToday
      ? '🎉 Today!'
      : item.daysUntil === 1
      ? 'Tomorrow'
      : `In ${item.daysUntil} days`;

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => push({ name: 'Profile', params: { contactId: item.identifier } })}
        >
          <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {getInitials(item.identity.first_name || '?', item.identity.last_name || '?')}
            </Text>
          </View>

          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {formatName(item.identity)}
            </Text>
            <Text style={[styles.date, { color: theme.textMuted }]}>
              {MONTH_NAMES[month! - 1]} {day}
              {item.turnsAge !== null && (
                <Text style={{ color: theme.textMuted }}>
                  {' '}· turns {item.turnsAge}
                </Text>
              )}
            </Text>
          </View>

          <View style={[
            styles.badge,
            isToday
              ? { backgroundColor: theme.primary }
              : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
          ]}>
            <Text style={[
              styles.badgeText,
              { color: isToday ? theme.primaryForeground : theme.textMuted },
            ]}>
              {label}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Birthdays</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {birthdayContacts.length} upcoming
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
            onPress={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            <ArrowUpDown size={20} color={theme.text} />
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

      {birthdayContacts.length === 0 ? (
        <View style={styles.empty}>
          <Gift size={48} color={theme.border} />
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No birthdays found</Text>
        </View>
      ) : (
        <FlatList
          data={birthdayContacts}
          keyExtractor={item => item.identifier}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border }} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={true}
          indicatorStyle='default'
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
    paddingBottom: 40,
  },
  itemContainer: {
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 0,
    paddingLeft: 0,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },
  date: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
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
