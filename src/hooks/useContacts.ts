import { useState, useEffect, useCallback, useRef } from 'react';
import { buildGraph, shortestPath } from '../utils/graph';
import { ContactWithDistance, Contact, Group, Link, Relation } from '../types';
import { readContactsCache, writeContactsCache } from '../utils/contactsCache';

// ─── inverse-relation helpers ────────────────────────────────────────────────

const INVERSE_RELATION: Partial<Record<Relation, Relation>> = {
  Parent: 'Child',
  Child: 'Parent',
  Boss: 'Employee',
  Employee: 'Boss',
};

function inverseOf(relation: Relation): Relation {
  return INVERSE_RELATION[relation] ?? relation;
}

/**
 * After saving a contact (savedId), patch the `links` arrays of every other
 * contact that is referenced by the added/removed links so the graph stays
 * consistent locally before the next refetch.
 */
function applyInverseLinks(
  contacts: Contact[],
  savedId: string,
  addedLinks: Link[],
  removedLinks: Link[],
): Contact[] {
  return contacts.map(c => {
    const toAdd = addedLinks
      .filter(l => l.target === c.identifier)
      .map(l => ({ target: savedId, relation: inverseOf(l.relation) }));

    const toRemoveRelations = removedLinks
      .filter(l => l.target === c.identifier)
      .map(l => inverseOf(l.relation));

    if (toAdd.length === 0 && toRemoveRelations.length === 0) return c;

    let newLinks = (c.links ?? []).filter(
      l => !(l.target === savedId && toRemoveRelations.includes(l.relation)),
    );
    for (const link of toAdd) {
      const exists = newLinks.some(l => l.target === link.target && l.relation === link.relation);
      if (!exists) newLinks = [...newLinks, link];
    }
    return { ...c, links: newLinks };
  });
}

interface TupperConfig {
  baseUri: string;
  token: string;
  /** Must be true before the hook attempts any network or cache operations. */
  ready: boolean;
  relationWeights?: Record<string, number>;
}

