import {
  ExtractedField,
  ExtractionResult,
  ExtractedRegistrationData,
  OCRLineBlock,
} from '../types/registrationDocument.types';
import { FIELD_ALIASES, RegistrationFieldKey } from '../utils/registrationFieldAliases';
import {
  normalizeChassisNumber,
  normalizeCylinderCapacity,
  normalizeDate,
  normalizeEngineNumber,
  normalizeFuelType,
  normalizeNIC,
  normalizeRegistrationNumber,
  normalizeVehicleCategory,
  normalizeWeight,
  normalizeWhitespace,
} from '../utils/normalizeRegistrationDocumentData';
import {
  isValidRegistrationNumber,
  isValidYear,
} from '../utils/registrationRegex';

/**
 * Main Sri Lanka Registration Document Extraction Engine
 */
export function extractSriLankaRegistrationData(
  ocrRawText: string,
  lineBlocks?: OCRLineBlock[]
): ExtractionResult {
  const sourceLines = (lineBlocks?.length ? lineBlocks : ocrRawText.split(/\r?\n/).map((text) => ({ text, confidence: 80 })))
    .filter((line) => line.text.trim());
  const lines = sourceLines.map((line) => line.text.trim());
  type Candidate = { raw: string; lineIndex: number; sameLine: boolean; conflict?: boolean };
  const rawExtracted: Partial<Record<RegistrationFieldKey, Candidate>> = {};
  const aliases = Object.entries(FIELD_ALIASES).flatMap(([key, values]) =>
    values.map((alias) => ({ key: key as RegistrationFieldKey, alias }))
  ).sort((a, b) => b.alias.length - a.alias.length);

  // Resolve overlapping labels globally, always preferring the longest label.
  const findLabels = (line: string) => {
    const matches: { key: RegistrationFieldKey; start: number; end: number }[] = [];
    const upper = line.toUpperCase();
    for (const { key, alias } of aliases) {
      let start = upper.indexOf(alias);
      while (start !== -1) {
        const end = start + alias.length;
        const before = line.slice(0, start);
        const after = line.slice(end);
        const boundary = !/[A-Z0-9]/i.test(line[start - 1] || '') && !/[A-Z0-9]/i.test(line[end] || '');
        const labelPosition = /^\s*(?:\d{1,2}[.)]?\s*)?$/.test(before)
          || /(?:[:|;/]\s*|\s{2,})$/.test(before) || /^\s*[:=]/.test(after);
        if (boundary && labelPosition && !matches.some((m) => start < m.end && end > m.start)) {
          matches.push({ key, start, end });
        }
        start = upper.indexOf(alias, start + 1);
      }
    }
    return matches.sort((a, b) => a.start - b.start);
  };
  const clean = (value: string) => value.replace(/^[\s.:=|;-]+|[\s|;]+$/g, '').trim();
  lines.forEach((line, index) => {
    const labels = findLabels(line);
    labels.forEach((label, position) => {
      let raw = clean(line.slice(label.end, labels[position + 1]?.start ?? line.length));
      let lineIndex = index;
      const sameLine = Boolean(raw);
      if (!raw && labels.length === 1 && lines[index + 1] && !findLabels(lines[index + 1]).length) {
        raw = clean(lines[index + 1]);
        lineIndex++;
      }
      if (!raw) return;
      const previous = rawExtracted[label.key];
      if (previous && previous.raw.toUpperCase() !== raw.toUpperCase()) previous.conflict = true;
      else if (!previous) rawExtracted[label.key] = { raw, lineIndex, sameLine };
    });
  });

  // 2. Build ExtractedField Objects with Normalization & Confidence Scores
  const createField = (
    key: RegistrationFieldKey,
    rawVal: string | undefined,
    normalizer: (val: string) => string | null,
    validator?: (val: string) => boolean,
    isConservativeVin: boolean = false
  ): ExtractedField<string> => {
    if (!rawVal) {
      return { value: null, confidence: 0, requiresReview: false };
    }

    if (rawExtracted[key]?.conflict) {
      return { value: null, confidence: 0, sourceText: rawVal, requiresReview: true,
        warningMessage: 'Conflicting values found. Enter the value from the document.' };
    }
    const norm = normalizer(rawVal);
    const sourceConfidence = sourceLines[rawExtracted[key]?.lineIndex ?? -1]?.confidence;
    let confidence = Math.min(rawExtracted[key]?.sameLine ? 0.8 : 0.65, (sourceConfidence ?? 80) / 100);
    let requiresReview = true;
    let warningMsg: string | undefined;

    if (!norm) {
      return { value: null, confidence: 0, sourceText: rawVal, requiresReview: true, warningMessage: 'Unreadable value. Please check the document.' };
    }

    // Validation checks
    if (validator && !validator(norm)) {
      return { value: null, confidence: 0, sourceText: rawVal, requiresReview: true,
        warningMessage: 'Invalid format. Enter the value from the document.' };
    }

    // Conservative VIN check
    if (isConservativeVin && (rawVal.includes('O') || rawVal.includes('0') || rawVal.includes('I') || rawVal.includes('1'))) {
      confidence = Math.min(confidence, 0.70);
      requiresReview = true;
      warningMsg = 'Ambiguous characters detected in serial number. Please verify.';
    }

    return {
      value: norm,
      confidence,
      sourceText: rawVal,
      requiresReview,
      warningMessage: warningMsg,
    };
  };

  // 3. Process individual fields
  const fields: ExtractedRegistrationData = {
    registrationNumber: createField(
      'registrationNumber',
      rawExtracted.registrationNumber?.raw,
      (v) => normalizeRegistrationNumber(v),
      (v) => isValidRegistrationNumber(v)
    ),

    currentOwnerName: createField(
      'currentOwnerName',
      rawExtracted.currentOwnerName?.raw,
      (v) => normalizeWhitespace(v)
    ),

    currentOwnerAddress: createField(
      'currentOwnerAddress',
      rawExtracted.currentOwnerAddress?.raw,
      (v) => normalizeWhitespace(v)
    ),

    absoluteOwnerName: createField(
      'absoluteOwnerName',
      rawExtracted.absoluteOwnerName?.raw,
      (v) => normalizeWhitespace(v)
    ),

    absoluteOwnerAddress: createField(
      'absoluteOwnerAddress',
      rawExtracted.absoluteOwnerAddress?.raw,
      (v) => normalizeWhitespace(v)
    ),

    nicOrIdNumber: createField(
      'nicOrIdNumber',
      rawExtracted.nicOrIdNumber?.raw,
      (v) => normalizeNIC(v)
    ),

    chassisNumber: createField(
      'chassisNumber',
      rawExtracted.chassisNumber?.raw,
      (v) => normalizeChassisNumber(v),
      undefined,
      true
    ),

    engineNumber: createField(
      'engineNumber',
      rawExtracted.engineNumber?.raw,
      (v) => normalizeEngineNumber(v),
      undefined,
      true
    ),

    vehicleClass: createField(
      'vehicleClass',
      rawExtracted.vehicleClass?.raw,
      (v) => normalizeWhitespace(v)
    ),

    make: createField(
      'make',
      rawExtracted.make?.raw,
      (v) => normalizeWhitespace(v)
    ),

    model: createField(
      'model',
      rawExtracted.model?.raw,
      (v) => normalizeWhitespace(v)
    ),

    bodyType: createField(
      'bodyType',
      rawExtracted.bodyType?.raw,
      (v) => normalizeWhitespace(v)
    ),

    fuelType: createField(
      'fuelType',
      rawExtracted.fuelType?.raw,
      (v) => normalizeFuelType(v)
    ),

    colour: createField(
      'colour',
      rawExtracted.colour?.raw,
      (v) => normalizeWhitespace(v)
    ),

    cylinderCapacity: createField(
      'cylinderCapacity',
      rawExtracted.cylinderCapacity?.raw,
      (v) => normalizeCylinderCapacity(v)
    ),

    yearOfManufacture: createField(
      'yearOfManufacture',
      rawExtracted.yearOfManufacture?.raw,
      (v) => normalizeWhitespace(v),
      (v) => isValidYear(v)
    ),

    dateOfFirstRegistration: createField(
      'dateOfFirstRegistration',
      rawExtracted.dateOfFirstRegistration?.raw,
      (v) => normalizeDate(v)
    ),

    dateOfRegistration: createField(
      'dateOfRegistration',
      rawExtracted.dateOfRegistration?.raw,
      (v) => normalizeDate(v)
    ),

    countryOfOrigin: createField(
      'countryOfOrigin',
      rawExtracted.countryOfOrigin?.raw,
      (v) => normalizeWhitespace(v)
    ),

    seatingCapacity: createField(
      'seatingCapacity',
      rawExtracted.seatingCapacity?.raw,
      (v) => /^\d{1,3}$/.test(v.trim()) ? v.trim() : null
    ),

    grossWeight: createField(
      'grossWeight',
      rawExtracted.grossWeight?.raw,
      (v) => normalizeWeight(v)
    ),

    unladenWeight: createField(
      'unladenWeight',
      rawExtracted.unladenWeight?.raw,
      (v) => normalizeWeight(v)
    ),

    wheelBase: createField(
      'wheelBase',
      rawExtracted.wheelBase?.raw,
      (v) => normalizeWhitespace(v)
    ),

    previousOwnerCount: createField(
      'previousOwnerCount',
      rawExtracted.previousOwnerCount?.raw,
      (v) => /^\d{1,3}$/.test(v.trim()) ? v.trim() : null
    ),

    overhang: createField(
      'overhang',
      rawExtracted.overhang?.raw,
      (v) => normalizeWhitespace(v)
    ),

    taxationClass: createField(
      'taxationClass',
      rawExtracted.taxationClass?.raw,
      (v) => normalizeWhitespace(v)
    ),

    statusWhenRegistered: createField(
      'statusWhenRegistered',
      rawExtracted.statusWhenRegistered?.raw,
      (v) => normalizeWhitespace(v)
    ),

    provincialCouncil: createField(
      'provincialCouncil',
      rawExtracted.provincialCouncil?.raw,
      (v) => normalizeWhitespace(v)
    ),

    conditionsSpecialNotes: createField(
      'conditionsSpecialNotes',
      rawExtracted.conditionsSpecialNotes?.raw,
      (v) => normalizeWhitespace(v)
    ),

    taxesPayable: createField(
      'taxesPayable',
      rawExtracted.taxesPayable?.raw,
      (v) => normalizeWhitespace(v)
    ),

    manufacturerDescription: createField(
      'manufacturerDescription',
      rawExtracted.manufacturerDescription?.raw,
      (v) => normalizeWhitespace(v)
    ),

    tyreSize: createField(
      'tyreSize',
      rawExtracted.tyreSize?.raw,
      (v) => normalizeWhitespace(v)
    ),

    dimensions: createField(
      'dimensions',
      rawExtracted.dimensions?.raw,
      (v) => normalizeWhitespace(v)
    ),

    internalHeight: createField(
      'internalHeight',
      rawExtracted.internalHeight?.raw,
      (v) => normalizeWhitespace(v)
    ),
  };

  // 4. Map Category & Fuel Type
  const mappedCategory = normalizeVehicleCategory(
    fields.vehicleClass?.value ?? null,
    fields.bodyType?.value ?? null
  );

  const mappedFuelType = normalizeFuelType(fields.fuelType?.value ?? null);

  // 5. Calculate overall extraction confidence
  const extractedList = Object.values(fields).filter((f) => f.value !== null);
  const avgConfidence =
    extractedList.length > 0
      ? extractedList.reduce((acc, f) => acc + f.confidence, 0) / extractedList.length
      : 0;

  return {
    fields,
    rawOcrText: ocrRawText,
    mappedCategory,
    mappedFuelType,
    overallConfidence: Math.round(avgConfidence * 100) / 100,
  };
}

