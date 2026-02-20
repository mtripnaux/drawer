import { useState, useEffect } from 'react';
import { buildGraph, shortestPath, Contact } from '../utils/graph';
import { ContactWithDistance } from '../types';
import { CENTER_ID } from '../constants/config';
import contactsData from '../../contacts.json';

export const useContacts = () => {
  const [contacts, setContacts] = useState<ContactWithDistance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Process contacts on mount
    const processContacts = () => {
      try {
        const data = contactsData as unknown as Contact[];
        const graph = buildGraph(data);

        const computedContacts: ContactWithDistance[] = data.map(c => {
          const result = shortestPath(graph, CENTER_ID, c.identifier);
          return {
            ...c,
            distance: result ? result.distance : Infinity,
            relations: result ? result.relations : [],
            path: result ? result.path : []
          };
        });

        setContacts(computedContacts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Defer processing slightly to allow initial render
    setTimeout(processContacts, 0);
  }, []);

  return { contacts, loading };
};
