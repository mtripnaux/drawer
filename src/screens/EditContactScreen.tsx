import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Plus, X, Check } from 'lucide-react-native';
import { useConfig } from '../contexts/ConfigContext';
import { useContacts } from '../contexts/ContactsContext';
import { useNavigation } from '../navigation/NavigationContext';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';
import { Contact, ContactWithDistance } from '../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type Theme = typeof LIGHT_THEME;

// ─── item types ───────────────────────────────────────────────────────────────

interface PhoneItem  { label: string; country_code: string; number: string }
interface EmailItem  { label: string; address: string }
interface SocialItem { network: string; username: string }

// ─── screen ───────────────────────────────────────────────────────────────────

interface EditContactScreenProps {
  contact?: ContactWithDistance;
}

export const EditContactScreen = ({ contact }: EditContactScreenProps) => {
  const { config } = useConfig();
  const { saveContact } = useContacts();
  const { pop } = useNavigation();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);
  const isNew = !contact;

  // ── identity ──────────────────────────────────────────────────────────────
  const [firstName,   setFirstName]   = useState(contact?.identity.first_name   ?? '');
  const [lastName,    setLastName]    = useState(contact?.identity.last_name    ?? '');
  const [middleName,  setMiddleName]  = useState(contact?.identity.middle_name  ?? '');
  const [title,       setTitle]       = useState(contact?.identity.title        ?? '');
  const [postNominal, setPostNominal] = useState(contact?.identity.post_nominal ?? '');

  const [gender, setGender] = useState<'male' | 'female' | 'non-binary' | null>(() => {
    const g = contact?.identity.gender;
    if (!g) return null;
    return g.toLowerCase() as 'male' | 'female' | 'non-binary';
  });

  const [isAlive, setIsAlive] = useState(contact?.identity.is_alive !== false);

  // ── birth date ────────────────────────────────────────────────────────────
  const [birthYear,  setBirthYear]  = useState(contact?.identity.birth_date?.year?.toString()  ?? '');
  const [birthMonth, setBirthMonth] = useState(contact?.identity.birth_date?.month?.toString() ?? '');
  const [birthDay,   setBirthDay]   = useState(contact?.identity.birth_date?.day?.toString()   ?? '');

  // ── phones / emails / socials ─────────────────────────────────────────────
  const [phones, setPhones] = useState<PhoneItem[]>(
    contact?.phones?.map(p => ({
      label: p.label ?? '',
      country_code: p.country_code.toString(),
      number: p.number.toString(),
    })) ?? []
  );
  const [emails, setEmails] = useState<EmailItem[]>(
    contact?.emails?.map(e => ({ label: e.label ?? '', address: e.address })) ?? []
  );
  const [socials, setSocials] = useState<SocialItem[]>(
    contact?.socials?.map(s => ({ network: s.network, username: s.username })) ?? []
  );

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const parsedYear  = birthYear  ? parseInt(birthYear,  10) : null;
    const parsedMonth = birthMonth ? parseInt(birthMonth, 10) : null;
    const parsedDay   = birthDay   ? parseInt(birthDay,   10) : null;
    const hasBirthDate = parsedYear !== null || parsedMonth !== null || parsedDay !== null;

    const updated: Contact = {
      identifier: contact?.identifier ?? generateUUID(),
      identity: {
        first_name:        firstName.trim()   || null,
        last_name:         lastName.trim()    || null,
        middle_name:       middleName.trim()  || null,
        title:             title.trim()       || null,
        post_nominal:      postNominal.trim() || null,
        gender,
        birth_date: hasBirthDate
          ? {
              year:   parsedYear,
              month:  parsedMonth,
              day:    parsedDay,
              hour:   contact?.identity.birth_date?.hour   ?? null,
              minute: contact?.identity.birth_date?.minute ?? null,
              second: contact?.identity.birth_date?.second ?? null,
            }
          : (contact?.identity.birth_date ?? null),
        is_alive:          isAlive,
        birth_first_name:  contact?.identity.birth_first_name  ?? null,
        birth_middle_name: contact?.identity.birth_middle_name ?? null,
        birth_last_name:   contact?.identity.birth_last_name   ?? null,
      },
      phones: phones.length > 0
        ? phones.map(p => ({
            label: p.label || null,
            country_code: parseInt(p.country_code, 10) || 0,
            number: parseInt(p.number, 10) || 0,
          }))
        : null,
      emails: emails.length > 0
        ? emails.map(e => ({ label: e.label || null, address: e.address }))
        : null,
      socials: socials.length > 0
        ? socials
            .filter(s => s.network && s.username)
            .map(s => ({ network: s.network.toLowerCase(), username: s.username }))
        : null,
      links:  contact?.links  ?? null,
      groups: contact?.groups ?? null,
    };

    saveContact(updated);
    pop();
  };

  // ── shortcuts ─────────────────────────────────────────────────────────────
  const inputStyle = [
    styles.input,
    { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface },
  ];

  const toggleGender = (g: 'male' | 'female' | 'non-binary') =>
    setGender(prev => (prev === g ? null : g));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* ── Header — identical layout to SettingsScreen / ProfileScreen ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={pop}
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>
          {isNew ? 'New Contact' : 'Edit Contact'}
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.iconButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
        >
          <Check size={20} color={theme.primaryForeground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

          {/* ── Identity ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Identity</Text>

            {([
              { label: 'First name',   value: firstName,   set: setFirstName                       },
              { label: 'Last name',    value: lastName,    set: setLastName                        },
              { label: 'Middle name',  value: middleName,  set: setMiddleName                      },
              { label: 'Title',        value: title,       set: setTitle,       ph: 'Dr, Mr, Mrs…' },
              { label: 'Post-nominal', value: postNominal, set: setPostNominal, ph: 'PhD, MD…'     },
            ] as const).map(({ label, value, set, ph }: any) => (
              <View key={label}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
                <TextInput
                  style={inputStyle}
                  value={value}
                  onChangeText={set}
                  placeholder={ph ?? label}
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            ))}
          </View>

          {/* ── Gender ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Gender</Text>
            <View style={styles.chipRow}>
              {(['male', 'female', 'non-binary'] as const).map(g => (
                <TouchableOpacity
                  key={g}
                  onPress={() => toggleGender(g)}
                  style={[
                    styles.chip,
                    gender === g
                      ? { backgroundColor: theme.primary, borderColor: theme.primary }
                      : { backgroundColor: theme.surface,  borderColor: theme.border  },
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    { color: gender === g ? theme.primaryForeground : theme.text },
                  ]}>
                    {g === 'non-binary' ? 'Non-binary' : g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Birth date ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Birth date</Text>
            <View style={styles.dateRow}>
              {([
                { label: 'Year',  value: birthYear,  set: setBirthYear,  ph: 'YYYY', flex: 1.4, max: 4 },
                { label: 'Month', value: birthMonth, set: setBirthMonth, ph: 'MM',   flex: 1,   max: 2 },
                { label: 'Day',   value: birthDay,   set: setBirthDay,   ph: 'DD',   flex: 1,   max: 2 },
              ] as const).map(({ label, value, set, ph, flex, max }: any) => (
                <View key={label} style={{ flex }}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
                  <TextInput
                    style={[inputStyle, styles.dateInput]}
                    value={value}
                    onChangeText={set}
                    placeholder={ph}
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    maxLength={max}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* ── Status ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Status</Text>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setIsAlive(v => !v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, { color: theme.text }]}>Is alive</Text>
              <Switch
                value={isAlive}
                onValueChange={setIsAlive}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.primaryForeground}
              />
            </TouchableOpacity>
          </View>

          {/* ── Phones ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Phones</Text>

            {phones.map((ph, i) => (
              <View key={i} style={[styles.entryRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.entryLeft}>
                  <View style={styles.entryTopLine}>
                    <TextInput
                      style={[styles.entryCode, { color: theme.text }]}
                      value={ph.country_code}
                      onChangeText={v => setPhones(p => p.map((x, j) => j === i ? { ...x, country_code: v } : x))}
                      placeholder="+33"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.dot, { color: theme.border }]}>·</Text>
                    <TextInput
                      style={[styles.entryMain, { color: theme.text }]}
                      value={ph.number}
                      onChangeText={v => setPhones(p => p.map((x, j) => j === i ? { ...x, number: v } : x))}
                      placeholder="Phone number"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                  <TextInput
                    style={[styles.entrySubLabel, { color: theme.textMuted }]}
                    value={ph.label}
                    onChangeText={v => setPhones(p => p.map((x, j) => j === i ? { ...x, label: v } : x))}
                    placeholder="label"
                    placeholderTextColor={theme.border}
                  />
                </View>
                <TouchableOpacity onPress={() => setPhones(p => p.filter((_, j) => j !== i))} style={styles.deleteBtn}>
                  <X size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addRow}
              onPress={() => setPhones(p => [...p, { label: 'default', country_code: '33', number: '' }])}
            >
              <Plus size={16} color={theme.textMuted} />
              <Text style={[styles.addLabel, { color: theme.textMuted }]}>Add phone</Text>
            </TouchableOpacity>
          </View>

          {/* ── Emails ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Emails</Text>

            {emails.map((em, i) => (
              <View key={i} style={[styles.entryRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.entryLeft}>
                  <TextInput
                    style={[styles.entryMain, { color: theme.text }]}
                    value={em.address}
                    onChangeText={v => setEmails(e => e.map((x, j) => j === i ? { ...x, address: v } : x))}
                    placeholder="email@example.com"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.entrySubLabel, { color: theme.textMuted }]}
                    value={em.label}
                    onChangeText={v => setEmails(e => e.map((x, j) => j === i ? { ...x, label: v } : x))}
                    placeholder="label"
                    placeholderTextColor={theme.border}
                  />
                </View>
                <TouchableOpacity onPress={() => setEmails(e => e.filter((_, j) => j !== i))} style={styles.deleteBtn}>
                  <X size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addRow}
              onPress={() => setEmails(e => [...e, { label: 'default', address: '' }])}
            >
              <Plus size={16} color={theme.textMuted} />
              <Text style={[styles.addLabel, { color: theme.textMuted }]}>Add email</Text>
            </TouchableOpacity>
          </View>

          {/* ── Social networks ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Social networks</Text>

            {socials.map((sc, i) => (
              <View key={i} style={[styles.entryRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.entryLeft}>
                  <View style={styles.entryTopLine}>
                    <TextInput
                      style={[styles.entryNetwork, { color: theme.text }]}
                      value={sc.network}
                      onChangeText={v => setSocials(s => s.map((x, j) => j === i ? { ...x, network: v } : x))}
                      placeholder="instagram"
                      placeholderTextColor={theme.textMuted}
                      autoCapitalize="none"
                    />
                    <Text style={[styles.dot, { color: theme.border }]}>·</Text>
                    <TextInput
                      style={[styles.entryMain, { color: theme.text }]}
                      value={sc.username}
                      onChangeText={v => setSocials(s => s.map((x, j) => j === i ? { ...x, username: v } : x))}
                      placeholder="username"
                      placeholderTextColor={theme.textMuted}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSocials(s => s.filter((_, j) => j !== i))} style={styles.deleteBtn}>
                  <X size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addRow}
              onPress={() => setSocials(s => [...s, { network: '', username: '' }])}
            >
              <Plus size={16} color={theme.textMuted} />
              <Text style={[styles.addLabel, { color: theme.textMuted }]}>Add social network</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header — matches SettingsScreen / ProfileScreen exactly
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },

  // ── Sections — matches SettingsGeneralSection
  section: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },

  // ── Gender chips — matches SettingsGeneralSection chips
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Birth date
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    textAlign: 'center',
  },

  // ── Status — matches OptionRow
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  optionText: {
    fontSize: 16,
  },

  // ── Dynamic entry rows — matches SettingsProfileSection row style
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  entryLeft: {
    flex: 1,
  },
  entryTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryCode: {
    fontSize: 15,
    fontWeight: '500',
    minWidth: 38,
  },
  entryNetwork: {
    fontSize: 15,
    fontWeight: '500',
    minWidth: 72,
  },
  entryMain: {
    flex: 1,
    fontSize: 15,
  },
  entrySubLabel: {
    fontSize: 12,
    marginTop: 3,
  },
  dot: {
    fontSize: 18,
    marginHorizontal: 6,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },

  // ── Add row
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addLabel: {
    fontSize: 15,
  },
});
