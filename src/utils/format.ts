import { Contact } from '../types';
import { UserConfig } from '../constants/config';

export const formatNameWithConfig = (identity: Contact['identity'], config: UserConfig) => {
  let name = config.nameDisplayPattern;
  name = name.replace(/BIRTH_FIRST/g, identity.birth_first_name || '');
  name = name.replace(/BIRTH_MIDDLE/g, identity.birth_middle_name || '');
  name = name.replace(/BIRTH_LAST/g, identity.birth_last_name || '');
  name = name.replace(/FIRST/g, identity.first_name || '');
  name = name.replace(/LAST/g, identity.last_name || '');
  name = name.replace(/TITLE/g, identity.title || '');
  name = name.replace(/POST/g, identity.post_nominal || '');
  name = name.replace(/MIDDLE/g, identity.middle_name || '');
  
  name = name.replaceAll("()", '');
  name = name.replaceAll(", ,", ', ');
  name = name.replace(/\s+/g, ' ').trim();

  if(name.endsWith(',')) {
    name = name.slice(0, -1);
  }

  return name;
};

const PHONE_FORMATS: Record<number, (n: string) => string> = {
  // North America (NANP): (XXX) XXX-XXXX
  1:   n => n.length === 10 ? `(${n.slice(0,3)}) ${n.slice(3,6)}-${n.slice(6)}` : n,
  // France: X XX XX XX XX
  33:  n => n.replace(/^(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5'),
  // UK: XXXX XXXXXX or XXXXX XXXXXX
  44:  n => n.length === 10 ? `${n.slice(0,4)} ${n.slice(4)}` : n.length === 11 ? `${n.slice(0,5)} ${n.slice(5)}` : n,
  // Germany: XXX XXXXXXX
  49:  n => n.replace(/^(\d{3,5})(\d+)$/, '$1 $2'),
  // Belgium: XXX XX XX XX
  32:  n => n.replace(/^(\d{3})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4'),
  // Switzerland: XX XXX XX XX
  41:  n => n.replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4'),
  // Italy: XXX XXXXXXX
  39:  n => n.replace(/^(\d{3})(\d+)$/, '$1 $2'),
  // Spain: XXX XXX XXX
  34:  n => n.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3'),
  // Netherlands: XX XXXXXXX
  31:  n => n.replace(/^(\d{2})(\d+)$/, '$1 $2'),
  // Portugal: XXX XXX XXX
  351: n => n.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3'),
  // Luxembourg: XXX XXX XXX
  352: n => n.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3'),
  // Austria: XXX XXXXXXX
  43:  n => n.replace(/^(\d{3})(\d+)$/, '$1 $2'),
  // Australia: XXXX XXXX
  61:  n => n.replace(/^(\d{4})(\d{4})$/, '$1 $2'),
  // Japan: XXX-XXXX-XXXX
  81:  n => n.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3'),
  // Brazil: (XX) XXXXX-XXXX
  55:  n => n.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3'),
  // India: XXXXX XXXXX
  91:  n => n.replace(/^(\d{5})(\d{5})$/, '$1 $2'),
  // China: XXX XXXX XXXX
  86:  n => n.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1 $2 $3'),
};

export const getPhoneNumber = (phone: any): string => {
  if (typeof phone === 'string') return phone;
  const raw = `${phone.number}`;
  if (!phone.country_code) return raw;
  const cc: number = phone.country_code;
  const formatter = PHONE_FORMATS[cc];
  const formatted = formatter ? formatter(raw) : raw;
  return `+${cc} ${formatted}`;
};

export const getInitials = (first: string, last: string) => {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
};

export const formatTwoDigits = (num: number) => num.toString().padStart(2, '0');

export const computeAge = (birthDate: { year?: number | null; month?: number | null; day?: number | null } | null | undefined): { age: number; approximate: boolean } | null => {
  if (!birthDate || !birthDate.year) return null;
  const approximate = !birthDate.month || !birthDate.day;
  const today = new Date();
  const birth = new Date(
    birthDate.year,
    (birthDate.month ?? 1) - 1,
    birthDate.day ?? 1
  );
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? { age, approximate } : null;
};

export const formatDate = (date: any, config: UserConfig) => {
  if (!date) return '';

  let format = config.dateFormat; // e.g. "DD/MM/YYYY" or "YYYY-MM-DD"

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (date.month) format = format.replace('MONTH', MONTHS[date.month - 1]);
  if (date.day) format = format.replace('DD', formatTwoDigits(date.day));
  if (date.month) format = format.replace('MM', formatTwoDigits(date.month));
  if (date.day) format = format.replace('D', date.day.toString());
  if (date.month) format = format.replace('M', date.month.toString());
  if (date.year) format = format.replace('YYYY', date.year.toString());

  format = format
    .replace('DD', '')
    .replace('MM', '')
    .replace('YYYY', '')
    .replace('D', '')
    .replace('M', '')
    .replace('MONTH', '');

  format = format.replace(/\/\/+/g, '/').replace(/--+/g, '-').replace(/^\/|\/$/g, '');

  return format;
};
