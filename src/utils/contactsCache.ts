import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact, Group } from '../types';

// Bump this whenever the Contact/Group schema changes to auto-invalidate stale caches.
const CACHE_VERSION = 1;

interface ContactsCache {
  version: number;
  /** Unix timestamp (ms) of when this cache was written. */
  timestamp: number;
  contacts: Contact[];
  groups: Group[];
}

/** Key is scoped per (centerId × baseUri) so switching servers never cross-contaminates. */
function buildKey(centerId: string, baseUri: string): string {
  return `contacts_cache::v${CACHE_VERSION}::${centerId}::${baseUri}`;
}

/**
 * Read the persisted contacts cache.
 * Returns `null` if nothing is stored, the data is unreadable, or the version doesn't match.
 */
export async function readContactsCache(
  centerId: string,
  baseUri: string,
): Promise<ContactsCache | null> {
  try {
    const raw = await AsyncStorage.getItem(buildKey(centerId, baseUri));
    if (!raw) return null;
    const parsed: ContactsCache = JSON.parse(raw);
    if (parsed.version !== CACHE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persist the contacts + groups to AsyncStorage.
 * Failures are swallowed — the cache is best-effort and must never break the app.
 */
export async function writeContactsCache(
  centerId: string,
  baseUri: string,
  contacts: Contact[],
  groups: Group[],
): Promise<void> {
  try {
    const cache: ContactsCache = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      contacts,
      groups,
    };
    await AsyncStorage.setItem(buildKey(centerId, baseUri), JSON.stringify(cache));
  } catch {
    // Silently ignore — storage might be full or unavailable.
  }
}

/** Remove the cache entry for a given (centerId, baseUri) pair. */
export async function clearContactsCache(
  centerId: string,
  baseUri: string,
): Promise<void> {
  try {
    await AsyncStorage.removeItem(buildKey(centerId, baseUri));
  } catch {
    // ignore
  }
}
