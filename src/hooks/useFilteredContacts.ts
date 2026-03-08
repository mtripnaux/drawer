import { useMemo } from 'react';
import { ContactWithDistance, Group } from '../types';
import { UserConfig } from '../constants/config';
import { Contact } from '../types';
import { normalizeSearch } from '../utils/format';

export const useFilteredContacts = (
  contacts: ContactWithDistance[],
  groups: Group[],
  config: UserConfig,
  formatName: (identity: Contact['identity']) => string,
  searchQuery: string,
  activeTab: string,
  sortOrder: 'asc' | 'desc'
) => {
  return useMemo(() => {
    let result = contacts;

    if (!config.showDeceasedPeople && !searchQuery) {
      result = result.filter(c => c.identity.is_alive !== false);
    }

    if (config.hideContactsWithoutPhone && !searchQuery) {
      result = result.filter(c => c.phones && c.phones.length > 0);
    }

    if (searchQuery) {
      const normalizedQuery = normalizeSearch(searchQuery);
      result = result.filter(c =>
        normalizeSearch(formatName(c.identity)).includes(normalizedQuery)
      );
    }

    const coreFamilyTypes = ['Sibling', 'Parent', 'Child', 'Half-Sibling'];

    if (activeTab === 'Family') {
      result = result.filter(c => {
        if (c.identifier === config.centerId) return true;
        if (c.distance === Infinity || c.relations.length === 0) return false;
        for (let i = 0; i < c.relations.length; i++) {
          const rel = c.relations[i];
          const isLast = i === c.relations.length - 1;
          if (coreFamilyTypes.includes(rel)) continue;
          if (rel === 'Spouse' && isLast) continue;
          return false;
        }
        return true;
      });
    } else if (activeTab === 'Friends') {
      result = result.filter(c => {
        if (c.identifier === config.centerId) return true;
        if (c.distance === Infinity || c.relations.length === 0) return false;
        const allowedFriendsTypes = ['Friend', 'Partner', 'Spouse'];
        return c.relations.every(rel => allowedFriendsTypes.includes(rel));
      });
    } else if (activeTab !== 'All') {
      const getRelevantGroupIds = (id: string, allGroups: Group[]): string[] => {
        const findGroup = (gs: Group[]): Group | undefined => {
          for (const g of gs) {
            if (g.identifier === id) return g;
            if (g.subgroups) {
              const found = findGroup(g.subgroups);
              if (found) return found;
            }
          }
          return undefined;
        };
        const target = findGroup(allGroups);
        if (!target) return [id];
        const ids = [target.identifier];
        const collectSubIds = (gs: Group[]) => {
          gs.forEach(sub => {
            ids.push(sub.identifier);
            if (sub.subgroups) collectSubIds(sub.subgroups);
          });
        };
        if (target.subgroups) collectSubIds(target.subgroups);
        return ids;
      };
      const groupIds = getRelevantGroupIds(activeTab, groups);
      result = result.filter(c => c.groups?.some(gid => groupIds.includes(gid)));
    }

    return [...result].sort((a, b) => {
      if (config.sortBy === 'ALPHABETICAL') {
        const nameA = formatName(a.identity);
        const nameB = formatName(b.identity);
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (config.sortBy === 'RECENTLY_ADDED') {
        return sortOrder === 'asc' ? b.addedIndex - a.addedIndex : a.addedIndex - b.addedIndex;
      }
      const distA = a.distance === Infinity ? Number.MAX_SAFE_INTEGER : a.distance;
      const distB = b.distance === Infinity ? Number.MAX_SAFE_INTEGER : b.distance;
      if (sortOrder === 'asc') {
        if (distA < distB) return -1;
        if (distA > distB) return 1;
      } else {
        if (distA > distB) return -1;
        if (distA < distB) return 1;
      }
      return 0;
    });
  }, [contacts, searchQuery, activeTab, sortOrder, config, groups, formatName]);
};
