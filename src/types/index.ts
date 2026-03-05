export type Relation = 
  | 'Sibling' 
  | 'Spouse' 
  | 'Partner' 
  | 'Friend' 
  | 'Parent' 
  | 'Child' 
  | 'Boss' 
  | 'Employee' 
  | 'Colleague'
  | 'Half-Sibling'
  | 'Ex';

export interface Link {
  target: string;
  relation: Relation;
}

export interface PhoneNumber {
  label?: string | null;
  country_code: number;
  number: number;
}

export interface Contact {
  identifier: string;
  identity: {
    first_name: string | null;
    last_name: string | null;
    middle_name?: string | null;
    title?: string | null;
    post_nominal?: string | null;
    gender: 'male' | 'female' | 'non-binary' | 'Male' | 'Female' | 'Non-binary' | null;
    birth_date?: { 
      year?: number | null; 
      month?: number | null; 
      day?: number | null;
      hour?: number | null;
      minute?: number | null;
      second?: number | null;
    } | null;
    is_alive?: boolean;
    birth_first_name?: string | null;
    birth_middle_name?: string | null;
    birth_last_name?: string | null;
  };
  phones?: PhoneNumber[] | null;
  emails?: { label?: string | null; address: string }[] | null;
  socials?: { network: string; username: string }[] | null;
  links: Link[] | null;
  groups?: string[] | null;
}

export interface Group {
  identifier: string;
  name: string;
  subgroups?: Group[];
}

export interface ContactWithDistance extends Contact {
  distance: number;
  relations: string[];
  path: string[];
  addedIndex: number;
}
