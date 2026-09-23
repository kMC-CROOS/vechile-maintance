import { Platform } from 'react-native';
import { ExtractionResult, ExtractedRegistrationData } from '../types/registrationDocument.types';
import { apiFetch } from './api';

export interface ScanDocumentOptions {
  imageUri: string;
  onProgress?: (message: string) => void;
}

export async function performDocumentOCR({ imageUri, onProgress }: ScanDocumentOptions): Promise<ExtractionResult> {
  if (!imageUri) throw new Error('Choose a document photo first.');

  onProgress?.('Sending document image to backend OCR engine...');

  const formData = new FormData();

  if (Platform.OS === 'web') {
    const res = await fetch(imageUri);
    const blob = await res.blob();
    formData.append('document', blob, 'document.jpg');
  } else {
    formData.append('document', {
      uri: imageUri,
      name: 'document.jpg',
      type: 'image/jpeg',
    } as any);
  }

  onProgress?.('Extracting registration details via OCR...');

  let response: any;
  try {
    response = await apiFetch('/ocr/extract', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  } catch (err: any) {
    throw new Error(err?.message || 'Failed to connect to backend OCR service.');
  }

  if (!response?.success) {
    throw new Error(response?.error || 'No legible registration fields detected. Please use a clearer photo or enter details manually.');
  }

  const rawText: string = response.raw_text || '';
  const extractedBackend: Record<string, any> = response.extracted || {};

  // Map backend key names to SriLankaVehicleRegistrationData fields
  const fieldsMap: ExtractedRegistrationData = {
    registrationNumber: createExtractedField(extractedBackend.registration_number),
    chassisNumber: createExtractedField(extractedBackend.chassis_number),
    currentOwnerName: createExtractedField(extractedBackend.owner_details),
    currentOwnerAddress: createExtractedField(null),
    nicOrIdNumber: createExtractedField(null),
    conditionsSpecialNotes: createExtractedField(extractedBackend.conditions_special_notes),
    absoluteOwnerName: createExtractedField(extractedBackend.absolute_owner),
    absoluteOwnerAddress: createExtractedField(null),
    engineNumber: createExtractedField(extractedBackend.engine_number),
    cylinderCapacity: createExtractedField(extractedBackend.cylinder_capacity ? String(extractedBackend.cylinder_capacity) : null),
    vehicleClass: createExtractedField(extractedBackend.vehicle_class),
    taxationClass: createExtractedField(extractedBackend.taxation_class),
    statusWhenRegistered: createExtractedField(extractedBackend.status_when_registered),
    fuelType: createExtractedField(extractedBackend.fuel_type),
    make: createExtractedField(extractedBackend.make || extractedBackend.brand),
    countryOfOrigin: createExtractedField(extractedBackend.country_of_origin),
    model: createExtractedField(extractedBackend.model),
    manufacturerDescription: createExtractedField(extractedBackend.manufacturer_description),
    wheelBase: createExtractedField(extractedBackend.wheel_base ? String(extractedBackend.wheel_base) : null),
    overhang: createExtractedField(extractedBackend.overhang ? String(extractedBackend.overhang) : null),
    bodyType: createExtractedField(extractedBackend.body_type),
    yearOfManufacture: createExtractedField(extractedBackend.year_of_manufacture ? String(extractedBackend.year_of_manufacture) : null),
    colour: createExtractedField(extractedBackend.colour),
    previousOwnerCount: createExtractedField(extractedBackend.previous_owners),
    seatingCapacity: createExtractedField(extractedBackend.seating_capacity ? String(extractedBackend.seating_capacity) : null),
    grossWeight: createExtractedField(extractedBackend.weight_kg ? String(extractedBackend.weight_kg) : null),
    unladenWeight: createExtractedField(null),
    tyreSize: createExtractedField(extractedBackend.tyre_size),
    dimensions: createExtractedField(extractedBackend.dimensions),
    internalHeight: createExtractedField(extractedBackend.internal_height),
    provincialCouncil: createExtractedField(extractedBackend.provincial_council),
    dateOfFirstRegistration: createExtractedField(extractedBackend.date_of_first_registration),
    dateOfRegistration: createExtractedField(null),
    taxesPayable: createExtractedField(extractedBackend.taxes_payable),
  };

  // Determine category mapping from vehicle_class or body_type
  let mappedCategory: string | null = null;
  const vClass = (extractedBackend.vehicle_class || extractedBackend.body_type || '').toUpperCase();
  if (vClass.includes('CAR') || vClass.includes('SEDAN') || vClass.includes('HATCHBACK')) mappedCategory = 'Car';
  else if (vClass.includes('CYCLE') || vClass.includes('BIKE')) mappedCategory = 'Bike';
  else if (vClass.includes('THREE') || vClass.includes('TUK')) mappedCategory = 'Three-Wheeler';
  else if (vClass.includes('VAN') || vClass.includes('SUV')) mappedCategory = 'Van / SUV';
  else if (vClass.includes('BUS')) mappedCategory = 'Bus';
  else if (vClass.includes('TRUCK') || vClass.includes('LORRY')) mappedCategory = 'Truck';
  else if (vClass.includes('TRACTOR')) mappedCategory = 'Tractor';

  const mappedFuelType = extractedBackend.fuel_type || null;

  return {
    fields: fieldsMap,
    rawOcrText: rawText,
    mappedCategory,
    mappedFuelType,
    overallConfidence: 0.9,
    imageUri,
  };
}

function createExtractedField(val: any) {
  if (val === null || val === undefined || val === '') {
    return {
      value: null,
      confidence: 0,
      requiresReview: false,
    };
  }
  return {
    value: String(val),
    confidence: 0.95,
    requiresReview: false,
  };
}
