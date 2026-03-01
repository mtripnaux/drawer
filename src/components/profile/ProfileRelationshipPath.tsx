import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { UserConfig } from '../../constants/config';
import { ContactWithDistance } from '../../types';

type ThemeType = typeof THEME;

interface ProfileRelationshipPathProps {
  contact: ContactWithDistance;
  allContacts: ContactWithDistance[];
  contactMap: Map<string, string>;
  config: UserConfig;
  onSelectContact: (c: ContactWithDistance) => void;
  theme: ThemeType;
}

export const ProfileRelationshipPath = ({
  contact,
  allContacts,
  contactMap,
  config,
  onSelectContact,
  theme,
}: ProfileRelationshipPathProps) => {
  if (contact.distance === Infinity || contact.distance === 0) return null;

  return (
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
          {contact.relations.length > 0 && <View style={[styles.stepLine, { backgroundColor: theme.border }]} />}
          <Text style={[styles.stepText, { color: theme.text }]}>
            Me <Text style={{ color: theme.textMuted }}>({contactMap.get(config.centerId) || 'Me'})</Text>
          </Text>
        </TouchableOpacity>

        {contact.relations.length > 0 &&
          contact.relations.map((rel, index) => {
            const relatedPersonId =
              contact.path && contact.path.length > index + 1 ? contact.path[index + 1] : null;
            const name = relatedPersonId ? contactMap.get(relatedPersonId) || 'Unknown' : '';
            const relatedContact = relatedPersonId
              ? allContacts.find(ac => ac.identifier === relatedPersonId)
              : null;

            return (
              <TouchableOpacity
                key={index}
                style={styles.pathStep}
                onPress={() => { if (relatedContact) onSelectContact(relatedContact); }}
                disabled={!relatedContact}
              >
                <View style={[styles.stepDot, { backgroundColor: theme.primary }]} />
                {index < contact.relations.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
                )}
                <Text style={[styles.stepText, { color: theme.text }]}>
                  {rel} <Text style={{ color: theme.textMuted }}>({name})</Text>
                </Text>
              </TouchableOpacity>
            );
          })}

        {contact.relations.length === 0 && contact.distance !== 0 && (
          <Text style={[styles.stepText, { color: theme.text }]}>No path data available</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    top: 25,
    width: 1,
    height: 15,
    backgroundColor: THEME.border,
  },
  stepText: {
    fontSize: 16,
    color: THEME.text,
  },
});
