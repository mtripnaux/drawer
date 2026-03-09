import { File, Paths } from 'expo-file-system';
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

/**
 * Build a File reference scoped to (centerId × baseUri).
 * Stored in the document directory so the OS never evicts it.
 */
function buildFile(centerId: string, baseUri: string): File {
  const safeKey = `${centerId}_${baseUri}`
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 200);
  return new File(Paths.document, `contacts_cache_v${CACHE_VERSION}_${safeKey}.json`);
}

/**
 * Read the persisted contacts cache synchronously.
 * Returns `null` if nothing is stored, the file is unreadable, or the version doesn't match.
 */
export function readContactsCache(
  centerId: string,
  baseUri: string,
): ContactsCache | null {
  try {
    const file = buildFile(centerId, baseUri);
    if (!file.exists) return null;
    const parsed: ContactsCache = JSON.parse(file.textSync());
    if (parsed.version !== CACHE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persist the contacts + groups to the local filesystem synchronously.
 * Failures are swallowed — the cache is best-effort and must never break the app.
 */
export function writeContactsCache(
  centerId: string,
  baseUri: string,
  contacts: Contact[],
  groups: Group[],
): void {
  try {
    const cache: ContactsCache = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      contacts,
      groups,
    };
    const file = buildFile(centerId, baseUri);
    file.create({ intermediates: true, overwrite: true });
    file.write(JSON.stringify(cache));
  } catch {
    // Silently ignore — storage might be full or unavailable.
  }
}

/** Remove the cache entry for a given (centerId, baseUri) pair. */
export function clearContactsCache(
  centerId: string,
  baseUri: string,
): void {
  try {
    const file = buildFile(centerId, baseUri);
    if (file.exists) file.delete();
  } catch {
    // ignore
  }
}

