import { ContactWithDistance } from '../types';

export type RouteParams = {
  ContactList: undefined;
  Birthdays: undefined;
  Profile: { contactId: string };
  Settings: undefined;
  EditContact: { contact?: ContactWithDistance };
};

export type RouteName = keyof RouteParams;

export type Route = {
  [K in RouteName]: RouteParams[K] extends undefined
    ? { name: K }
    : { name: K; params: RouteParams[K] };
}[RouteName];
