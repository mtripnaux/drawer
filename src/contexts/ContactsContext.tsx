import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useContacts as useContactsLoader } from '../hooks/useContacts';
import { useConfig } from './ConfigContext';
import { formatNameWithConfig } from '../utils/format';
import { ContactWithDistance, Group } from '../types';
import { Contact } from '../types';

interface ContactsContextType {
  contacts: ContactWithDistance[];
  groups: Group[];
  loading: boolean;
  contactMap: Map<string, string>;
  formatName: (identity: Contact['identity']) => string;
}

const ContactsContext = createContext<ContactsContextType | null>(null);

export const ContactsProvider = ({ children }: { children: React.ReactNode }) => {
  const { config } = useConfig();
  const { contacts, groups, loading } = useContactsLoader(config.centerId);

  const formatName = useCallback(
    (identity: Contact['identity']) => formatNameWithConfig(identity, config),
    [config]
  );

  const contactMap = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach(c => map.set(c.identifier, formatName(c.identity)));
    return map;
  }, [contacts, formatName]);

  return (
    <ContactsContext.Provider value={{ contacts, groups, loading, contactMap, formatName }}>
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = (): ContactsContextType => {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts must be used within ContactsProvider');
  return ctx;
};
