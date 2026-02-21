import { useState, useEffect } from 'react';
import { buildGraph, shortestPath } from '../utils/graph';
import { ContactWithDistance, Contact, Group } from '../types';
import { CENTER_ID } from '../constants/config';
import contactsData from '../../contacts.json';

export const useContacts = () => {
  const [contacts, setContacts] = useState<ContactWithDistance[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Process contacts on mount
    const processContacts = () => {
      try {
        const data = contactsData as any;
        const rawContacts: Contact[] = Array.isArray(data) ? data : (data.contacts || []);
        const rawGroups: Group[] = Array.isArray(data) ? [] : (data.groups || []);
        
        const graph = buildGraph(rawContacts);

        const computedContacts: ContactWithDistance[] = rawContacts.map(c => {
          const result = shortestPath(graph, CENTER_ID, c.identifier);
          return {
            ...c,
            distance: result ? result.distance : Infinity,
            relations: result ? result.relations : [],
            path: result ? result.path : []
          };
        });

        setContacts(computedContacts);
        setGroups(rawGroups);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Defer processing slightly to allow initial render
    setTimeout(processContacts, 0);
  }, []);

  return { contacts, groups, loading };
};
