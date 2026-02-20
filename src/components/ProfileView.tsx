import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { ChevronLeft, Phone, Calendar, MessageSquare } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { CENTER_ID } from '../constants/config';
import { ContactWithDistance } from '../types';
import { getPhoneNumber, formatDate, getInitials } from '../utils/format';
import { Contact } from '../utils/graph';

interface ProfileViewProps {
  contact: ContactWithDistance;
  onClose: () => void;
  contactMap: Map<string, string>;
  formatName: (id: Contact['identity']) => string;
}

export const ProfileView = ({ contact, onClose, contactMap, formatName }: ProfileViewProps) => {
  const hasPhone = contact.phones && contact.phones?.length > 0;

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

  const phoneNumbers = contact.phones?.map(p => getPhoneNumber(p)).join(', ');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
          <ChevronLeft size={20} color={THEME.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: 20 }]}>Profile</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.profileContent}>
        {/* Avatar Section */}
        <View style={styles.profileHeader}>
          <View style={[styles.largeAvatar, { backgroundColor: contact.identity.gender === 'male' ? '#eff6ff' : '#fdf2f8' }]}>
            <Text style={[styles.largeAvatarText, { color: contact.identity.gender === 'male' ? '#1d4ed8' : '#be185d' }]}>
              {getInitials(contact.identity.first_name, contact.identity.last_name)}
            </Text>
          </View>
          <Text style={styles.profileName}>{formatName(contact.identity)}</Text>
          <Text style={styles.relation}>
            {contact.distance === Infinity ? 'Unreachable' : 
            contact.distance <= 1 ? 'Direct Connection' : 
            `${Math.round(contact.distance * 10) / 10} degrees away`}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, !hasPhone && styles.actionButtonDisabled]} 
            onPress={hasPhone ? handleCall : undefined}
            disabled={!hasPhone}
          >
            <View style={[styles.iconCircle, !hasPhone && { backgroundColor: THEME.surface }]}>
              <Phone size={24} color={hasPhone ? '#fff' : THEME.textMuted} />
            </View>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, !hasPhone && styles.actionButtonDisabled]} 
            onPress={hasPhone ? handleSMS : undefined}
            disabled={!hasPhone}
          >
            <View style={[styles.iconCircle, !hasPhone && { backgroundColor: THEME.surface }]}>
              <MessageSquare size={24} color={hasPhone ? '#fff' : THEME.textMuted} />
            </View>
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Info</Text>
          
          {!hasPhone && !contact.identity.birth_date && (
            <Text style={styles.infoValue}>No contact info available</Text>
          )}

          {hasPhone && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Phone size={20} color={THEME.textMuted} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{phoneNumbers}</Text>
              </View>
            </View>
          )}
          
          {contact.identity.birth_date && (
             <View style={styles.infoRow}>
               <View style={styles.infoIconContainer}>
                 <Calendar size={20} color={THEME.textMuted} />
               </View>
               <View>
                 <Text style={styles.infoLabel}>Born</Text>
                 <Text style={styles.infoValue}>
                   {formatDate(contact.identity.birth_date)}
                 </Text>
               </View>
             </View>
          )}
        </View>

        {/* Relationship Path */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relationship Path</Text>
          <View style={styles.pathContainer}>
             <View style={styles.pathStep}>
                <View style={styles.stepDot} />
                {(contact.relations.length > 0) && <View style={styles.stepLine} />}
                <Text style={styles.stepText}>
                     Me <Text style={{ color: THEME.textMuted }}>({contactMap.get(CENTER_ID) || 'Me'})</Text>
                </Text>
             </View>

             {contact.relations.length > 0 && 
               contact.relations.map((rel, index) => {
                 const relatedPersonId = contact.path && contact.path.length > index + 1 
                   ? contact.path[index + 1] 
                   : null;
                 const name = relatedPersonId ? (contactMap.get(relatedPersonId) || 'Unknown') : '';
                 
                 return (
                 <View key={index} style={styles.pathStep}>
                    <View style={styles.stepDot} />
                    {index < contact.relations.length - 1 && <View style={styles.stepLine} />}
                    <Text style={styles.stepText}>
                      {rel} <Text style={{ color: THEME.textMuted }}>({name})</Text>
                    </Text>
                 </View>
                 );
               })
             }
             {contact.relations.length === 0 && contact.distance !== 0 && (
                <Text style={styles.infoValue}>No path data available</Text>
             )}
          </View>
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
    paddingBottom: 40,
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
});
