import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useConfig } from '../contexts/ConfigContext';
import { useContacts } from '../contexts/ContactsContext';
import { useNavigation } from '../navigation/NavigationContext';
import { LIGHT_THEME, DARK_THEME, THEME } from '../constants/theme';
import { ContactWithDistance } from '../types';
import { getPhoneNumber } from '../utils/format';
import { buildGraph, RELATION_WEIGHTS } from '../utils/graph';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileActions } from '../components/profile/ProfileActions';
import { ProfileContactInfo } from '../components/profile/ProfileContactInfo';
import { ProfileGroups } from '../components/profile/ProfileGroups';
import { ProfileRelationshipPath } from '../components/profile/ProfileRelationshipPath';
import { ProfileRelatedContacts, RelatedContact } from '../components/profile/ProfileRelatedContacts';

interface ProfileScreenProps {
  contact: ContactWithDistance;
}

export const ProfileScreen = ({ contact }: ProfileScreenProps) => {
  const { config } = useConfig();
  const { contacts, groups, contactMap, formatName } = useContacts();
  const { pop, push } = useNavigation();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);

  const getSocialUsername = (network: string) =>
    contact.socials?.find(s => s.network.toLowerCase() === network.toLowerCase())?.username;

  const instagram = getSocialUsername('instagram');
  const twitter = getSocialUsername('twitter');
  const facebook = getSocialUsername('facebook');
  const linkedin = getSocialUsername('linkedin');

  const handleCall = () => {
    if (!contact.phones?.length) return;
    Linking.openURL(`tel:${getPhoneNumber(contact.phones[0])}`);
  };

  const handleSMS = () => {
    if (!contact.phones?.length) return;
    Linking.openURL(`sms:${getPhoneNumber(contact.phones[0])}`);
  };

  const handleSocial = (network: string, username: string) => {
    const urls: Record<string, string> = {
      instagram: `https://instagram.com/${username}`,
      twitter: `https://twitter.com/${username}`,
      facebook: `https://facebook.com/${username}`,
      linkedin: `https://linkedin.com/in/${username}`,
    };
    const url = urls[network.toLowerCase()];
    if (url) Linking.openURL(url);
  };

  const relatedContacts = useMemo(() => {
    const graph = buildGraph(contacts);
    const neighbors = graph.get(contact.identifier) || [];
    const neighborData = neighbors
      .map(edge => {
        const c = contacts.find(nc => nc.identifier === edge.target);
        return { contact: c, weight: RELATION_WEIGHTS[edge.relation] || 1, relation: edge.relation };
      })
      .filter(n => !!n.contact) as { contact: ContactWithDistance; weight: number; relation: string }[];
    neighborData.sort((a, b) => a.weight - b.weight);
    const unique: (ContactWithDistance & { relation: string })[] = [];
    const seen = new Set<string>();
    for (const item of neighborData) {
      if (!seen.has(item.contact.identifier)) {
        seen.add(item.contact.identifier);
        unique.push({ ...item.contact, relation: item.relation });
      }
    }
    return unique;
  }, [contact.identifier, contacts]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={pop}
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: 20, color: theme.text }]}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.profileContent}>
        <ProfileHeader contact={contact} formatName={formatName} theme={theme} />

        <ProfileActions
          hasPhone={!!contact.phones?.length}
          onCall={handleCall}
          onSMS={handleSMS}
          instagram={instagram}
          twitter={twitter}
          facebook={facebook}
          linkedin={linkedin}
          onSocial={handleSocial}
          theme={theme}
        />

        <ProfileContactInfo contact={contact} config={config} theme={theme} />

        <ProfileGroups contact={contact} groups={groups} theme={theme} />

        <ProfileRelationshipPath
          contact={contact}
          allContacts={contacts}
          contactMap={contactMap}
          config={config}
          onSelectContact={(c) => push({ name: 'Profile', params: { contact: c } })}
          theme={theme}
        />

        <ProfileRelatedContacts
          relatedContacts={relatedContacts}
          onSelectContact={(c) => push({ name: 'Profile', params: { contact: c } })}
          formatName={formatName}
          theme={theme}
        />
      </ScrollView>
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
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  profileContent: {
    paddingBottom: 40,
  },
});

