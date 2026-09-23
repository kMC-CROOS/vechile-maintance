import { SriLankaVehicleRegistrationData } from '../types/registrationDocument.types';

export type RegistrationFieldKey = keyof SriLankaVehicleRegistrationData;

export const FIELD_ALIASES: Record<RegistrationFieldKey, string[]> = {
  registrationNumber: [
    'REGISTRATION NO',
    'REGISTRATION NO.',
    'REGISTRATION NUMBER',
    'REG NO',
    'REG. NO.',
    'VEHICLE NO',
    'VEHICLE NUMBER',
    'NUMBER OF REGISTRATION',
    'REGISTRATION MARK',
    'NO. OF REGISTRATION',
    'REG MARK',
  ],

  currentOwnerName: [
    'CURRENT OWNER/ADDRESS/I.D.NO.',
    'CURRENT OWNER/ADDRESS/I.D.NO',
    'CURRENT OWNER',
    'NAME OF CURRENT OWNER',
    'REGISTERED OWNER',
    'OWNER',
    'OWNER NAME',
    'NAME OF OWNER',
    'NAME & ADDRESS OF OWNER',
    'NAME OF THE OWNER',
  ],

  currentOwnerAddress: [
    'ADDRESS',
    'OWNER ADDRESS',
    'ADDRESS OF OWNER',
    'ADDRESS OF CURRENT OWNER',
    'REGISTERED ADDRESS',
    'RESIDENTIAL ADDRESS',
    'TOWN / CITY',
  ],

  absoluteOwnerName: [
    'ABSOLUTE OWNER',
    'ABSOLUTE OWNER (OPTION)',
    'ABSOLUTE OWNER / LEASING',
    'FINANCIER',
    'HIRE PURCHASE / LEASING',
  ],

  absoluteOwnerAddress: [
    'ABSOLUTE OWNER ADDRESS',
    'LEASING ADDRESS',
    'FINANCIER ADDRESS',
  ],

  nicOrIdNumber: [
    'NIC',
    'NIC NO',
    'NIC NUMBER',
    'IDENTITY CARD NO',
    'ID NO',
    'ID NUMBER',
    'PASSPORT NO',
    'BUSINESS REG NO',
  ],

  chassisNumber: [
    'CHASSIS NO',
    'CHASSIS NO.',
    'CHASSIS NUMBER',
    'CHASSIS #',
    'FRAME NO',
    'FRAME NUMBER',
    'VIN',
    'VEHICLE IDENTIFICATION NO',
  ],

  engineNumber: [
    'ENGINE NO',
    'ENGINE NO.',
    'ENGINE NUMBER',
    'ENGINE #',
    'MOTOR NO',
    'MOTOR NUMBER',
    'SERIAL NO OF ENGINE',
  ],

  vehicleClass: [
    'CLASS OF VEHICLE',
    'VEHICLE CLASS',
    'CLASS',
    'CATEGORY OF VEHICLE',
    'VEHICLE CATEGORY',
  ],

  make: [
    'MAKE',
    'VEHICLE MAKE',
    'MANUFACTURER',
    'MAKE OF VEHICLE',
    'BRAND',
  ],

  model: [
    'MODEL',
    'VEHICLE MODEL',
    'MODEL NAME',
    'VARIANT',
    'TRADE NAME',
  ],

  bodyType: [
    'BODY TYPE',
    'TYPE OF BODY',
    'BODY',
    'BODY DESIGN',
    'TYPE OF BODYWORK',
  ],

  fuelType: [
    'FUEL',
    'FUEL TYPE',
    'TYPE OF FUEL',
    'POWER SOURCE',
    'ENERGY SOURCE',
    'PROPULSION TYPE',
  ],

  colour: [
    'COLOUR',
    'COLOR',
    'VEHICLE COLOUR',
    'VEHICLE COLOR',
    'PRIMARY COLOUR',
  ],

  cylinderCapacity: [
    'CYLINDER CAPACITY (CC)',
    'CYLINDER CAPACITY',
    'ENGINE CAPACITY',
    'CC',
    'CUBIC CAPACITY',
    'CAPACITY (CC)',
    'DISPLACEMENT',
  ],

  yearOfManufacture: [
    'YEAR OF MANUFACTURE',
    'MANUFACTURED YEAR',
    'YEAR MANUFACTURED',
    'MFG YEAR',
    'YOM',
    'YEAR OF MFG',
  ],

  dateOfFirstRegistration: [
    'DATE OF FIRST REGISTRATION',
    'FIRST REGISTRATION DATE',
    'DATE FIRST REGISTERED',
    'DATE OF 1ST REGISTRATION',
  ],

  dateOfRegistration: [
    'DATE OF REGISTRATION',
    'REGISTRATION DATE',
    'DATE REGISTERED',
    'ISSUE DATE',
  ],

  countryOfOrigin: [
    'COUNTRY OF ORIGIN',
    'ORIGIN',
    'COUNTRY MANUFACTURED',
    'COUNTRY OF MANUFACTURE',
    'MADE IN',
  ],

  seatingCapacity: [
    'SEATING CAPACITY',
    'NO OF SEATS',
    'NUMBER OF SEATS',
    'SEATS',
    'PASSENGER CAPACITY',
  ],

  grossWeight: [
    'GROSS WEIGHT',
    'GROSS VEHICLE WEIGHT',
    'GVW',
    'WEIGHT (KG)',
    'MAXIMUM WEIGHT',
  ],

  unladenWeight: [
    'UNLADEN WEIGHT',
    'TARE WEIGHT',
    'EMPTY WEIGHT',
    'NET WEIGHT',
  ],

  wheelBase: [
    'WHEEL BASE',
    'WHEELBASE',
    'WHEEL-BASE',
  ],

  previousOwnerCount: [
    'PREVIOUS OWNERS',
    'PREVIOUS OWNER',
    'NO. OF PREVIOUS OWNERS',
    'NUMBER OF PREVIOUS OWNERS',
    'PREVIOUS OWNERS (OPTION)',
  ],

  overhang: [
    'OVER HANG',
    'OVERHANG',
    'FRONT/REAR OVERHANG',
  ],

  taxationClass: [
    'TAXATION CLASS',
    'TAX CLASS',
    'TAXATION CATEGORY',
  ],

  statusWhenRegistered: [
    'STATUS WHEN REGISTERED',
    'REGISTERED STATUS',
    'CONDITION WHEN REGISTERED',
  ],

  provincialCouncil: [
    'PROVINCIAL COUNCIL',
    'PROVINCE',
    'PROVINCIAL REGION',
  ],

  conditionsSpecialNotes: [
    'CONDITIONS/SPECIAL NOTES',
    'CONDITIONS / SPECIAL NOTES',
    'SPECIAL NOTES',
    'CONDITIONS',
    'REMARKS',
  ],

  taxesPayable: [
    'TAXES PAYABLE',
    'TAX STATUS',
    'TAX PAYABLE',
  ],

  manufacturerDescription: [
    'MANUFACTURES DESCRIPTION',
    "MANUFACTURER'S DESCRIPTION",
    'MANUFACTURER DESCRIPTION',
    'MFR DESCRIPTION',
  ],

  tyreSize: [
    'TYRE SIZE',
    'TYRE SIZE (CM)',
    'TIRE SIZE',
  ],

  dimensions: [
    'LENGTH / WIDTH / HEIGHT',
    'LENGTH/WIDTH/HEIGHT',
    'DIMENSIONS',
    'OVERALL DIMENSIONS',
  ],

  internalHeight: [
    'INTERNAL HEIGHT',
    'INTERNAL HEIGHT (OPTION)',
    'CABIN HEIGHT',
  ],
};
