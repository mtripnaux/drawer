import { Contact } from '../types';
import { UserConfig } from '../constants/config';

export const normalizeSearch = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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

  return cleanString(name);
};

export const cleanString = (input: string): string => {
  let output = input.replaceAll("()", '');
  output = output.replaceAll(", ,", ', ');
  output = output.replace(/(?:^|\s+)\.\s*/g, ' ').trim();
  output = output.replace(/\s+/g, ' ').trim();
  
  if(output.endsWith(',')) {
    output = output.slice(0, -1);
  }

  if(input == output) return output;
  return cleanString(output);
}

export const getPhoneNumber = (phone: any): string => {
  if (typeof phone === 'string') return phone;
  const raw = `${phone.number}`;
  if (!phone.country_code) return raw;
  return `+${phone.country_code} ${raw}`;
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
