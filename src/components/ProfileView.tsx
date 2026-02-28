import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { ChevronLeft, Phone, Calendar, MessageSquare, Users, Instagram, Twitter, Facebook, Linkedin, Mail } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { UserConfig } from '../constants/config';
import { ContactWithDistance, Group, Contact } from '../types';
import { getPhoneNumber, formatDate, getInitials } from '../utils/format';
import { buildGraph, RELATION_WEIGHTS } from '../utils/graph';

type ThemeType = typeof THEME;

interface ProfileViewProps {
  contact: ContactWithDistance;
  onClose: () => void;
  contactMap: Map<string, string>;
  formatName: (id: Contact['identity']) => string;
  groups: Group[];
  allContacts: ContactWithDistance[];
  onSelectContact: (contact: ContactWithDistance) => void;
  config: UserConfig;
  theme: ThemeType;
}

const NestedGroups = ({ groups, contactGroupIds, level = 0, theme }: { groups: Group[], contactGroupIds: string[], level?: number, theme: ThemeType }) => {
  const isMatch = (group: Group): boolean => {
    if (contactGroupIds.includes(group.identifier)) return true;
    return !!group.subgroups?.some(isMatch);
  };

  return (
    <View style={{ marginLeft: level * 16 }}>
      {groups.map((group) => {
        const isActive = isMatch(group);

        if (!isActive) return null;

        return (
          <View key={group.identifier} style={styles.groupItem}>
            <View style={styles.groupHeader}>
              <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
              <Text style={[styles.groupName, { color: theme.text }]}>
                {group.name}
              </Text>
            </View>
            {group.subgroups && (
              <NestedGroups 
                groups={group.subgroups} 
                contactGroupIds={contactGroupIds} 
                level={level + 1} 
                theme={theme}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

export const ProfileView = ({ contact, onClose, contactMap, formatName, groups, allContacts, onSelectContact, config, theme }: ProfileViewProps) => {
  const hasPhone = contact.phones && contact.phones?.length > 0;
  const hasEmail = contact.emails && contact.emails?.length > 0;


  const handleCall = () => {
    if (!contact.phones || contact.phones.length === 0) return;
    const phone = contact.phones[0];
    const phoneNumber = getPhoneNumber(phone);
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleSMS = () => {
    if (!contact.phones || contact.phones.length === 0) return;
    const phone = contact.phones[0];
    const phoneNumber = getPhoneNumber(phone);
    Linking.openURL(`sms:${phoneNumber}`);
  };

  const handleSocial = (network: string, username: string) => {
    let url = '';
    switch (network.toLowerCase()) {
      case 'instagram':
        url = `https://instagram.com/${username}`;
        break;
      case 'twitter':
        url = `https://twitter.com/${username}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${username}`;
        break;
      case 'linkedin':
        url = `https://linkedin.com/in/${username}`;
        break;
    }
    if (url) Linking.openURL(url);
  };

  const getSocialUsername = (network: string) => {
    return contact.socials?.find(s => s.network.toLowerCase() === network.toLowerCase())?.username;
  };

  const instagram = getSocialUsername('instagram');
  const twitter = getSocialUsername('twitter');
  const facebook = getSocialUsername('facebook');
  const linkedin = getSocialUsername('linkedin');

  const relatedContacts = useMemo(() => {
    const graph = buildGraph(allContacts);
    const neighbors = graph.get(contact.identifier) || [];
    
    // Find contact object for each neighbor and associate the min weight
    const neighborData = neighbors.map(edge => {
      const c = allContacts.find(nc => nc.identifier === edge.target);
      const weight = RELATION_WEIGHTS[edge.relation] || 1;
      return { contact: c, weight, relation: edge.relation };
    }).filter(n => !!n.contact) as { contact: ContactWithDistance, weight: number, relation: string }[];
    
    // Sort by weight
    neighborData.sort((a, b) => a.weight - b.weight);
    
    // Get unique contacts (in case of multiple relations)
    const uniqueContacts: (ContactWithDistance & { relation: string })[] = [];
    const seen = new Set<string>();
    for (const item of neighborData) {
      if (!seen.has(item.contact.identifier)) {
        seen.add(item.contact.identifier);
        uniqueContacts.push({ ...item.contact, relation: item.relation });
      }
    }
    
    return uniqueContacts;
  }, [contact.identifier, allContacts]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: 20, color: theme.text }]}>Profile</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.profileContent}>
        {/* Avatar Section */}
        <View style={[styles.profileHeader, { borderBottomColor: theme.border }]}>
          <View style={[styles.largeAvatar, { 
            backgroundColor: contact.identity.gender === 'male' || contact.identity.gender === 'Male' ? '#eff6ff' : 
                            contact.identity.gender === 'female' || contact.identity.gender === 'Female' ? '#fdf2f8' : theme.surface 
          }]}>
            <Text style={[styles.largeAvatarText, { 
              color: contact.identity.gender === 'male' || contact.identity.gender === 'Male' ? '#1d4ed8' : 
                     contact.identity.gender === 'female' || contact.identity.gender === 'Female' ? '#be185d' : theme.textMuted 
            }]}>
              {getInitials(contact.identity.first_name || '?', contact.identity.last_name || '?')}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: theme.text }]}>{formatName(contact.identity)}</Text>
          <Text style={[styles.relation, { color: theme.textMuted }]}>
            {contact.distance === Infinity ? 'Unreachable' : 
            contact.distance <= 1 ? 'Direct Connection' : 
            `${Math.round(contact.distance * 10) / 10} degrees away`}
          </Text>
        </View>



        {/* Action Buttons */}
        <View style={[styles.actionButtons, { borderBottomColor: theme.border }]}>
          <TouchableOpacity // call
            style={[styles.actionButton, !hasPhone && styles.actionButtonDisabled]} 
            onPress={hasPhone ? handleCall : undefined}
            disabled={!hasPhone}
          >
            <View style={[styles.iconCircle, !hasPhone ? { backgroundColor: theme.surface } : { backgroundColor: theme.primary }]}>
              <Phone size={24} color={hasPhone ? theme.primaryForeground : theme.textMuted} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity // message
            style={[styles.actionButton, !hasPhone && styles.actionButtonDisabled]} 
            onPress={hasPhone ? handleSMS : undefined}
            disabled={!hasPhone}
          >
            <View style={[styles.iconCircle, !hasPhone ? { backgroundColor: theme.surface } : { backgroundColor: theme.primary }]}>
              <MessageSquare size={24} color={hasPhone ? theme.primaryForeground : theme.textMuted} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity // instagram
            style={[styles.actionButton, !instagram && styles.actionButtonDisabled]} 
            onPress={instagram ? () => handleSocial('instagram', instagram) : undefined}
            disabled={!instagram}
          >
            <View style={[styles.iconCircle, !instagram ? { backgroundColor: theme.surface } : { backgroundColor: theme.primary }]}>
              <Instagram size={24} color={instagram ? theme.primaryForeground : theme.textMuted} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity // facebook
            style={[styles.actionButton, !facebook && styles.actionButtonDisabled]} 
            onPress={facebook ? () => handleSocial('facebook', facebook) : undefined}
            disabled={!facebook}
          >
            <View style={[styles.iconCircle, !facebook ? { backgroundColor: theme.surface } : { backgroundColor: theme.primary }]}>
              <Facebook size={24} color={facebook ? theme.primaryForeground : theme.textMuted} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity // linkedin
            style={[styles.actionButton, !linkedin && styles.actionButtonDisabled]} 
            onPress={linkedin ? () => handleSocial('linkedin', linkedin) : undefined}
            disabled={!linkedin}
          >
            <View style={[styles.iconCircle, !linkedin ? { backgroundColor: theme.surface } : { backgroundColor: theme.primary }]}>
              <Linkedin size={24} color={linkedin ? theme.primaryForeground : theme.textMuted} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>LinkedIn</Text>
          </TouchableOpacity>

          <TouchableOpacity // twitter
            style={[styles.actionButton, !twitter && styles.actionButtonDisabled]} 
            onPress={twitter ? () => handleSocial('twitter', twitter) : undefined}
            disabled={!twitter}
          >
            <View style={[styles.iconCircle, !twitter ? { backgroundColor: theme.surface } : { backgroundColor: theme.primary }]}>
              <Twitter size={24} color={twitter ? theme.primaryForeground : theme.textMuted} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>Twitter</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={[styles.section, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Informations</Text>
          
          {!hasPhone && !hasEmail && !contact.identity.birth_date && (
            <Text style={[styles.infoValue, { color: theme.text }]}>No contact info available.</Text>
          )}

          {hasPhone && contact.phones?.map((phone, index) => (
            <View key={`phone-${index}`} style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Phone size={20} color={theme.textMuted} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                  Phone {phone.label && phone.label !== 'default' && (
                    <Text style={{ color: theme.textMuted }}>({phone.label})</Text>
                  )}
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{getPhoneNumber(phone)}</Text>
              </View>
            </View>
          ))}

          {hasEmail && contact.emails?.map((email, index) => (
            <View key={`email-${index}`} style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Mail size={20} color={theme.textMuted} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                  Email {email.label && email.label !== 'default' && (
                    <Text style={{ color: theme.textMuted }}>({email.label})</Text>
                  )}
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{email.address}</Text>
              </View>
            </View>
          ))}
          
          {contact.identity.birth_date && (
             <View style={styles.infoRow}>
               <View style={styles.infoIconContainer}>
                 <Calendar size={20} color={theme.textMuted} />
               </View>
               <View>
                 <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Born</Text>
                 <Text style={[styles.infoValue, { color: theme.text }]}>
                   {formatDate(contact.identity.birth_date, config)}
                 </Text>
               </View>
             </View>
          )}
        </View>

        {/* Groups */}
        {contact.groups && contact.groups.length > 0 && (
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Groups and Subgroups</Text>
            <NestedGroups groups={groups} contactGroupIds={contact.groups} theme={theme} />
          </View>
        )}

        {/* Relationship Path */}
        <View style={[styles.section, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Relationship Path</Text>
          <View style={styles.pathContainer}>
             <TouchableOpacity
               style={styles.pathStep}
               onPress={() => {
                 const c = allContacts.find(ac => ac.identifier === config.centerId);
                 if (c) onSelectContact(c);
               }}
             >
                <View style={[styles.stepDot, { backgroundColor: theme.primary }]} />
                {(contact.relations.length > 0) && <View style={[styles.stepLine, { backgroundColor: theme.border }]} />}
                <Text style={[styles.stepText, { color: theme.text }]}>
                     Me <Text style={{ color: theme.textMuted }}>({contactMap.get(config.centerId) || 'Me'})</Text>
                </Text>
             </TouchableOpacity>

             {contact.relations.length > 0 && 
               contact.relations.map((rel, index) => {
                 const relatedPersonId = contact.path && contact.path.length > index + 1 
                   ? contact.path[index + 1] 
                   : null;
                 const name = relatedPersonId ? (contactMap.get(relatedPersonId) || 'Unknown') : '';
                 const relatedContact = relatedPersonId ? allContacts.find(ac => ac.identifier === relatedPersonId) : null;
                 
                 return (
                 <TouchableOpacity
                   key={index}
                   style={styles.pathStep}
                   onPress={() => { if (relatedContact) onSelectContact(relatedContact); }}
                   disabled={!relatedContact}
                 >
                    <View style={[styles.stepDot, { backgroundColor: theme.primary }]} />
                    {index < contact.relations.length - 1 && <View style={[styles.stepLine, { backgroundColor: theme.border }]} />}
                    <Text style={[styles.stepText, { color: theme.text }]}>
                      {rel} <Text style={{ color: theme.textMuted }}>({name})</Text>
                    </Text>
                 </TouchableOpacity>
                 );
               })
             }
             {contact.relations.length === 0 && contact.distance !== 0 && (
                <Text style={[styles.infoValue, { color: theme.text }]}>No path data available</Text>
             )}
          </View>
        </View>

        {/* Related Contacts */}
        <View style={[styles.section, { borderBottomWidth: 0 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Related Contacts</Text>
          {relatedContacts.length > 0 ? (
            <View style={styles.relatedList}>
              {relatedContacts.map((rc) => (
                <TouchableOpacity 
                  key={rc.identifier} 
                  style={styles.relatedListItem}
                  onPress={() => onSelectContact(rc)}
                >
                  <View style={[styles.smallAvatar, { 
                    backgroundColor: rc.identity.gender === 'male' || rc.identity.gender === 'Male' ? '#eff6ff' : 
                                    rc.identity.gender === 'female' || rc.identity.gender === 'Female' ? '#fdf2f8' : theme.surface 
                  }]}>
                    <Text style={[styles.smallAvatarText, { 
                      color: rc.identity.gender === 'male' || rc.identity.gender === 'Male' ? '#1d4ed8' : 
                             rc.identity.gender === 'female' || rc.identity.gender === 'Female' ? '#be185d' : theme.textMuted 
                    }]}>
                      {getInitials(rc.identity.first_name || '?', rc.identity.last_name || '?')}
                    </Text>
                  </View>
                  <Text style={[styles.relatedName, { color: theme.text }]} numberOfLines={1}>
                    {formatName(rc.identity)} <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '400' }}>({rc.relation})</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={[styles.infoValue, { color: theme.text }]}>No related contacts available.</Text>
          )}
        </View>

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
    paddingBottom: 0,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  largeAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  largeAvatarText: {
    fontSize: 32,
    fontWeight: '600',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  relation: {
    fontSize: 13,
    color: THEME.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: THEME.text,
    fontWeight: '500',
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: THEME.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: THEME.text,
  },
  groupItem: {
    marginVertical: 0,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.primary,
    marginRight: 10,
  },
  groupName: {
    fontSize: 15,
    color: THEME.text
  },
  pathContainer: {
    marginLeft: 8,
  },
  pathStep: {
    flexDirection: 'row', 
    alignItems: 'center',
    height: 32,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.primary,
    marginRight: 12,
    zIndex: 1,
  },
  stepLine: {
    position: 'absolute',
    left: 3.5,
    top: 8,
    width: 1,
    height: 32,
    backgroundColor: THEME.border,
  },
  stepText: {
    fontSize: 16,
    color: THEME.text,
  },
  relatedList: {
    marginTop: 8,
    gap: 9,
  },
  relatedListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
  },
  smallAvatar: {
    width: 25,
    height: 25,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  smallAvatarText: {
    fontSize: 9,
    fontWeight: '600',
  },
  relatedName: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.text,
    marginLeft: 12,
  },
});
