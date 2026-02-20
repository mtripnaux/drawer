import { Contact } from '../utils/graph';

export interface ContactWithDistance extends Contact {
  distance: number;
  relations: string[];
  path: string[];
}
