import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

export const E164_REGEX = /^\+[1-9]\d{7,14}$/;
export const DEFAULT_PHONE_COUNTRY: CountryCode = 'LK';

export type CountryOption = {
  code: CountryCode;
  dial: string;
  name: string;
  flag: string;
};

function flagEmoji(country: string): string {
  return country
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    dial: `+${getCountryCallingCode(code)}`,
    name: regionNames.of(code) || code,
    flag: flagEmoji(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function parseE164(value?: string | null): { country: CountryCode; national: string; e164: string } | null {
  if (!value) return null;
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed || !parsed.country) return null;
  return {
    country: parsed.country,
    national: parsed.nationalNumber,
    e164: parsed.format('E.164'),
  };
}

export function toE164(national: string, country: CountryCode): string {
  const digits = national.replace(/\D/g, '');
  if (!digits) return '';
  const parsed = parsePhoneNumberFromString(digits, country);
  if (parsed) {
    return parsed.format('E.164');
  }
  const dial = getCountryCallingCode(country);
  return `+${dial}${digits}`;
}

export function isValidE164(value: string): boolean {
  return E164_REGEX.test(value) && isValidPhoneNumber(value);
}

export function formatNational(national: string, country: CountryCode): string {
  const formatter = new AsYouType(country);
  return formatter.input(national.replace(/\D/g, ''));
}

export function maskE164(e164: string): string {
  if (e164.length < 8) return e164;
  const prefix = e164.slice(0, 4);
  const last = e164.slice(-2);
  return `${prefix} ••• •••${last}`;
}
