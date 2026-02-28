import { useState, useEffect } from 'react';
import { buildGraph, shortestPath } from '../utils/graph';
import { ContactWithDistance, Contact, Group } from '../types';
import contactsData from '../../contacts.json';

export const useContacts = (centerId: string) => {
  const [contacts, setContacts] = useState<ContactWithDistance[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Process contacts when centerId changes
    const processContacts = () => {
      try {
        const data = contactsData as any;
        const rawContacts: Contact[] = Array.isArray(data) ? data : (data.contacts || []);
        const rawGroups: Group[] = Array.isArray(data) ? [] : (data.groups || []);
        
        const graph = buildGraph(rawContacts);

        const computedContacts: ContactWithDistance[] = rawContacts.map(c => {
          const result = shortestPath(graph, centerId, c.identifier);
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
  }, [centerId]);

  return { contacts, groups, loading };
};
