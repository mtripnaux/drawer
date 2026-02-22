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

export const getPhoneNumber = (phone: any) => {
  if (typeof phone === 'string') return phone;
  if (phone.country_code) {
      return `+${phone.country_code}${phone.number}`;
  }
  return `${phone.number}`;
};

export const getInitials = (first: string, last: string) => {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
};

export const formatTwoDigits = (num: number) => num.toString().padStart(2, '0');

export const formatDate = (date: any) => {
  if (!date) return '';
  const parts = [];
  if (date.day) parts.push(formatTwoDigits(date.day));
  if (date.month) parts.push(formatTwoDigits(date.month));
  if (date.year) parts.push(date.year);
  
  let dateStr = parts.join('/');
  
  const timeParts = [];
  if (date.hour !== null && date.hour !== undefined) timeParts.push(formatTwoDigits(date.hour));
  if (date.minute !== null && date.minute !== undefined) timeParts.push(formatTwoDigits(date.minute));
  if (date.second !== null && date.second !== undefined) timeParts.push(formatTwoDigits(date.second));
  
  if (timeParts.length > 0) {
    if (dateStr) dateStr += ' ';
    dateStr += timeParts.join(':');
  }
  
  return dateStr;
};
