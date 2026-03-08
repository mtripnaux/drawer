import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Plus, X, Check } from 'lucide-react-native';
import { OptionRow } from '../components/settings/OptionRow';
import { useConfig } from '../contexts/ConfigContext';
import { useContacts } from '../contexts/ContactsContext';
import { useNavigation } from '../navigation/NavigationContext';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';
import { Contact, ContactWithDistance, Relation, Group } from '../types';
import { normalizeSearch } from '../utils/format';

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
interface AddressItem { label: string; number: string; street: string; city: string; region: string; post_code: string; country: string }
interface SocialItem { network: string; username: string; label: string }
interface LinkItem   { target: string; relation: string; search: string }

const RELATION_TYPES: Relation[] = [
  'Friend', 'Sibling', 'Spouse', 'Partner', 'Parent', 'Child',
  'Boss', 'Employee', 'Colleague', 'Half-Sibling', 'Ex',
];

// ─── screen ───────────────────────────────────────────────────────────────────

interface EditContactScreenProps {
  contact?: ContactWithDistance;
}

export const EditContactScreen = ({ contact }: EditContactScreenProps) => {
  const { config } = useConfig();
  const { saveContact, saving, contacts, groups, contactMap, formatName } = useContacts();
  const { pop } = useNavigation();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);
  const flatGroups = useMemo(() => {
    const flatten = (gs: Group[]): Group[] =>
      gs.flatMap(g => [g, ...(g.subgroups ? flatten(g.subgroups) : [])]);
    return flatten(groups);
  }, [groups]);
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

  // ── validation errors ─────────────────────────────────────────────────────
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; gender?: string }>({});

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
  const [addresses, setAddresses] = useState<AddressItem[]>(
    contact?.addresses?.map(a => ({
      label:     a.label     ?? '',
      number:    a.number    ?? '',
      street:    a.street    ?? '',
      city:      a.city      ?? '',
      region:    a.region    ?? '',
      post_code: a.post_code ?? '',
      country:   a.country   ?? '',
    })) ?? []
  );
  const [socials, setSocials] = useState<SocialItem[]>(
    contact?.socials?.map(s => ({ network: s.network, username: s.username, label: s.label ?? '' })) ?? []
  );
  const [links, setLinks] = useState<LinkItem[]>(
    contact?.links?.map(l => ({
      target: l.target,
      relation: l.relation,
      search: contactMap.get(l.target) ?? '',
    })) ?? []
  );
  const [selectedGroups, setSelectedGroups] = useState<string[]>(contact?.groups ?? []);

  // ── save ──────────────────────────────────────────────────────────────────
  const saveGuardRef = useRef(false);

  const handleSave = async () => {
    if (saveGuardRef.current) return;
    const newErrors: typeof errors = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim())  newErrors.lastName  = 'Last name is required';
    if (!gender)           newErrors.gender    = 'Gender is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    saveGuardRef.current = true;

    const parsedYear  = birthYear  ? parseInt(birthYear,  10) : null;
    const parsedMonth = birthMonth ? parseInt(birthMonth, 10) : null;
    const parsedDay   = birthDay   ? parseInt(birthDay,   10) : null;
    const hasBirthDate = parsedYear !== null || parsedMonth !== null || parsedDay !== null;

    const updated: Contact = {
      identifier: contact?.identifier ?? '',
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
      addresses: addresses.length > 0
        ? addresses.map(a => ({
            label:     a.label     || null,
            number:    a.number    || null,
            street:    a.street    || null,
            city:      a.city      || null,
            region:    a.region    || null,
            post_code: a.post_code || null,
            country:   a.country   || null,
          }))
        : null,
      socials: socials.length > 0
        ? socials
            .filter(s => s.network && s.username)
            .map(s => ({ network: s.network.toLowerCase(), username: s.username, label: s.label || null }))
        : null,
      links: links.filter(l => l.target && l.relation).map(l => ({
        target: l.target,
        relation: l.relation as Relation,
      })),
      groups: selectedGroups.length > 0 ? selectedGroups : null,
    };

    await saveContact(updated);
    pop();
  };

  // ── shortcuts ─────────────────────────────────────────────────────────────
  const inputStyle = [
    styles.input,
    { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface },
  ];

  const toggleGender = (g: 'male' | 'female' | 'non-binary') =>
    setGender(prev => (prev === g ? null : g));

  type ErrorKey = keyof typeof errors;

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
          disabled={saving}
          style={[styles.iconButton, { backgroundColor: theme.primary, borderColor: theme.primary, opacity: saving ? 0.4 : 1 }]}
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
              { label: 'First name',   value: firstName,   set: setFirstName,                       errorKey: 'firstName' as ErrorKey | null },
              { label: 'Last name',    value: lastName,    set: setLastName,                        errorKey: 'lastName'  as ErrorKey | null },
              { label: 'Middle name',  value: middleName,  set: setMiddleName,                      errorKey: null as ErrorKey | null },
              { label: 'Title',        value: title,       set: setTitle,       ph: 'Dr, Mr, Mrs…', errorKey: null as ErrorKey | null },
              { label: 'Post-nominal', value: postNominal, set: setPostNominal, ph: 'PhD, MD…',     errorKey: null as ErrorKey | null },
            ]).map(({ label, value, set, ph, errorKey }) => (
              <View key={label}>
                <Text style={[styles.fieldLabel, { color: errorKey && errors[errorKey] ? theme.danger : theme.textMuted }]}>
                  {label}{errorKey && errors[errorKey] ? ` — ${errors[errorKey]}` : ''}
                </Text>
                <TextInput
                  style={[inputStyle, errorKey && errors[errorKey] ? { borderColor: theme.danger } : null]}
                  value={value}
                  onChangeText={(v: string) => { set(v); if (errorKey) setErrors(e => ({ ...e, [errorKey]: undefined })); }}
                  placeholder={ph ?? label}
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            ))}
          </View>

          {/* ── Gender ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: errors.gender ? theme.danger : theme.text }]}>
              Gender{errors.gender ? ` — ${errors.gender}` : ''}
            </Text>
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
            <OptionRow
              onPress={() => setIsAlive(v => !v)}
              label="This person is alive"
              textColor={theme.text}
            >
              <View style={[styles.toggle, { backgroundColor: isAlive ? theme.primary : theme.border }]}>
                <View
                  style={[
                    styles.toggleKnob,
                    isAlive ? { backgroundColor: theme.primaryForeground } : {},
                    isAlive && styles.toggleKnobActive,
                  ]}
                />
              </View>
            </OptionRow>
          </View>

          {/* ── Groups ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Groups</Text>
            {flatGroups.length === 0 ? (
              <Text style={[styles.emptyNote, { color: theme.textMuted }]}>No groups available</Text>
            ) : (
              <View style={styles.chipRow}>
                {flatGroups.map(g => {
                  const active = selectedGroups.includes(g.identifier);
                  return (
                    <TouchableOpacity
                      key={g.identifier}
                      onPress={() =>
                        setSelectedGroups(prev =>
                          active ? prev.filter(id => id !== g.identifier) : [...prev, g.identifier]
                        )
                      }
                      style={[
                        styles.chip,
                        active
                          ? { backgroundColor: theme.primary, borderColor: theme.primary }
                          : { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? theme.primaryForeground : theme.text }]}>
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Relations ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Relations</Text>
            {links.map((lk, i) => {
              const searchResults =
                lk.search.trim().length >= 1 && !lk.target
                  ? contacts
                      .filter(
                        c =>
                          c.identifier !== contact?.identifier &&
                          normalizeSearch(formatName(c.identity))
                            .includes(normalizeSearch(lk.search.trim()))
                      )
                      .slice(0, 5)
                  : [];
              return (
                <View
                  key={i}
                  style={[
                    styles.entryRow,
                    styles.linkRow,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  {/* Contact selector */}
                  <View style={styles.linkContactRow}>
                    <TextInput
                      style={[styles.entryMain, { color: theme.text, flex: 1 }]}
                      value={lk.search}
                      onChangeText={v =>
                        setLinks(ls =>
                          ls.map((x, j) => (j === i ? { ...x, search: v, target: '' } : x))
                        )
                      }
                      placeholder="Search contact…"
                      placeholderTextColor={theme.textMuted}
                    />
                    <TouchableOpacity
                      onPress={() => setLinks(ls => ls.filter((_, j) => j !== i))}
                      style={styles.deleteBtn}
                    >
                      <X size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <View style={[styles.searchResults, { borderColor: theme.border }]}>
                      {searchResults.map(c => (
                        <TouchableOpacity
                          key={c.identifier}
                          onPress={() =>
                            setLinks(ls =>
                              ls.map((x, j) =>
                                j === i
                                  ? { ...x, target: c.identifier, search: formatName(c.identity) }
                                  : x
                              )
                            )
                          }
                          style={[styles.searchResultItem, { borderBottomColor: theme.border }]}
                        >
                          <Text style={{ color: theme.text, fontSize: 14 }}>
                            {formatName(c.identity)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Relation type */}
                  <Text style={[styles.linkSeparatorText, { color: theme.textMuted }]}>
                    Relation type
                  </Text>
                  <View style={styles.chipRow}>
                    {RELATION_TYPES.map(rel => (
                      <TouchableOpacity
                        key={rel}
                        onPress={() =>
                          setLinks(ls =>
                            ls.map((x, j) => (j === i ? { ...x, relation: rel } : x))
                          )
                        }
                        style={[
                          styles.smallChip,
                          lk.relation === rel
                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                            : { backgroundColor: theme.background, borderColor: theme.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.smallChipText,
                            { color: lk.relation === rel ? theme.primaryForeground : theme.text },
                          ]}
                        >
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
            <TouchableOpacity
              style={styles.addRow}
              onPress={() => setLinks(ls => [...ls, { target: '', relation: '', search: '' }])}
            >
              <Plus size={16} color={theme.textMuted} />
              <Text style={[styles.addLabel, { color: theme.textMuted }]}>Add relation</Text>
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

          {/* ── Addresses ── */}
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Addresses</Text>

            {addresses.map((ad, i) => (
              <View key={i} style={[styles.entryRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.entryLeft, { gap: 4 }]}>
                  {([
                    { key: 'number',    ph: 'Number',         kb: 'default' },
                    { key: 'street',    ph: 'Street',         kb: 'default' },
                    { key: 'city',      ph: 'City',           kb: 'default' },
                    { key: 'region',    ph: 'Region',         kb: 'default' },
                    { key: 'post_code', ph: 'Postal code',    kb: 'numeric' },
                    { key: 'country',   ph: 'Country',        kb: 'default' },
                  ] as { key: keyof AddressItem; ph: string; kb: string }[]).map(({ key, ph, kb }) => (
                    <TextInput
                      key={key}
                      style={[styles.entryMain, { color: theme.text }]}
                      value={ad[key]}
                      onChangeText={v => setAddresses(a => a.map((x, j) => j === i ? { ...x, [key]: v } : x))}
                      placeholder={ph}
                      placeholderTextColor={theme.textMuted}
                      keyboardType={kb as any}
                      autoCapitalize={key === 'post_code' || key === 'number' ? 'none' : 'words'}
                    />
                  ))}
                  <TextInput
                    style={[styles.entrySubLabel, { color: theme.textMuted }]}
                    value={ad.label}
                    onChangeText={v => setAddresses(a => a.map((x, j) => j === i ? { ...x, label: v } : x))}
                    placeholder="label"
                    placeholderTextColor={theme.border}
                  />
                </View>
                <TouchableOpacity onPress={() => setAddresses(a => a.filter((_, j) => j !== i))} style={styles.deleteBtn}>
                  <X size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addRow}
              onPress={() => setAddresses(a => [...a, { label: 'default', number: '', street: '', city: '', region: '', post_code: '', country: '' }])}
            >
              <Plus size={16} color={theme.textMuted} />
              <Text style={[styles.addLabel, { color: theme.textMuted }]}>Add address</Text>
            </TouchableOpacity>
          </View>
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
                    <TextInput
                      style={[styles.entrySubLabel, { color: theme.textMuted }]}
                      value={sc.label}
                      onChangeText={v => setSocials(s => s.map((x, j) => j === i ? { ...x, label: v } : x))}
                      placeholder="label"
                      placeholderTextColor={theme.border}
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
              onPress={() => setSocials(s => [...s, { network: '', username: '', label: '' }])}
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

  // ── Status toggle — matches SettingsAppearanceSection
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ccc',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },

  // ── Groups / Relations
  emptyNote: {
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  smallChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  searchResults: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden' as const,
    marginTop: 4,
    marginBottom: 4,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
  },
  linkRow: {
    flexDirection: 'column' as const,
    alignItems: 'stretch' as const,
  },
  linkContactRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  linkSeparatorText: {
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
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
