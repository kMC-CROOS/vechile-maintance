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

const COUNTRY_NAMES: Record<string, string> = {
  AF: 'Afghanistan', AX: 'Åland Islands', AL: 'Albania', DZ: 'Algeria', AS: 'American Samoa', AD: 'Andorra', AO: 'Angola', 
  AI: 'Anguilla', AQ: 'Antarctica', AG: 'Antigua & Barbuda', AR: 'Argentina', AM: 'Armenia', AW: 'Aruba', AU: 'Australia', 
  AT: 'Austria', AZ: 'Azerbaijan', BS: 'Bahamas', BH: 'Bahrain', BD: 'Bangladesh', BB: 'Barbados', BY: 'Belarus', 
  BE: 'Belgium', BZ: 'Belize', BJ: 'Benin', BM: 'Bermuda', BT: 'Bhutan', BO: 'Bolivia', BA: 'Bosnia & Herzegovina', 
  BW: 'Botswana', BV: 'Bouvet Island', BR: 'Brazil', IO: 'British Indian Ocean Territory', VG: 'British Virgin Islands', 
  BN: 'Brunei', BG: 'Bulgaria', BF: 'Burkina Faso', BI: 'Burundi', KH: 'Cambodia', CM: 'Cameroon', CA: 'Canada', 
  CV: 'Cape Verde', BQ: 'Caribbean Netherlands', KY: 'Cayman Islands', CF: 'Central African Republic', TD: 'Chad', 
  CL: 'Chile', CN: 'China', CX: 'Christmas Island', CC: 'Cocos (Keeling) Islands', CO: 'Colombia', KM: 'Comoros', 
  CG: 'Congo - Brazzaville', CD: 'Congo - Kinshasa', CK: 'Cook Islands', CR: 'Costa Rica', CI: 'Côte d’Ivoire', 
  HR: 'Croatia', CU: 'Cuba', CW: 'Curaçao', CY: 'Cyprus', CZ: 'Czechia', DK: 'Denmark', DJ: 'Djibouti', DM: 'Dominica', 
  DO: 'Dominican Republic', EC: 'Ecuador', EG: 'Egypt', SV: 'El Salvador', GQ: 'Equatorial Guinea', ER: 'Eritrea', 
  EE: 'Estonia', SZ: 'Eswatini', ET: 'Ethiopia', FK: 'Falkland Islands', FO: 'Faroe Islands', FJ: 'Fiji', FI: 'Finland', 
  FR: 'France', GF: 'French Guiana', PF: 'French Polynesia', TF: 'French Southern Territories', GA: 'Gabon', GM: 'Gambia', 
  GE: 'Georgia', DE: 'Germany', GH: 'Ghana', GI: 'Gibraltar', GR: 'Greece', GL: 'Greenland', GD: 'Grenada', 
  GP: 'Guadeloupe', GU: 'Guam', GT: 'Guatemala', GG: 'Guernsey', GN: 'Guinea', GW: 'Guinea-Bissau', GY: 'Guyana', 
  HT: 'Haiti', HM: 'Heard & McDonald Islands', HN: 'Honduras', HK: 'Hong Kong SAR China', HU: 'Hungary', IS: 'Iceland', 
  IN: 'India', ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq', IE: 'Ireland', IM: 'Isle of Man', IL: 'Israel', IT: 'Italy', 
  JM: 'Jamaica', JP: 'Japan', JE: 'Jersey', JO: 'Jordan', KZ: 'Kazakhstan', KE: 'Kenya', KI: 'Kiribati', KW: 'Kuwait', 
  KG: 'Kyrgyzstan', LA: 'Laos', LV: 'Latvia', LB: 'Lebanon', LS: 'Lesotho', LR: 'Liberia', LY: 'Libya', LI: 'Liechtenstein', 
  LT: 'Lithuania', LU: 'Luxembourg', MO: 'Macao SAR China', MG: 'Madagascar', MW: 'Malawi', MY: 'Malaysia', MV: 'Maldives', 
  ML: 'Mali', MT: 'Malta', MH: 'Marshall Islands', MQ: 'Martinique', MR: 'Mauritania', MU: 'Mauritius', YT: 'Mayotte', 
  MX: 'Mexico', FM: 'Micronesia', MD: 'Moldova', MC: 'Monaco', MN: 'Mongolia', ME: 'Montenegro', MS: 'Montserrat', 
  MA: 'Morocco', MZ: 'Mozambique', MM: 'Myanmar (Burma)', NA: 'Namibia', NR: 'Nauru', NP: 'Nepal', NL: 'Netherlands', 
  NC: 'New Caledonia', NZ: 'New Zealand', NI: 'Nicaragua', NE: 'Niger', NG: 'Nigeria', NU: 'Niue', NF: 'Norfolk Island', 
  KP: 'North Korea', MK: 'North Macedonia', MP: 'Northern Mariana Islands', NO: 'Norway', OM: 'Oman', PK: 'Pakistan', 
  PW: 'Palau', PS: 'Palestinian Territories', PA: 'Panama', PG: 'Papua New Guinea', PY: 'Paraguay', PE: 'Peru', 
  PH: 'Philippines', PN: 'Pitcairn Islands', PL: 'Poland', PT: 'Portugal', PR: 'Puerto Rico', QA: 'Qatar', RE: 'Réunion', 
  RO: 'Romania', RU: 'Russia', RW: 'Rwanda', WS: 'Samoa', SM: 'San Marino', ST: 'São Tomé & Príncipe', SA: 'Saudi Arabia', 
  SN: 'Senegal', RS: 'Serbia', SC: 'Seychelles', SL: 'Sierra Leone', SG: 'Singapore', SX: 'Sint Maarten', SK: 'Slovakia', 
  SI: 'Slovenia', SB: 'Solomon Islands', SO: 'Somalia', ZA: 'South Africa', GS: 'South Georgia & South Sandwich Islands', 
  KR: 'South Korea', SS: 'South Sudan', ES: 'Spain', LK: 'Sri Lanka', BL: 'St. Barthélemy', SH: 'St. Helena', 
  KN: 'St. Kitts & Nevis', LC: 'St. Lucia', MF: 'St. Martin', PM: 'St. Pierre & Miquelon', VC: 'St. Vincent & Grenadines', 
  SD: 'Sudan', SR: 'Suriname', SJ: 'Svalbard & Jan Mayen', SE: 'Sweden', CH: 'Switzerland', SY: 'Syria', TW: 'Taiwan', 
  TJ: 'Tajikistan', TZ: 'Tanzania', TH: 'Thailand', TL: 'Timor-Leste', TG: 'Togo', TK: 'Tokelau', TO: 'Tonga', 
  TT: 'Trinidad & Tobago', TN: 'Tunisia', TR: 'Turkey', TM: 'Turkmenistan', TC: 'Turks & Caicos Islands', TV: 'Tuvalu', 
  UM: 'U.S. Outlying Islands', VI: 'U.S. Virgin Islands', UG: 'Uganda', UA: 'Ukraine', AE: 'United Arab Emirates', 
  GB: 'United Kingdom', US: 'United States', UY: 'Uruguay', UZ: 'Uzbekistan', VU: 'Vanuatu', VA: 'Vatican City', 
  VE: 'Venezuela', VN: 'Vietnam', WF: 'Wallis & Futuna', EH: 'Western Sahara', YE: 'Yemen', ZM: 'Zambia', ZW: 'Zimbabwe'
};

export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    dial: `+${getCountryCallingCode(code)}`,
    name: COUNTRY_NAMES[code] || code,
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
