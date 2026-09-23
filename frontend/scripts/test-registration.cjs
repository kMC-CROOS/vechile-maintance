const fs = require('node:fs');
const ts = require('../node_modules/typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, file);
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { extractSriLankaRegistrationData: extract } = require('../src/services/sriLankaRegistrationExtractionService.ts');
const { normalizeDate, normalizeRegistrationNumber, normalizeWeight } = require('../src/utils/normalizeRegistrationDocumentData.ts');
test('long labels do not populate unrelated owner, class, manufacturer or date fields', () => {
  const { fields: f } = extract("ABSOLUTE OWNER ADDRESS: 12 Main Road\nPREVIOUS OWNERS: 2\nTAXATION CLASS: PRIVATE\nMANUFACTURER'S DESCRIPTION: Passenger vehicle\nDATE OF FIRST REGISTRATION: 15/03/2024");
  assert.equal(f.absoluteOwnerAddress.value, '12 Main Road');
  for (const key of ['currentOwnerName', 'currentOwnerAddress', 'absoluteOwnerName', 'vehicleClass', 'make', 'dateOfRegistration']) assert.equal(f[key].value, null, key);
  assert.equal(f.dateOfFirstRegistration.value, '2024-03-15');
});
test('same row columns and longest aliases retain exact values', () => {
  const { fields: f } = extract('REGISTRATION NO.: WP CAB-1234\nMAKE: TOYOTA  MODEL: COROLLA\nFUEL TYPE: PETROL\nCHASSIS NUMBER: NZE141-1234567\nENGINE NO.: 1NZ-7654321');
  assert.equal(f.registrationNumber.value, 'WP CAB-1234');
  assert.equal(f.make.value, 'TOYOTA');
  assert.equal(f.model.value, 'COROLLA');
  assert.equal(f.fuelType.value, 'Petrol');
  assert.equal(f.chassisNumber.value, 'NZE141-1234567');
  assert.equal(f.engineNumber.value, '1NZ-7654321');
});
test('missing labels, duplicates and invalid values are not guessed', () => {
  const { fields: f } = extract('200012345678\nCAB-1234\nMAKE: TOYOTA\nMAKE: HONDA\nENGINE NUMBER:\nMODEL: CIVIC\nYEAR OF MANUFACTURE: 2O24\nDATE OF FIRST REGISTRATION: 31/02/2024');
  for (const key of ['registrationNumber', 'nicOrIdNumber', 'make', 'engineNumber', 'yearOfManufacture', 'dateOfFirstRegistration']) assert.equal(f[key].value, null, key);
  assert.equal(f.model.value, 'CIVIC');
});
test('next line value and OCR confidence require review', () => {
  const { fields: f } = extract('', [{text:'MAKE', confidence:90}, {text:'HONDA', confidence:42}]);
  assert.equal(f.make.value, 'HONDA');
  assert.equal(f.make.confidence, 0.42);
  assert.equal(f.make.requiresReview, true);
});
test('number and date normalization preserves values without accepting substrings', () => {
  assert.equal(normalizeRegistrationNumber('CAB1234'), 'CAB-1234');
  assert.equal(normalizeRegistrationNumber('text CAB-1234 extra'), null);
  assert.equal(normalizeDate('29/02/2024'), '2024-02-29');
  assert.equal(normalizeDate('29/02/2023'), null);
  assert.equal(normalizeWeight('1380.5 KG'), '1380.5 kg');
});
test('complete labelled document covers every extraction field used by the 29-field form', () => {
  const { FIELD_ALIASES } = require('../src/utils/registrationFieldAliases.ts');
  const expected = {
    registrationNumber: 'WP CAB-1234', currentOwnerName: 'A PERERA', currentOwnerAddress: '12 MAIN ROAD',
    absoluteOwnerName: 'ABC FINANCE', absoluteOwnerAddress: '45 LAKE ROAD', nicOrIdNumber: '200012345678',
    chassisNumber: 'NZE141-1234567', engineNumber: '1NZ-7654321', vehicleClass: 'MOTOR CAR', make: 'TOYOTA',
    model: 'COROLLA', bodyType: 'SALOON', fuelType: 'Petrol', colour: 'WHITE', cylinderCapacity: '1496 cc',
    yearOfManufacture: '2020', dateOfFirstRegistration: '2021-03-15', dateOfRegistration: '2024-03-15',
    countryOfOrigin: 'JAPAN', seatingCapacity: '5', grossWeight: '1700 kg', unladenWeight: '1200 kg',
    wheelBase: '2600 MM', previousOwnerCount: '2', overhang: '900 MM', taxationClass: 'PRIVATE',
    statusWhenRegistered: 'NEW', provincialCouncil: 'WESTERN', conditionsSpecialNotes: 'NONE',
    taxesPayable: 'CLEARED', manufacturerDescription: 'PASSENGER VEHICLE', tyreSize: '195/65R15',
    dimensions: '4500 / 1700 / 1500 MM', internalHeight: '1200 MM',
  };
  const text = Object.entries(expected).map(([key, value]) => `${FIELD_ALIASES[key][0]}: ${value}`).join('\n');
  const result = extract(text);
  for (const [key, value] of Object.entries(expected)) assert.equal(result.fields[key].value, value, key);
  assert.equal(result.mappedCategory, 'Car');
  assert.equal(result.mappedFuelType, 'Petrol');
});
const { locateRCRegions, rcRegionToLines } = require('../src/services/rcBookLayout.ts');
test('RC owner box splits owner, address and NIC without reading previous-owner history', () => {
  const lines = rcRegionToLines('currentOwnerName', 'A PERSON\n12 SAMPLE ROAD\n| 200012345678 |', 80);
  const result = extract(lines.map(l => l.text).join('\n'), lines);
  assert.equal(result.fields.currentOwnerName.value, 'A PERSON');
  assert.equal(result.fields.currentOwnerAddress.value, '12 SAMPLE ROAD');
  assert.equal(result.fields.nicOrIdNumber.value, '200012345678');
});
test('empty cells, certification stamps and unreadable crops produce no filled value', () => {
  assert.deepEqual(rcRegionToLines('absoluteOwnerName', '', 90), []);
  assert.deepEqual(rcRegionToLines('taxesPayable', 'Deputy Commissioner\nDepartment of Motor Traffic', 90), []);
  assert.deepEqual(rcRegionToLines('engineNumber', 'GARBLED123', 20), []);
});
test('bilingual slash labels and printed units do not become field values', () => {
  const result = extract('1. local text / Registration No.\nNP WP-5278\n7. local text/Cylinder Capacity (cc)\n134.6 CC\n15. local text/Manufactures Description\nMOTOR CYCLE');
  assert.equal(result.fields.registrationNumber.value, 'NP WP-5278');
  assert.equal(result.fields.cylinderCapacity.value, '134.6 cc');
  assert.equal(result.fields.manufacturerDescription.value, 'MOTOR CYCLE');
});
test('unrecognized page geometry never uses fixed photo coordinates', () => {
  assert.deepEqual(locateRCRegions([], 900, 1600), []);
});
test('RC regions follow detected columns and scale with image geometry', () => {
  const rows = [
    ['1.', 'Registration No.', '2.', 'Chassis No.'],
    ['6.', 'Engine No.', '7.', 'Cylinder Capacity (cc)'],
    ['8.', 'Class of Vehicle', '9.', 'Taxation Class'],
    ['12.', 'Make', '13.', 'Country of Origin'],
  ];
  const lines = rows.map((row, i) => ({ words: row.map((text, j) => ({ text, confidence: 90,
    bbox: { x0: [45,250,495,680][j], y0: 100+i*100, x1: [60,430,510,860][j], y1: 112+i*100 } })) }));
  const regions = locateRCRegions(lines, 900, 800);
  assert.equal(regions.length, 8);
  const plate = regions.find(r => r.key === 'registrationNumber');
  const chassis = regions.find(r => r.key === 'chassisNumber');
  assert.ok(plate.left + plate.width < chassis.left);
  assert.ok(plate.top > 112 && plate.top + plate.height < 200);
  const doubled = lines.map(l => ({ words: l.words.map(w => ({ ...w,
    bbox: Object.fromEntries(Object.entries(w.bbox).map(([k,v]) => [k,v*2])) })) }));
  const larger = locateRCRegions(doubled, 1800, 1600);
  assert.equal(larger.length, regions.length);
  assert.ok(larger[0].left > regions[0].left);
});