export const useContacts = (centerId: string, tupper: TupperConfig) => {
  const [contacts, setContacts] = useState<ContactWithDistance[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Timestamp (ms) of the last successful network fetch. null = never fetched yet. */
  const [lastFetchDate, setLastFetchDate] = useState<number | null>(null);
  const rawContactsRef = useRef<Contact[]>([]);
  /** Mirror of the `groups` state, kept in sync so callbacks can read it without stale closures. */
  const groupsRef = useRef<Group[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const computeAndSet = useCallback((raw: Contact[], cId: string) => {
    const graph = buildGraph(raw);
    const computed: ContactWithDistance[] = raw.map((c, index) => {
      const result = shortestPath(graph, cId, c.identifier, tupper.relationWeights);
      return {
        ...c,
        distance: result ? result.distance : Infinity,
        relations: result ? result.relations : [],
        path: result ? result.path : [],
        addedIndex: index,
      };
    });
    setContacts(computed);
  }, [tupper.relationWeights]);

  const doFetch = useCallback(async (silent: boolean) => {
    if (!tupper.baseUri || !tupper.token) return;

    // Cancel any previous in-flight request to avoid stale errors overwriting a clean state
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const rawBase: Contact[] = Array.isArray(data) ? data : (data.contacts || []);
      const baseGroups: Group[] = Array.isArray(data) ? [] : (data.groups || []);

      // Normalise: if server sends a single `address` object, fold it into `addresses[]`
      const base: Contact[] = rawBase.map(c => {
        if (!c.address) return c;
        const { address, ...rest } = c;
        return {
          ...rest,
          addresses: rest.addresses?.length ? rest.addresses : [address],
        };
      });
      rawContactsRef.current = base;
      groupsRef.current = baseGroups;
      setGroups(baseGroups);
      computeAndSet(base, centerId);
      setLastFetchDate(Date.now());
      // Persist to local cache so the next startup is instant.
      writeContactsCache(centerId, tupper.baseUri, base, baseGroups);
    } catch (err) {
      // Ignore errors from requests that were intentionally aborted
      if (err instanceof Error && err.name === 'AbortError') return;
      // Don't surface errors from background refreshes — cached data is still displayed.
      if (!silent) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      }
    } finally {
      // Skip state updates for requests that were superseded by a newer one
      if (!controller.signal.aborted) {
        if (silent) setRefetching(false);
        else setLoading(false);
      }
    }
  }, [centerId, tupper.baseUri, tupper.token, computeAndSet]);

  const refetch = useCallback(() => doFetch(true), [doFetch]);

  /**
   * Keep a ref to the latest doFetch so the initial-load effect can call it
   * without listing it as a dependency. This prevents the effect from re-running
   * every time the config (token, etc.) changes while keeping the call up-to-date.
   */
  const doFetchRef = useRef(doFetch);
  useEffect(() => { doFetchRef.current = doFetch; }, [doFetch]);

  useEffect(() => {
    if (!tupper.ready) return;
    let cancelled = false;

    (async () => {
      const cached = readContactsCache(centerId, tupper.baseUri);
      // If this effect was cleaned up while we were reading the cache, bail out.
      if (cancelled) return;

      if (cached && cached.contacts.length > 0) {
        // Show cached data immediately — user sees content with zero network wait.
        rawContactsRef.current = cached.contacts;
        groupsRef.current = cached.groups;
        setGroups(cached.groups);
        computeAndSet(cached.contacts, centerId);
        setLoading(false);
        // Silently refresh in the background.
        setTimeout(() => { if (!cancelled) doFetchRef.current(true); }, 0);
      } else {
        // No cache — normal full loading flow.
        setTimeout(() => { if (!cancelled) doFetchRef.current(false); }, 0);
      }
    })();

    return () => {
      cancelled = true;
      // Abort any in-flight network request so stale responses never update state.
      abortControllerRef.current?.abort();
    };
  // doFetch intentionally excluded: we use doFetchRef so this effect only re-runs
  // when the actual server endpoint changes (centerId / baseUri), not on every
  // config change (token, theme, etc.) that would cause a spurious double-fetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerId, tupper.baseUri, tupper.ready, computeAndSet]);

  const saveContact = useCallback(async (contact: Contact) => {
    setSaving(true);
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
          const serverId: string = typeof returned === 'string'
            ? returned
            : (returned.identifier ?? returned.id ?? '');
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

    // Compute added / removed links compared to the previous state of this contact
    const oldContact = rawContactsRef.current.find(c => c.identifier === savedContact.identifier);
    const oldLinks: Link[] = (oldContact?.links ?? []) as Link[];
    const newLinks: Link[] = (savedContact.links ?? []) as Link[];

    const addedLinks = newLinks.filter(
      nl => !oldLinks.some(ol => ol.target === nl.target && ol.relation === nl.relation),
    );
    const removedLinks = oldLinks.filter(
      ol => !newLinks.some(nl => nl.target === ol.target && nl.relation === ol.relation),
    );

    let updated = [...rawContactsRef.current];
    const existingIdx = updated.findIndex(c => c.identifier === savedContact.identifier);
    if (existingIdx >= 0) updated[existingIdx] = savedContact;
    else updated.push(savedContact);

    // Patch inverse links on every related contact so the graph is consistent locally
    updated = applyInverseLinks(updated, savedContact.identifier, addedLinks, removedLinks);

    rawContactsRef.current = updated;
    // Defer heavy graph recomputation so the JS thread stays free for UI interactions
    setTimeout(() => {
      computeAndSet(updated, centerId);
      setSaving(false);
      // Keep the local cache up-to-date after every save.
      writeContactsCache(centerId, tupper.baseUri, updated, groupsRef.current);
    }, 0);
  }, [centerId, tupper.baseUri, tupper.token, computeAndSet]);

  return { contacts, groups, loading, refetching, saving, error, lastFetchDate, saveContact, refetch };
};
