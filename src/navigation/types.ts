import { ContactWithDistance } from '../types';

export type RouteParams = {
  ContactList: undefined;
  Birthdays: undefined;
  Profile: { contact: ContactWithDistance };
  Settings: undefined;
};

export type RouteName = keyof RouteParams;

export type Route = {
  [K in RouteName]: RouteParams[K] extends undefined
    ? { name: K }
    : { name: K; params: RouteParams[K] };
}[RouteName];
