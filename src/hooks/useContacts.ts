import { useState, useEffect, useCallback, useRef } from 'react';
import { buildGraph, shortestPath } from '../utils/graph';
import { ContactWithDistance, Contact, Group } from '../types';

const STORAGE_KEY = '@contacts_overrides';

interface TupperConfig {
  baseUri: string;
  token: string;
}

export const useContacts = (centerId: string, tupper: TupperConfig) => {
  const [contacts, setContacts] = useState<ContactWithDistance[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const rawContactsRef = useRef<Contact[]>([]);

  const computeAndSet = useCallback((raw: Contact[], cId: string) => {
    const graph = buildGraph(raw);
    const computed: ContactWithDistance[] = raw.map(c => {
      const result = shortestPath(graph, cId, c.identifier);
      return {
        ...c,
        distance: result ? result.distance : Infinity,
        relations: result ? result.relations : [],
        path: result ? result.path : [],
      };
    });
    setContacts(computed);
  }, []);

  useEffect(() => {
    if (!tupper.baseUri || !tupper.token) return;

    // Clear stale data immediately so a failed fetch doesn't leave old contacts visible
    setContacts([]);
    setGroups([]);
    rawContactsRef.current = [];
    setLoading(true);
    const load = async () => {
      try {
        const response = await fetch(`${tupper.baseUri}/contacts`, {
          headers: {
            Authorization: `Bearer ${tupper.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const base: Contact[] = Array.isArray(data) ? data : (data.contacts || []);
        const baseGroups: Group[] = Array.isArray(data) ? [] : (data.groups || []);

        rawContactsRef.current = base;
        setGroups(baseGroups);
        computeAndSet(base, centerId);
      } catch (err) {
        console.error('[useContacts] Failed to fetch contacts:', err);
      } finally {
        setLoading(false);
      }
    };

    setTimeout(load, 0);
  }, [centerId, tupper.baseUri, tupper.token, computeAndSet]);

  const saveContact = useCallback(async (contact: Contact) => {
    try {
      const response = await fetch(`${tupper.baseUri}/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tupper.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contact),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      console.error('[useContacts] Failed to save contact:', err);
    }

    const updated = [...rawContactsRef.current];
    const existingIdx = updated.findIndex(c => c.identifier === contact.identifier);
    if (existingIdx >= 0) updated[existingIdx] = contact;
    else updated.push(contact);
    rawContactsRef.current = updated;

    computeAndSet(updated, centerId);
  }, [centerId, tupper.baseUri, tupper.token, computeAndSet]);

  return { contacts, groups, loading, saveContact };
};
