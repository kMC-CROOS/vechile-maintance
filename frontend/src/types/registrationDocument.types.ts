export interface SriLankaVehicleRegistrationData {
  registrationNumber?: string | null;
  chassisNumber?: string | null;

  currentOwnerName?: string | null;
  currentOwnerAddress?: string | null;
  nicOrIdNumber?: string | null;

  conditionsSpecialNotes?: string | null;

  absoluteOwnerName?: string | null;
  absoluteOwnerAddress?: string | null;

  engineNumber?: string | null;
  cylinderCapacity?: string | null;

  vehicleClass?: string | null;
  taxationClass?: string | null;
  statusWhenRegistered?: string | null;

  fuelType?: string | null;
  make?: string | null;
  countryOfOrigin?: string | null;
  model?: string | null;

  manufacturerDescription?: string | null;

  wheelBase?: string | null;
  overhang?: string | null;
  bodyType?: string | null;

  yearOfManufacture?: string | null;
  colour?: string | null;

  previousOwnerCount?: string | null;
  seatingCapacity?: string | null;

  grossWeight?: string | null;
  unladenWeight?: string | null;

  tyreSize?: string | null;
  dimensions?: string | null;
  internalHeight?: string | null;

  provincialCouncil?: string | null;
  dateOfFirstRegistration?: string | null;
  dateOfRegistration?: string | null;
  taxesPayable?: string | null;
}

export interface ExtractedField<T = string> {
  value: T | null;
  confidence: number; // 0.0 to 1.0 (>=0.85 High, 0.65-0.84 Medium, <0.65 Low/Requires Review)
  sourceText?: string;
  requiresReview?: boolean;
  warningMessage?: string;
}

export type ExtractedRegistrationData = {
  [K in keyof SriLankaVehicleRegistrationData]: ExtractedField<string>;
};

export interface ExtractionResult {
  fields: ExtractedRegistrationData;
  rawOcrText: string;
  mappedCategory: string | null; // e.g. 'CAR', 'BIKE', 'THREE-WHEELER', 'VAN / SUV', etc.
  mappedFuelType: string | null; // e.g. 'Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'
  overallConfidence: number;
  imageUri?: string | null;
}

export interface OCRLineBlock {
  text: string;
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
