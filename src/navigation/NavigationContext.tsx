import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { Route } from './types';

interface NavigationContextType {
  currentRoute: Route;
  stack: Route[];
  push: (route: Route) => void;
  pop: () => void;
  replace: (route: Route) => void;
  resetTo: (route: Route) => void;
  navigateToGroupFilter: (groupId: string) => void;
  pendingGroupFilter: string | null;
  clearPendingGroupFilter: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [stack, setStack] = useState<Route[]>([{ name: 'ContactList' }]);
  const [pendingGroupFilter, setPendingGroupFilter] = useState<string | null>(null);

  const push = useCallback((route: Route) => {
    setStack(prev => [...prev, route]);
  }, []);

  const pop = useCallback(() => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const replace = useCallback((route: Route) => {
    setStack(prev => [...prev.slice(0, -1), route]);
  }, []);

  const resetTo = useCallback((route: Route) => {
    setStack([route]);
  }, []);

  const navigateToGroupFilter = useCallback((groupId: string) => {
    setPendingGroupFilter(groupId);
    setStack([{ name: 'ContactList' }]);
  }, []);

  const clearPendingGroupFilter = useCallback(() => {
    setPendingGroupFilter(null);
  }, []);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        pop();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [stack.length, pop]);

  return (
    <NavigationContext.Provider value={{ currentRoute: stack[stack.length - 1], stack, push, pop, replace, resetTo, navigateToGroupFilter, pendingGroupFilter, clearPendingGroupFilter }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
};
