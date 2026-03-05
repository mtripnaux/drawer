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
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rawContactsRef = useRef<Contact[]>([]);

  const computeAndSet = useCallback((raw: Contact[], cId: string) => {
    const graph = buildGraph(raw);
    const computed: ContactWithDistance[] = raw.map((c, index) => {
      const result = shortestPath(graph, cId, c.identifier);
      return {
        ...c,
        distance: result ? result.distance : Infinity,
        relations: result ? result.relations : [],
        path: result ? result.path : [],
        addedIndex: index,
      };
    });
    setContacts(computed);
  }, []);

  const doFetch = useCallback(async (silent: boolean) => {
    if (!tupper.baseUri || !tupper.token) return;
    if (silent) {
      setRefetching(true);
    } else {
      setContacts([]);
      setGroups([]);
      rawContactsRef.current = [];
      setLoading(true);
    }
    setError(null);
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      if (silent) setRefetching(false);
      else setLoading(false);
    }
  }, [centerId, tupper.baseUri, tupper.token, computeAndSet]);

  const fetchFromServer = useCallback(() => doFetch(false), [doFetch]);
  const refetch = useCallback(() => doFetch(true), [doFetch]);

  useEffect(() => {
    setTimeout(fetchFromServer, 0);
  }, [fetchFromServer]);

  const saveContact = useCallback(async (contact: Contact) => {
    const isNew = !contact.identifier;
    const url = `${tupper.baseUri}/contacts`;

    const { identifier: _omit, ...contactWithoutId } = contact;
    const payload = isNew ? contactWithoutId : contact;

    let savedContact = contact;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tupper.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} — ${responseText}`);
      }

      if (isNew) {
        try {
          const returned = JSON.parse(responseText);
          const serverId: string = returned.identifier ?? returned.id ?? '';
          if (serverId) {
            savedContact = { ...contact, identifier: serverId };
          }
        } catch {
          console.warn('[saveContact] could not parse server response as JSON');
        }
      }
    } catch (err) {
      console.error('[saveContact] FAILED:', err);
    }

    const updated = [...rawContactsRef.current];
    const existingIdx = updated.findIndex(c => c.identifier === savedContact.identifier);
    if (existingIdx >= 0) updated[existingIdx] = savedContact;
    else updated.push(savedContact);
    rawContactsRef.current = updated;

    computeAndSet(updated, centerId);
  }, [centerId, tupper.baseUri, tupper.token, computeAndSet]);

  return { contacts, groups, loading, refetching, error, saveContact, refetch };
};
