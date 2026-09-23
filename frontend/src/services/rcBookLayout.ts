import type { OCRLineBlock } from '../types/registrationDocument.types';
import { FIELD_ALIASES, type RegistrationFieldKey } from '../utils/registrationFieldAliases';

export interface OCRWord { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }
export interface RCRegion { key: RegistrationFieldKey; left: number; top: number; width: number; height: number }
const labels: [RegistrationFieldKey, RegExp][] = [
  ['registrationNumber', /REGISTRATION\s*NO/], ['chassisNumber', /CHASSIS\s*NO/],
  ['currentOwnerName', /CURRENT\s*OWNER|CURENT\s*OWNER/],
  ['conditionsSpecialNotes', /CONDITIONS?\s*[/ ]\s*SPECIAL\s*NOTES/],
  ['absoluteOwnerName', /ABSOLUTE\s*OWNER/], ['engineNumber', /ENGINE\s*NO/],
  ['cylinderCapacity', /CYLINDER\s*CAPACITY/], ['vehicleClass', /CLASS\s*OF\s*VEHICLE/],
  ['taxationClass', /TAXATION\s*CLASS/], ['statusWhenRegistered', /STATUS\s*WHEN\s*REG/],
  ['fuelType', /FUEL\s*TYPE/], ['make', /MAKE\b/], ['countryOfOrigin', /COUNTRY\s*OF\s*ORIGIN/],
  ['model', /MODEL\b/], ['manufacturerDescription', /MANUFACTURE[R'S]*\s*DESCRIP/],
  ['wheelBase', /WHEEL\s*BASE/], ['overhang', /OVER\s*HANG/], ['bodyType', /TYPE\s*OF\s*BODY/],
  ['yearOfManufacture', /YEAR\s*OF\s*MANUFACTURE/], ['colour', /COLOU?R\b/],
  ['previousOwnerCount', /PREVIOUS\s*OWNERS/], ['seatingCapacity', /SEATING\s*CAPACITY/],
  ['grossWeight', /WEIGHT\s*\(?KG/], ['tyreSize', /TYRE\s*SIZE/],
  ['dimensions', /LENGTH.*WIDTH/], ['provincialCouncil', /PROVINCIAL\s*COUNCIL/],
  ['dateOfFirstRegistration', /DATE\s*OF\s*FIRST\s*REGISTRATION/], ['taxesPayable', /TAXES\s*PAYABLE/],
];

/** Locate printed RC cells from OCR geometry, never from a vehicle's values. */
export function locateRCRegions(lines: { words: OCRWord[] }[], imageWidth: number, imageHeight: number): RCRegion[] {
  const allWords = lines.flatMap((line) => line.words);
  // The printed numbers in the right column establish its actual boundary.
  const rightStarts = allWords.filter((w) => /^(2|7|9|11|13|15|17|19|21)[.,]?$/.test(w.text)
    && w.bbox.x0 > imageWidth * 0.42 && w.bbox.x0 < imageWidth * 0.65).map((w) => w.bbox.x0);
  if (rightStarts.length < 3) return [];
  rightStarts.sort((a, b) => a - b);
  const split = rightStarts[Math.floor(rightStarts.length / 2)] - imageWidth * 0.01;
  const anchors: { key: RegistrationFieldKey; column: number; top: number; bottom: number; height: number }[] = [];
  for (const line of lines) {
    const fullText = line.words.map((w) => w.text).join(' ').toUpperCase();
    const wide = /CURRENT\s*OWNER|CURENT\s*OWNER|ABSOLUTE\s*OWNER|SPECIAL\s*NOTES/.test(fullText);
    for (const column of wide ? [2] : [0, 1]) {
      const words = line.words.filter((w) => column === 2 || (column === 0 ? w.bbox.x0 < split : w.bbox.x0 >= split));
      const text = words.map((w) => w.text).join(' ').toUpperCase();
      const label = labels.find(([, regex]) => regex.test(text));
      if (!label || !words.length) continue;
      const match = label[1].exec(text)!;
      let offset = 0;
      const labelWords = words.filter((word) => {
        const start = offset;
        offset += word.text.length + 1;
        return start < match.index + match[0].length && offset > match.index;
      });
      const heights = labelWords.map((w) => w.bbox.y1 - w.bbox.y0).sort((a, b) => a - b);
      const h = heights[Math.floor(heights.length / 2)];
      const leadingNumber = words.find((w) => /^\d{1,2}[.,]?$/.test(w.text)
        && w.bbox.x0 < (column === 1 ? split : 0) + imageWidth * 0.12);
      const top = leadingNumber ? leadingNumber.bbox.y0 : Math.min(...labelWords.map((w) => w.bbox.y0));
      const bottom = leadingNumber ? leadingNumber.bbox.y1 : Math.max(...labelWords.map((w) => w.bbox.y1));
      if (Number.isFinite(bottom)) anchors.push({ key: label[0], column, top, bottom, height: leadingNumber ? leadingNumber.bbox.y1 - leadingNumber.bbox.y0 : h });
    }
  }
  if (!anchors.some((a) => a.key === 'registrationNumber') || anchors.length < 8) return [];
  return anchors.flatMap((anchor) => {
    // These are nested tables, not scalar values. Leave them for manual review.
    if (['grossWeight', 'tyreSize', 'dimensions', 'previousOwnerCount'].includes(anchor.key)) return [];
    const next = anchors.filter((a) => a.top > anchor.bottom && (a.column === anchor.column || a.column === 2 || anchor.column === 2))
      .sort((a, b) => a.top - b.top)[0];
    const top = Math.ceil(anchor.bottom + 2);
    const maxHeight = anchor.height * (anchor.key === 'currentOwnerName' ? 8 : 1.8);
    const bottom = Math.min(next ? next.top - 3 : top + maxHeight, top + maxHeight, imageHeight);
    const left = anchor.column === 1 ? split + 5 : imageWidth * 0.07;
    // Values start near the left of each cell. Exclude borders and the next sloping header.
    const right = anchor.column === 2 ? imageWidth * 0.96 : anchor.column === 0 ? split - imageWidth * 0.09 : imageWidth * 0.92;
    return bottom - top > 8 ? [{ key: anchor.key, left: Math.round(left), top, width: Math.floor(right - left), height: Math.floor(bottom - top) }] : [];
  });
}

/** Keep the composite owner box separate from the previous-owner history. */
export function rcRegionToLines(key: RegistrationFieldKey, text: string, confidence: number): OCRLineBlock[] {
  const values = text.split(/\r?\n/).map((s) => s.replace(/^[\s|~]+|[\s|~]+$/g, '').trim()).filter(Boolean);
  const clean = values.filter((s) => !/DATA ENTERED|CERTIFIED|COMMISSIONER|DEPARTMENT|DISTRICT OFFICE|TRANSFER[ER]*D DATE/i.test(s));
  if (!clean.length || confidence < 45) return [];
  if (key === 'currentOwnerName') {
    const idIndex = clean.findIndex((s) => /\b(?:\d{12}|\d{9}[VX])\b/i.test(s));
    const id = idIndex >= 0 ? clean[idIndex].match(/\b(?:\d{12}|\d{9}[VX])\b/i)?.[0] : null;
    return [
      { text: `CURRENT OWNER: ${clean[0]}`, confidence },
      ...(clean.length > 1 ? [{ text: `OWNER ADDRESS: ${clean.slice(1, idIndex >= 0 ? idIndex : undefined).filter((line) => !/^[0-9]/.test(line) || /\s+[A-Z]{3}/i.test(line)).join(', ')}`, confidence }] : []),
      ...(idIndex >= 0 ? [{ text: `NIC NUMBER: ${id}`, confidence }] : []),
    ];
  }
  // Only the first value line belongs to an ordinary cell; signatures below it do not.
  return [{ text: `${FIELD_ALIASES[key][0]}: ${clean[0]}`, confidence }];
}
