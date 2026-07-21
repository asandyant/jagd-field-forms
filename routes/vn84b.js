const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// VN84-B data storage order:
// 1) PostgreSQL when VN84B_DATABASE_URL is set (recommended for live field use)
// 2) JSON file fallback for local testing / emergency use only
const TRACKER_KEY = 'vn84b';
const DATABASE_URL = process.env.VN84B_DATABASE_URL || '';
const configuredDataFile = process.env.VN84B_DATA_PATH || '';
const fallbackDataFile = path.join(__dirname, '..', 'data', 'vn84b-tracker.json');
let dataFile = configuredDataFile || fallbackDataFile;
let dataDir = path.dirname(dataFile);
let lastStorageWarning = '';
let pool = null;
let dbReady = false;

function refreshDataPath() {
  dataFile = process.env.VN84B_DATA_PATH || fallbackDataFile;
  dataDir = path.dirname(dataFile);
}

function safeClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}


const officialAreas = [
  {
    id: 'area-a',
    letter: 'A',
    colorName: 'Green',
    color: '#16a34a',
    soft: '#f0fdf4',
    name: 'Area A / Green — Eastbound Mainline & 92nd St Exit',
    shortName: 'Area A / Green',
    description: 'Eastbound Mainline Upper, 92nd St Exit, Ramp F bearing and jacking-related office items.'
  },
  {
    id: 'area-b',
    letter: 'B',
    colorName: 'Yellow',
    color: '#eab308',
    soft: '#fefce8',
    name: 'Area B / Yellow — New Belt Ramps',
    shortName: 'Area B / Yellow',
    description: 'New Belt Ramp connection points, H8 anti-graffiti, fire hose valves, and fire department connections.'
  },
  {
    id: 'area-c',
    letter: 'C',
    colorName: 'Blue',
    color: '#2563eb',
    soft: '#eff6ff',
    name: 'Area C / Blue — Belt Parkway Tangent / SP Ramp',
    shortName: 'Area C / Blue',
    description: 'Belt Parkway Tangent / SP Ramp work. Current field tracking is mainly here: bearings, new crosses, and emergency steel repairs.'
  },
  {
    id: 'area-d',
    letter: 'D',
    colorName: 'Orange',
    color: '#f97316',
    soft: '#fff7ed',
    name: 'Area D / Orange — Existing Belt Parkway Horseshoe',
    shortName: 'Area D / Orange',
    description: 'Existing Belt Parkway Horseshoe work, including KEIM coating, holes, bearings, widening touch-up, blast/paint, and access.'
  },
  {
    id: 'area-e',
    letter: 'E',
    colorName: 'Pink',
    color: '#db2777',
    soft: '#fdf2f8',
    name: 'Area E / Pink — New Yard Entrance & Exit',
    shortName: 'Area E / Pink',
    description: 'New Yard Entrance / Exit, also shown as Ramp N in the payment breakdown.'
  },
  {
    id: 'general',
    letter: '',
    colorName: 'Gray',
    color: '#64748b',
    soft: '#f8fafc',
    name: 'General / Contract-Wide',
    shortName: 'General',
    description: 'General contract items not tied to one field color zone.'
  }
];

function officialAreaById(id) {
  return officialAreas.find(a => a.id === id) || officialAreas[officialAreas.length - 1];
}

function areaMeta(areaId, overrides = {}) {
  const official = officialAreaById(overrides.officialAreaId || 'area-c');
  return {
    officialAreaId: official.id,
    officialAreaLabel: official.shortName,
    officialAreaName: official.name,
    colorName: official.colorName,
    color: official.color,
    soft: official.soft,
    trackingActive: overrides.trackingActive !== undefined ? overrides.trackingActive : true,
    trackingStatus: overrides.trackingStatus || (overrides.trackingActive === false ? 'Future / Not Started' : 'Active Field Tracking'),
    billingQuantity: overrides.billingQuantity ?? null,
    fieldQuantity: overrides.fieldQuantity ?? null,
    quantityNote: overrides.quantityNote || '',
    paymentItemRefs: overrides.paymentItemRefs || []
  };
}


const bearingSubAreas = [
  { id: 'abutment', name: 'Abutment', total: 10 },
  { id: 'sp1', name: 'SP1', total: 20 },
  { id: 'sp2', name: 'SP2', total: 20 },
  { id: 'sp3', name: 'SP3', total: 18 },
  { id: 'sp4', name: 'SP4', total: 18 },
  { id: 'sp5', name: 'SP5', total: 18 },
  { id: 'sp6', name: 'SP6', total: 18 },
  { id: 'sp7', name: 'SP7', total: 18 },
  { id: 'sp8', name: 'SP8', total: 18 },
  { id: 'sp9', name: 'SP9', total: 18 },
  { id: 'sp10', name: 'SP10', total: 18 },
  { id: 'sp11', name: 'SP11', total: 18 },
  { id: 'sp12', name: 'SP12', total: 18 },
  { id: 'sp13', name: 'SP13', total: 18 }
];


const emergencyRepairRows = [
  {
    "id": 1,
    "status": "Not Started",
    "pier": "SP-19",
    "span": "SP-20",
    "betweenStringers": "D-E",
    "members": "F, J1, J2, D",
    "qtyMembers": 4,
    "estimatedSf": 19.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 2,
    "status": "Not Started",
    "pier": "SP-19",
    "span": "SP-20",
    "betweenStringers": "C-D",
    "members": "D",
    "qtyMembers": 1,
    "estimatedSf": 5.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 3,
    "status": "Not Started",
    "pier": "SP-19",
    "span": "SP-20",
    "betweenStringers": "B-C",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 4,
    "status": "Not Started",
    "pier": "SP-19",
    "span": "SP-20",
    "betweenStringers": "A-B",
    "members": "F, J2",
    "qtyMembers": 2,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 5,
    "status": "Not Started",
    "pier": "SP-19",
    "span": "SP-19",
    "betweenStringers": "D-E",
    "members": "F, J2",
    "qtyMembers": 2,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 6,
    "status": "Not Started",
    "pier": "SP-19",
    "span": "SP-19",
    "betweenStringers": "C-D",
    "members": "F, J1",
    "qtyMembers": 2,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 7,
    "status": "Not Started",
    "pier": "SEE NOTE 4",
    "span": "SP-19",
    "betweenStringers": "C-D",
    "members": "ALL",
    "qtyMembers": 13,
    "estimatedSf": 57.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 8,
    "status": "Not Started",
    "pier": "SP-13",
    "span": "SP-14",
    "betweenStringers": "C-D",
    "members": "B2",
    "qtyMembers": 1,
    "estimatedSf": 4.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 9,
    "status": "Not Started",
    "pier": "SP-13",
    "span": "SP-13",
    "betweenStringers": "G-H",
    "members": "H, E",
    "qtyMembers": 2,
    "estimatedSf": 10.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 10,
    "status": "Not Started",
    "pier": "SP-13",
    "span": "SP-13",
    "betweenStringers": "F-G",
    "members": "D, F, J1, J2",
    "qtyMembers": 4,
    "estimatedSf": 19.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 11,
    "status": "Not Started",
    "pier": "SP-13",
    "span": "SP-13",
    "betweenStringers": "D-E",
    "members": "J2",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 12,
    "status": "Not Started",
    "pier": "SP-13",
    "span": "SP-13",
    "betweenStringers": "B-C",
    "members": "D, F, J1, J2",
    "qtyMembers": 4,
    "estimatedSf": 19.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 13,
    "status": "Not Started",
    "pier": "SP-13",
    "span": "SP-13",
    "betweenStringers": "A-B",
    "members": "B1, D, F, J1, J2",
    "qtyMembers": 5,
    "estimatedSf": 23.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Original Repair",
    "repairClassShort": "Blue / Original"
  },
  {
    "id": 14,
    "status": "Not Started",
    "pier": "SP-11",
    "span": "SP-12",
    "betweenStringers": "G-H",
    "members": "J2",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 15,
    "status": "Not Started",
    "pier": "SP-11",
    "span": "SP-11",
    "betweenStringers": "G-H",
    "members": "B2, F, J1, J2",
    "qtyMembers": 4,
    "estimatedSf": 18.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 16,
    "status": "Not Started",
    "pier": "SP-11",
    "span": "SP-11",
    "betweenStringers": "D-E",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 17,
    "status": "Not Started",
    "pier": "SP-8",
    "span": "SP-9",
    "betweenStringers": "G-H",
    "members": "F, J2",
    "qtyMembers": 2,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 18,
    "status": "Not Started",
    "pier": "SP-9",
    "span": "SP-9",
    "betweenStringers": "G-H",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 19,
    "status": "Not Started",
    "pier": "SP-9",
    "span": "SP-9",
    "betweenStringers": "F-G",
    "members": "F, J1",
    "qtyMembers": 2,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 20,
    "status": "Not Started",
    "pier": "SP-8",
    "span": "SP-9",
    "betweenStringers": "F-G",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 21,
    "status": "Not Started",
    "pier": "SP-8",
    "span": "SP-9",
    "betweenStringers": "E-F",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 22,
    "status": "Not Started",
    "pier": "SP-9",
    "span": "SP-9",
    "betweenStringers": "E-F",
    "members": "F, J1",
    "qtyMembers": 2,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 23,
    "status": "Not Started",
    "pier": "SP-9",
    "span": "SP-9",
    "betweenStringers": "D-E",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 24,
    "status": "Not Started",
    "pier": "SP-8",
    "span": "SP-9",
    "betweenStringers": "D-E",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 25,
    "status": "Not Started",
    "pier": "SP-8",
    "span": "SP-9",
    "betweenStringers": "C-D",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 26,
    "status": "Not Started",
    "pier": "SP-9",
    "span": "SP-9",
    "betweenStringers": "C-D",
    "members": "F, J2",
    "qtyMembers": 2,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 27,
    "status": "Not Started",
    "pier": "SP-9",
    "span": "SP-9",
    "betweenStringers": "B-C",
    "members": "F, J1",
    "qtyMembers": 2,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 28,
    "status": "Not Started",
    "pier": "SP-9",
    "span": "SP-9",
    "betweenStringers": "A-B",
    "members": "F, J1",
    "qtyMembers": 2,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 29,
    "status": "Not Started",
    "pier": "SP-8",
    "span": "SP-9",
    "betweenStringers": "A-B",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 30,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-8",
    "betweenStringers": "G-H",
    "members": "B2",
    "qtyMembers": 1,
    "estimatedSf": 4.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 31,
    "status": "Not Started",
    "pier": "SP-8",
    "span": "SP-8",
    "betweenStringers": "E-F",
    "members": "G, I",
    "qtyMembers": 2,
    "estimatedSf": 10.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 32,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-8",
    "betweenStringers": "D-E",
    "members": "J1, J2",
    "qtyMembers": 2,
    "estimatedSf": 6.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 33,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-8",
    "betweenStringers": "C-D",
    "members": "J2",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 34,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-8",
    "betweenStringers": "B-C",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 35,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-8",
    "betweenStringers": "A-B",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 36,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-7",
    "betweenStringers": "G-H",
    "members": "J2",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 37,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-7",
    "betweenStringers": "F-G",
    "members": "J2",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 38,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-7",
    "betweenStringers": "E-F",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 39,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-7",
    "betweenStringers": "D-E",
    "members": "J2",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 40,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-7",
    "betweenStringers": "C-D",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 41,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-7",
    "betweenStringers": "B-C",
    "members": "J1",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 42,
    "status": "Not Started",
    "pier": "SP-7",
    "span": "SP-7",
    "betweenStringers": "A-B",
    "members": "F, H, I, C",
    "qtyMembers": 4,
    "estimatedSf": 22.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 43,
    "status": "Not Started",
    "pier": "SP-5",
    "span": "SP-5",
    "betweenStringers": "G-H",
    "members": "B1, B2, J2",
    "qtyMembers": 3,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 44,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-5",
    "betweenStringers": "G-H",
    "members": "B1, B2, J1",
    "qtyMembers": 3,
    "estimatedSf": 11.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 45,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-5",
    "betweenStringers": "F-G",
    "members": "B1, J1, I",
    "qtyMembers": 3,
    "estimatedSf": 13.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 46,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-5",
    "betweenStringers": "E-F",
    "members": "J2",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 47,
    "status": "Not Started",
    "pier": "SP-5",
    "span": "SP-5",
    "betweenStringers": "D-E",
    "members": "J2",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 48,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-5",
    "betweenStringers": "C-D",
    "members": "J1",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 49,
    "status": "Not Started",
    "pier": "SP-5",
    "span": "SP-5",
    "betweenStringers": "A-B",
    "members": "B2",
    "qtyMembers": 1,
    "estimatedSf": 4.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 50,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-4",
    "betweenStringers": "H-J",
    "members": "F, H, I, A1, A2, B1, B2, J1, J2, C",
    "qtyMembers": 10,
    "estimatedSf": 44.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 51,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-4",
    "betweenStringers": "H-J",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 52,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-4",
    "betweenStringers": "G-H",
    "members": "F, J1, J2, H, I, B1, C",
    "qtyMembers": 7,
    "estimatedSf": 32.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 53,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-4",
    "betweenStringers": "G-H",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 54,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-4",
    "betweenStringers": "F-G",
    "members": "F, J1, J2, H, I, B2, C",
    "qtyMembers": 7,
    "estimatedSf": 32.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 55,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-4",
    "betweenStringers": "F-G",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 56,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-4",
    "betweenStringers": "E-F",
    "members": "F, J1, J2, H, I, C",
    "qtyMembers": 6,
    "estimatedSf": 28.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 57,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-4",
    "betweenStringers": "E-F",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 58,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-4",
    "betweenStringers": "D-E",
    "members": "F, J1, J2, H, I, B2, C",
    "qtyMembers": 7,
    "estimatedSf": 32.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 59,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-4",
    "betweenStringers": "D-E",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 60,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-4",
    "betweenStringers": "C-D",
    "members": "F, J1, J2, H, I, B2, C",
    "qtyMembers": 7,
    "estimatedSf": 32.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 61,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-4",
    "betweenStringers": "C-D",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 62,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-4",
    "betweenStringers": "B-C",
    "members": "F, J1, J2, H, I, C",
    "qtyMembers": 6,
    "estimatedSf": 28.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 63,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-4",
    "betweenStringers": "B-C",
    "members": "F, J1, J2",
    "qtyMembers": 3,
    "estimatedSf": 14.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 64,
    "status": "Not Started",
    "pier": "SP-4",
    "span": "SP-4",
    "betweenStringers": "A-B",
    "members": "F, J1, J2, H, I, C",
    "qtyMembers": 6,
    "estimatedSf": 28.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 65,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-4",
    "betweenStringers": "A-B",
    "members": "F, J1, J2, D",
    "qtyMembers": 4,
    "estimatedSf": 19.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 66,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-3",
    "betweenStringers": "J-K",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 67,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-3",
    "betweenStringers": "H-J",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 68,
    "status": "Not Started",
    "pier": "SP-2A",
    "span": "SP-3",
    "betweenStringers": "H-J",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 69,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-3",
    "betweenStringers": "G-H",
    "members": "J1",
    "qtyMembers": 1,
    "estimatedSf": 3.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 70,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-3",
    "betweenStringers": "G-H",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 71,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-3",
    "betweenStringers": "F-G",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 72,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-3",
    "betweenStringers": "D-E",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 73,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-3",
    "betweenStringers": "C-D",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 74,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-3",
    "betweenStringers": "B-C",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 75,
    "status": "Not Started",
    "pier": "SP-3",
    "span": "SP-3",
    "betweenStringers": "A-B",
    "members": "F",
    "qtyMembers": 1,
    "estimatedSf": 8.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 76,
    "status": "Not Started",
    "pier": "SP-1A",
    "span": "SP-2",
    "betweenStringers": "J-K",
    "members": "ALL",
    "qtyMembers": 13,
    "estimatedSf": 57.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 77,
    "status": "Not Started",
    "pier": "SP-1A",
    "span": "SP-2",
    "betweenStringers": "H-J",
    "members": "ALL",
    "qtyMembers": 13,
    "estimatedSf": 57.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 78,
    "status": "Not Started",
    "pier": "SP-2A",
    "span": "SP-3",
    "betweenStringers": "G-H",
    "members": "H, I, D, F, C",
    "qtyMembers": 5,
    "estimatedSf": 27.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 79,
    "status": "Not Started",
    "pier": "SP-1A",
    "span": "SP-2",
    "betweenStringers": "G-H",
    "members": "ALL",
    "qtyMembers": 13,
    "estimatedSf": 57.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 80,
    "status": "Not Started",
    "pier": "SP-1A",
    "span": "SP-2",
    "betweenStringers": "F-G",
    "members": "ALL",
    "qtyMembers": 13,
    "estimatedSf": 57.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 81,
    "status": "Not Started",
    "pier": "SP-1B",
    "span": "SP-2",
    "betweenStringers": "D-E",
    "members": "ALL",
    "qtyMembers": 13,
    "estimatedSf": 57.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 82,
    "status": "Not Started",
    "pier": "SP-1B",
    "span": "SP-2",
    "betweenStringers": "C-D",
    "members": "ALL",
    "qtyMembers": 13,
    "estimatedSf": 57.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 83,
    "status": "Not Started",
    "pier": "SP-1B",
    "span": "SP-2",
    "betweenStringers": "B-C",
    "members": "ALL",
    "qtyMembers": 13,
    "estimatedSf": 57.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 84,
    "status": "Not Started",
    "pier": "SP-1B",
    "span": "SP-2",
    "betweenStringers": "A-B",
    "members": "D",
    "qtyMembers": 1,
    "estimatedSf": 5.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 85,
    "status": "Not Started",
    "pier": "SP-1B",
    "span": "SP-1",
    "betweenStringers": "C-D",
    "members": "D",
    "qtyMembers": 1,
    "estimatedSf": 5.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  },
  {
    "id": 86,
    "status": "Not Started",
    "pier": "SP-1B",
    "span": "SP-2",
    "betweenStringers": "A-B",
    "members": "D",
    "qtyMembers": 1,
    "estimatedSf": 5.0,
    "crewDays": 0.25,
    "laborCost": 1000.0,
    "sfPriceTotal": 0.0,
    "priority": "Field Verify",
    "source": "Drawing page 7 / DU08A-CS-452",
    "fieldVerified": "No",
    "completedDate": "",
    "notes": "",
    "updatedAt": "",
    "enteredBy": "",
    "history": [],
    "repairClass": "Additional Repair",
    "repairClassShort": "Red / Additional"
  }
];


const paymentBreakdown = {
  id: 'vn84b-payment-breakdown',
  name: 'VN84-B Official Area Payment Breakdown',
  source: 'VN-84B_Payment_Breakdown_06.30.26.xlsx and Defoe Item Comp.xlsx',
  officeNote: 'Official PRDCO1 colors now used throughout: Area A Green, Area B Yellow, Area C Blue, Area D Orange, Area E Pink. Emergency Steel Repairs red/blue is a separate repair-class legend from the repair drawing.',
  contractTotal: 11970600,
  period: '6.01.26 - 6.30.26',
  approvedToDate: 25000,
  officialAreas: officialAreas,
  sections: [
    { id: 'general', officialAreaId: 'general', name: 'General / Contract-Wide', colorName: 'Gray', color: '#64748b', total: 25000, progressAreaIds: [], description: 'General work plan item not tied to a field color area.' },
    { id: 'area-a-green', officialAreaId: 'area-a', name: 'Area A / Green — Eastbound Mainline & 92nd St Exit', colorName: 'Green', color: '#16a34a', total: 922700, progressAreaIds: ['area-a-ebu-bearings'], description: 'EBU Mainline Upper / 92nd St Exit / Ramp F items. Bearing quantity currently shown as an office item until field tracking starts.' },
    { id: 'area-b-yellow', officialAreaId: 'area-b', name: 'Area B / Yellow — New Belt Ramps', colorName: 'Yellow', color: '#eab308', total: 851200, progressAreaIds: ['area-b-new-belt-ramps'], description: 'New Belt Ramp connections, H8 anti-graffiti, fire hose valves, and fire department connections.' },
    { id: 'area-c-blue', officialAreaId: 'area-c', name: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', colorName: 'Blue', color: '#2563eb', total: 6898330, progressAreaIds: ['blue-bridge-87', 'belt-parkway-bearings', 'blue-bridge-237-crosses'], description: 'Main active field area so far. Includes SP Ramp / Belt Parkway bearings, new crosses, tangent steel repair paint, tangent KEIM, access, and future jacking.' },
    { id: 'area-d-orange', officialAreaId: 'area-d', name: 'Area D / Orange — Existing Belt Parkway Horseshoe', colorName: 'Orange', color: '#f97316', total: 3073920, progressAreaIds: ['orange-bridge-piers', 'area-d-horseshoe-bearings'], description: 'Existing Belt Parkway Horseshoe items: holes, KEIM coating, bearings, widening touch-up, blast/paint, and access.' },
    { id: 'area-e-pink', officialAreaId: 'area-e', name: 'Area E / Pink — New Yard Entrance & Exit / Ramp N', colorName: 'Pink', color: '#db2777', total: 199450, progressAreaIds: ['area-e-yard-ramp-bearings'], description: 'Ramp N / Yard Ramp items: touch-up, cut lines, and de-lead bearings.' }
  ],
  items: [
    { item: 1, sectionId: 'general', officialAreaId: 'general', description: 'Work plans', amount: 25000 },
    { item: 2, sectionId: 'area-b-yellow', officialAreaId: 'area-b', description: 'New Belt Ramp - Clean & Paint All New Connection Points per Spec Sections 09930 & 09940', amount: 775000 },
    { item: 3, sectionId: 'area-b-yellow', officialAreaId: 'area-b', description: 'Anti-Graffiti of H8', amount: 7200 },
    { item: 4, sectionId: 'area-b-yellow', officialAreaId: 'area-b', description: 'Clean, prep & paint fire hose valve Stations per Spec Sections 02082, 09931 & 09940', amount: 54000 },
    { item: 5, sectionId: 'area-b-yellow', officialAreaId: 'area-b', description: 'Clean, prep & paint fire department connections per Spec Sections 02082, 09931 & 09940', amount: 15000 },
    { item: 6, sectionId: 'area-c-blue', officialAreaId: 'area-c', description: 'Clean, prep & paint Belt parkway tangent holes per Spec Sections 02082, 09931 & 09940', amount: 44080 },
    { item: 7, sectionId: 'area-c-blue', officialAreaId: 'area-c', description: 'Belt parkway tangent - Keim coat per spec section 09930', amount: 610000 },
    { item: 8, sectionId: 'area-c-blue', officialAreaId: 'area-c', description: 'Anti-Graffiti of SP piers in the park and along Fort Hamilton', amount: 77500 },
    { item: 9, sectionId: 'area-c-blue', officialAreaId: 'area-c', description: 'Clean, prep & paint Belt parkway tangent steel repairs per spec section 02082, 09931 & 00940', amount: 78000, trackerLink: 'Area C / Blue — Emergency Steel Repairs' },
    { item: 10, sectionId: 'area-c-blue', officialAreaId: 'area-c', description: 'Clean, prep & paint Belt parkway tangent bearings per spec section 02082, 09931 & 00940', amount: 118750, trackerLink: 'Area C / Blue — SP Ramp Bearings' },
    { item: 11, sectionId: 'area-c-blue', officialAreaId: 'area-c', description: 'Belt Parkway tangent - Localized paint removal (Jacking Locations) per spec sections 02082, 09931 & 09940', amount: 175000, trackerLink: 'Future / Not Started — Area C Jacking Locations' },
    { item: 12, sectionId: 'area-c-blue', officialAreaId: 'area-c', description: 'Belt Parkway Tangent - Localized Paint Removal (At Widening Connections) per Spec Sections 02082, 09931 & 09940', amount: 75000 },
    { item: 13, sectionId: 'area-c-blue', officialAreaId: 'area-c', description: 'Belt Parkway Tangent - Blast & Paint per Spec Sections 02082, 09931 & 09940', amount: 3320000 },
    { item: 14, sectionId: 'area-c-blue', officialAreaId: 'area-c', description: 'Belt Parkway Tangent - Access Platform', amount: 2400000 },
    { item: 15, sectionId: 'area-d-orange', officialAreaId: 'area-d', description: 'Clean, Prep & Paint Belt Parkway Horseshoe Holes per Spec Sections 02082, 09931 & 09940', amount: 30720 },
    { item: 16, sectionId: 'area-d-orange', officialAreaId: 'area-d', description: 'Belt Parkway Horseshoe - Keim Coating per Spec Section 09930', amount: 403200, trackerLink: 'Area D / Orange — Horseshoe Piers / KEIM Coating' },
    { item: 17, sectionId: 'area-d-orange', officialAreaId: 'area-d', description: 'Clean, Prep & Paint Belt Parkway Horseshoe Bearings per Spec Sections 02082, 09931 & 09940', amount: 90000, trackerLink: 'Area D / Orange — Horseshoe Bearings' },
    { item: 18, sectionId: 'area-d-orange', officialAreaId: 'area-d', description: 'Belt Parkway Horseshoe Localized Paint Removal (At Widening Connections) per Spec Sections 02082, 09931 & 09940', amount: 145000 },
    { item: 19, sectionId: 'area-d-orange', officialAreaId: 'area-d', description: 'Belt Parkway Horseshoe - Blast & Paint per Spec Sections 02082, 09931 & 09940', amount: 1500000 },
    { item: 20, sectionId: 'area-d-orange', officialAreaId: 'area-d', description: 'Belt Parkway Horseshoe - Access Platform', amount: 905000 },
    { item: 21, sectionId: 'area-a-green', officialAreaId: 'area-a', description: 'Clean, Prep & Paint EBU Mainline Upper/92nd St Exit Holes per Spec Sections 02082, 09931 & 09940', amount: 127200 },
    { item: 22, sectionId: 'area-a-green', officialAreaId: 'area-a', description: 'Clean, Prep & Paint EBU Mainline Upper/92nd St Exit Holes per Spec Sections 02082, 09931 & 09940', amount: 14400 },
    { item: 23, sectionId: 'area-a-green', officialAreaId: 'area-a', description: 'EBU Mainline Upper/92nd St Exit Bearings per Spec Sections 02082, 09931 & 09940', amount: 60625, trackerLink: 'Area A / Green — EBU / 92nd / Ramp F Bearings' },
    { item: 24, sectionId: 'area-a-green', officialAreaId: 'area-a', description: 'EBU Mainline Upper/92nd St Exit Localized Paint Removal (Jacking Locations) per Spec Sections 02082, 09931 & 09940', amount: 23250, trackerLink: 'Future / Not Started — Area A Jacking-Related' },
    { item: 25, sectionId: 'area-a-green', officialAreaId: 'area-a', description: 'Clean, Prep & Paint EBU Mainline Upper/92nd St Exit Touch-Up (Floorbeam Extensions) per Spec Sections 02082, 09931 & 09940', amount: 194000 },
    { item: 26, sectionId: 'area-a-green', officialAreaId: 'area-a', description: 'EBU Mainline Upper/92nd St Exit Localized Paint Removal (At Widening Connections) per Spec Sections 02082, 09931 & 09940', amount: 255225 },
    { item: 27, sectionId: 'area-a-green', officialAreaId: 'area-a', description: 'Access Platform for Jack & Ped Work', amount: 248000 },
    { item: 29, sectionId: 'area-e-pink', officialAreaId: 'area-e', description: 'Clean, Prep & Paint Ramp N Touch-Up (Connections) per Spec Sections 02082, 09931 & 09940', amount: 95700 },
    { item: 30, sectionId: 'area-e-pink', officialAreaId: 'area-e', description: 'Ramp N Localized Paint Removal (Cut Lines) per Spec Sections 02082, 09931 & 09940', amount: 72500 },
    { item: 31, sectionId: 'area-e-pink', officialAreaId: 'area-e', description: 'Ramp N - De-Lead Bearings per Spec Sections 02082, 09931 & 09940', amount: 31250, trackerLink: 'Area E / Pink — Yard Ramp Bearings' }
  ],
  bearingBreakdown: [
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', trackerAreaId: 'belt-parkway-bearings', trackerName: 'SP Ramp Bearings', billingQuantity: 190, fieldQuantity: 248, unit: 'EA', source: 'Defoe: 92 EA + 98 EA; tracker: Abutment + SP1–SP13', note: 'Keep existing SP field entries. Billing and drawing/field quantities differ; show both.' },
    { officialAreaId: 'area-d', area: 'Area D / Orange — Existing Belt Parkway Horseshoe', trackerAreaId: 'area-d-horseshoe-bearings', trackerName: 'Horseshoe Bearings', billingQuantity: 144, fieldQuantity: 144, unit: 'EA', source: 'Defoe: 74 EA + 70 EA', note: 'New official-area bucket; no field progress entered yet.' },
    { officialAreaId: 'area-a', area: 'Area A / Green — EBU / 92nd St / Ramp F', trackerAreaId: 'area-a-ebu-bearings', trackerName: 'EBU / 92nd / Ramp F Bearings', billingQuantity: 97, fieldQuantity: 97, unit: 'EA', source: 'Defoe: 60 EA Power Tool Cleaning + 30 EA Ramp F + 7 EA Ramp F', note: 'Office quantity group; field tracking can be started when work begins.' },
    { officialAreaId: 'area-e', area: 'Area E / Pink — Yard Ramp / Ramp N', trackerAreaId: 'area-e-yard-ramp-bearings', trackerName: 'Yard Ramp Bearings', billingQuantity: 50, fieldQuantity: 50, unit: 'EA', source: 'Defoe: 25 EA + 25 EA', note: 'Office quantity group; field tracking can be started when work begins.' }
  ],
  defoeComparison: [
    { officialAreaId: 'area-b', area: 'Area B / Yellow — New Belt Ramps', bidItem: 10155901, description: 'Anti-Graffiti of H8', quantity: 250, unit: 'SF', note: 'Need to Bid' },
    { officialAreaId: 'area-b', area: 'Area B / Yellow — New Belt Ramps', bidItem: 10257201, description: 'Touch Up', quantity: 4200, unit: 'SF', note: 'Connections' },
    { officialAreaId: 'area-b', area: 'Area B / Yellow — New Belt Ramps', bidItem: 10257201, description: 'Touch Up - Adjustments whole job', quantity: 10036, unit: 'SF', note: 'Need to Bid' },
    { officialAreaId: 'area-b', area: 'Area B / Yellow — New Belt Ramps', bidItem: 10257201, description: 'Touch Up - Adjustments H&D', quantity: 4460.64, unit: 'SF', note: 'Connections' },
    { officialAreaId: 'area-b', area: 'Area B / Yellow — New Belt Ramps', bidItem: 10866201, description: 'Paint Fire Standpipe System / Valves', quantity: 1, unit: 'LS', note: 'Bid item' },
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', bidItem: 20120202, description: 'Paint Holes', quantity: 1102, unit: 'EA', note: 'Need to Bid' },
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', bidItem: 20355901, description: 'KEIM Coating of SP Piers SP Abut to SP-12', quantity: 36260, unit: 'SF', note: 'We have 18,000 SF' },
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', bidItem: 20355901, description: 'Anti-Graffiti of SP Piers in the park and along Fort Hamilton Parkway', quantity: 7000, unit: 'SF', note: 'Need to Bid' },
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', bidItem: 20356401, description: 'Touch Up Painting', quantity: 210, unit: 'SF', note: 'Paint for Steel Repairs' },
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', bidItem: 20456502, description: 'Localized Paint Removal', quantity: 92, unit: 'EA', note: 'Bearings' },
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', bidItem: 20456503, description: 'Localized Paint Removal', quantity: 98, unit: 'EA', note: 'Bearings' },
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', bidItem: 20458501, description: 'Localized Paint Removal (Jacking Locations)', quantity: 2500, unit: 'SF', note: 'Need to Bid / future' },
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', bidItem: 20557201, description: 'Touch Up / Localized Paint Removal at Widening Connection', quantity: 1490, unit: 'SF', note: '465 SF + 1025 SF' },
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', bidItem: 21157201, description: 'Structural Steel Paint System', quantity: 228000, unit: 'SF', note: 'We have 220,000 SF' },
    { officialAreaId: 'area-c', area: 'Area C / Blue — Belt Parkway Tangent / SP Ramp', bidItem: 21463402, description: 'Secondary Protective Shielding (SafeSpan)', quantity: 83024, unit: 'SF', note: 'We have 88,500 SF' },
    { officialAreaId: 'area-d', area: 'Area D / Orange — Existing Belt Parkway Horseshoe', bidItem: 30120202, description: 'Paint Holes', quantity: 768, unit: 'EA', note: 'Need to Bid' },
    { officialAreaId: 'area-d', area: 'Area D / Orange — Existing Belt Parkway Horseshoe', bidItem: 30355901, description: 'KEIM Coating of SP Piers SP Abut to SP-12', quantity: 25200, unit: 'SF', note: 'We have 15,500 SF' },
    { officialAreaId: 'area-d', area: 'Area D / Orange — Existing Belt Parkway Horseshoe', bidItem: 30356401, description: 'Touch Up Painting', quantity: 120, unit: 'SF', note: 'Continuation of steel repairs from above item' },
    { officialAreaId: 'area-d', area: 'Area D / Orange — Existing Belt Parkway Horseshoe', bidItem: 30456502, description: 'Localized Paint Removal', quantity: 74, unit: 'EA', note: 'Bearings' },
    { officialAreaId: 'area-d', area: 'Area D / Orange — Existing Belt Parkway Horseshoe', bidItem: 30456503, description: 'Localized Paint Removal', quantity: 70, unit: 'EA', note: 'Bearings' },
    { officialAreaId: 'area-d', area: 'Area D / Orange — Existing Belt Parkway Horseshoe', bidItem: 30557201, description: 'Touch Up / Localized Paint Removal at Widening Connection', quantity: 2660, unit: 'SF', note: '1290 SF + 1370 SF' },
    { officialAreaId: 'area-d', area: 'Area D / Orange — Existing Belt Parkway Horseshoe', bidItem: 31157201, description: 'Structural Steel Paint System', quantity: 126000, unit: 'SF', note: 'We have 95,000 SF' },
    { officialAreaId: 'area-d', area: 'Area D / Orange — Existing Belt Parkway Horseshoe', bidItem: 31363402, description: 'Secondary Protective Shielding (SafeSpan)', quantity: 54525, unit: 'SF', note: 'We have 39,000 SF' },
    { officialAreaId: 'area-a', area: 'Area A / Green — Eastbound Mainline & 92nd St Exit', bidItem: 40120202, description: 'Paint Holes - EBU', quantity: 768, unit: 'EA', note: 'Need to Bid' },
    { officialAreaId: 'area-a', area: 'Area A / Green — Eastbound Mainline & 92nd St Exit', bidItem: 40220201, description: 'Paint Holes - 92nd St', quantity: 768, unit: 'EA', note: 'Need to Bid' },
    { officialAreaId: 'area-a', area: 'Area A / Green — Eastbound Mainline & 92nd St Exit', bidItem: 40555502, description: 'Power Tool Cleaning', quantity: 60, unit: 'EA', note: 'Bearings' },
    { officialAreaId: 'area-a', area: 'Area A / Green — Eastbound Mainline & 92nd St Exit', bidItem: 40556502, description: 'Localized Lead Abatement (Ramp F)', quantity: 30, unit: 'EA', note: 'Bearings' },
    { officialAreaId: 'area-a', area: 'Area A / Green — Eastbound Mainline & 92nd St Exit', bidItem: 40556502, description: 'Localized Lead Abatement / Touch Up (Jacking)', quantity: 440, unit: 'SF', note: '220 SF abatement + 220 SF touch-up' },
    { officialAreaId: 'area-a', area: 'Area A / Green — Eastbound Mainline & 92nd St Exit', bidItem: 40556503, description: 'Localized Lead Abatement (Ramp F)', quantity: 7, unit: 'EA', note: 'Bearings' },
    { officialAreaId: 'area-a', area: 'Area A / Green — Eastbound Mainline & 92nd St Exit', bidItem: 40556503, description: 'Localized Lead Abatement / Touch Up (Jacking)', quantity: 180, unit: 'SF', note: '90 SF abatement + 90 SF touch-up' },
    { officialAreaId: 'area-a', area: 'Area A / Green — Eastbound Mainline & 92nd St Exit', bidItem: 40757201, description: 'Touch Up / Localized Paint Removal at Widening Connection', quantity: 5843, unit: 'SF', note: '2440 SF + 3403 SF' },
    { officialAreaId: 'area-a', area: 'Area A / Green — Eastbound Mainline & 92nd St Exit', bidItem: 41363402, description: 'Access Platform for Jack & Ped Work', quantity: 1600, unit: 'SF', note: 'Need to Bid' },
    { officialAreaId: 'area-e', area: 'Area E / Pink — New Yard Entrance & Exit / Ramp N', bidItem: 50120202, description: 'Paint Holes', quantity: 768, unit: 'EA', note: 'Need to Bid' },
    { officialAreaId: 'area-e', area: 'Area E / Pink — New Yard Entrance & Exit / Ramp N', bidItem: 50357201, description: 'Touch Up', quantity: 220, unit: 'SF', note: 'Connections' },
    { officialAreaId: 'area-e', area: 'Area E / Pink — New Yard Entrance & Exit / Ramp N', bidItem: 50358901, description: 'Localized Paint Removal', quantity: 1518, unit: 'SF', note: 'Cut Lines' },
    { officialAreaId: 'area-e', area: 'Area E / Pink — New Yard Entrance & Exit / Ramp N', bidItem: 50456502, description: 'Localized Paint Removal', quantity: 25, unit: 'EA', note: 'Bearings' },
    { officialAreaId: 'area-e', area: 'Area E / Pink — New Yard Entrance & Exit / Ramp N', bidItem: 50456503, description: 'Localized Paint Removal', quantity: 25, unit: 'EA', note: 'Bearings' }
  ]
};

const defaultEmergencySteelRepairs = {
  id: 'emergency-steel-repairs',
  name: 'Emergency Steel Repairs',
  contract: 'VN84-B',
  bridge: 'Verrazzano-Narrows Bridge',
  description: 'Area C / Blue — extra Belt Parkway Ramp SP end cross frame steel repairs outside JAGD original contract.',
  source: 'VN-84B Belt Parkway Ramp SP End Cross Frame Repairs / DU08A-CS-452',
  officialAreaId: 'area-c',
  officialAreaLabel: 'Area C / Blue — Belt Parkway Tangent / SP Ramp',
  drawingNote: 'Official area is Area C / Blue. Repair-class colors stay separate: Red indicates additional repairs; Blue indicates original repairs. The field clicks member pills to update completed pieces.',
  repairLocations: 86,
  estimatedMemberPieces: 300,
  estimatedSf: 1413,
  estimatedCrewDays: 21.5,
  estimatedLaborCost: 86000,
  statuses: ['Not Started', 'Field Verified', 'Access Ready', 'Material Released', 'Prep / Removal', 'Installed', 'Bolt / Torque / QC', 'Coating Touch-Up', 'Complete', 'Hold / Issue'],
  repairs: emergencyRepairRows,
  activityLog: []
};

const defaultData = {
  contract: 'VN84-B',
  bridge: 'Verrazzano-Narrows Bridge',
  trackerVersion: 'V19 Official Area Full Dropdown',
  updatedAt: null,
  officialAreas: safeClone(officialAreas),
  areas: [
    {
      id: 'blue-bridge-87',
      name: 'Area C / Blue — Belt Parkway Tangent / Steel Repair Painting',
      description: 'Area C / Blue current field scope. Formerly shown as Blue Bridge 87. Steel repair painting broken into Power Tool Prep, Zinc, Midcoat, and Finish Coat.',
      unitLabel: 'locations',
      total: 87,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: [],
      ...areaMeta('blue-bridge-87', { officialAreaId: 'area-c', fieldQuantity: 87, quantityNote: 'Original field tracker quantity retained so prior entries remain intact.', paymentItemRefs: [9] })
    },
    {
      id: 'belt-parkway-bearings',
      name: 'Area C / Blue — SP Ramp Bearings',
      description: 'Area C / Blue bearing tracker. Field/drawing quantity is 248 bearings broken out by Abutment and SP1–SP13. Billing comparison quantity from Defoe is 190 EA.',
      unitLabel: 'bearings',
      total: 248,
      subAreas: bearingSubAreas,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: [],
      ...areaMeta('belt-parkway-bearings', { officialAreaId: 'area-c', billingQuantity: 190, fieldQuantity: 248, quantityNote: 'Field/drawing tracker has 248 bearings (Abutment + SP1–SP13). Defoe/payment comparison shows 92 EA + 98 EA = 190 EA. Do not erase existing field entries.', paymentItemRefs: [10] })
    },
    {
      id: 'blue-bridge-237-crosses',
      name: 'Area C / Blue — New Crosses / Cross Frame Work',
      description: 'Area C / Blue new crosses / cross frame production, power tool prep, zinc, midcoat, and finish coat.',
      unitLabel: 'crosses',
      total: 237,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: [],
      ...areaMeta('blue-bridge-237-crosses', { officialAreaId: 'area-c', fieldQuantity: 237, quantityNote: 'Original field tracker quantity retained.', paymentItemRefs: [9, 13] })
    },
    {
      id: 'orange-bridge-piers',
      name: 'Area D / Orange — Horseshoe Piers / KEIM Coating',
      description: 'Area D / Orange Horseshoe piers. Formerly shown as Orange Bridge Piers. 25,200 SF across 9 piers; power tool prep, zinc, midcoat, and finish coat retained for field tracking.',
      unitLabel: 'sq ft',
      total: 25200,
      pierCount: 9,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: [],
      ...areaMeta('orange-bridge-piers', { officialAreaId: 'area-d', billingQuantity: 25200, fieldQuantity: 25200, quantityNote: 'Matches Horseshoe KEIM/paint-related quantity from the new office info.', paymentItemRefs: [16] })
    },
    {
      id: 'belt-parkway-jacking',
      name: 'Area C / Blue — Jacking Locations',
      description: 'Area C / Blue future scope. 13 jacking locations, power tool prep only. No jacking production has started per field update.',
      unitLabel: 'piers',
      total: 13,
      stages: ['Power Tool Prep'],
      items: [],
      ...areaMeta('belt-parkway-jacking', { officialAreaId: 'area-c', trackingActive: false, trackingStatus: 'Future / Not Started — no field production yet', billingQuantity: 2500, fieldQuantity: 13, quantityNote: 'Field tracker is 13 jacking locations; Defoe/payment comparison references 2,500 SF localized paint removal. Keep out of active progress until work starts.', paymentItemRefs: [11] })
    },
    {
      id: 'area-d-horseshoe-bearings',
      name: 'Area D / Orange — Horseshoe Bearings',
      description: 'Area D / Orange bearing bucket added from the Defoe item comparison. Billing quantity is 74 EA + 70 EA = 144 EA. No field production entered yet.',
      unitLabel: 'bearings',
      total: 144,
      stages: ['Localized Paint Removal / Prep'],
      items: [],
      ...areaMeta('area-d-horseshoe-bearings', { officialAreaId: 'area-d', trackingActive: false, trackingStatus: 'Office Quantity / Not Started', billingQuantity: 144, fieldQuantity: 144, quantityNote: 'New bucket from Defoe sheet: 74 EA + 70 EA = 144 EA.', paymentItemRefs: [17] })
    },
    {
      id: 'area-a-ebu-bearings',
      name: 'Area A / Green — EBU / 92nd / Ramp F Bearings',
      description: 'Area A / Green bearing-related office bucket. Defoe shows 60 EA power tool cleaning, 30 EA Ramp F localized lead abatement, and 7 EA Ramp F localized lead abatement = 97 EA.',
      unitLabel: 'EA',
      total: 97,
      stages: ['Power Tool Cleaning', 'Localized Lead Abatement'],
      items: [],
      ...areaMeta('area-a-ebu-bearings', { officialAreaId: 'area-a', trackingActive: false, trackingStatus: 'Office Quantity / Not Started', billingQuantity: 97, fieldQuantity: 97, quantityNote: 'New official-area bucket from Defoe sheet: 60 + 30 + 7 = 97 EA.', paymentItemRefs: [23] })
    },
    {
      id: 'area-e-yard-ramp-bearings',
      name: 'Area E / Pink — Yard Ramp Bearings',
      description: 'Area E / Pink / Ramp N bearing bucket added from Defoe. Billing quantity is 25 EA + 25 EA = 50 EA.',
      unitLabel: 'bearings',
      total: 50,
      stages: ['Localized Paint Removal / De-Lead'],
      items: [],
      ...areaMeta('area-e-yard-ramp-bearings', { officialAreaId: 'area-e', trackingActive: false, trackingStatus: 'Office Quantity / Not Started', billingQuantity: 50, fieldQuantity: 50, quantityNote: 'New bucket from Defoe sheet: 25 EA + 25 EA = 50 EA.', paymentItemRefs: [31] })
    },
    {
      id: 'area-b-new-belt-ramps',
      name: 'Area B / Yellow — New Belt Ramps / Connections',
      description: 'Area B / Yellow office bucket for new belt ramp connection points, anti-graffiti, fire hose valves, and fire department connections.',
      unitLabel: 'LS',
      total: 1,
      stages: ['Office Scope Setup'],
      items: [],
      ...areaMeta('area-b-new-belt-ramps', { officialAreaId: 'area-b', trackingActive: false, trackingStatus: 'Office Quantity / Not Started', billingQuantity: 1, fieldQuantity: 1, quantityNote: 'Added as an official area placeholder so Area B shows in the field/office tracker.', paymentItemRefs: [2, 3, 4, 5] })
    }
  ],
  emergencySteelRepairs: safeClone(defaultEmergencySteelRepairs),
  dailyLog: [],
  notes: []
};

function migrateData(data) {
  if (!data || typeof data !== 'object') data = safeClone(defaultData);
  if (!Array.isArray(data.areas)) data.areas = safeClone(defaultData.areas);
  if (!Array.isArray(data.dailyLog)) data.dailyLog = [];
  if (!Array.isArray(data.notes)) data.notes = [];
  data.officialAreas = safeClone(officialAreas);
  data.trackerVersion = 'V19 Official Area Full Dropdown';

  for (const defaultArea of defaultData.areas) {
    let area = data.areas.find(a => a.id === defaultArea.id);
    if (!area) {
      data.areas.push(safeClone(defaultArea));
      area = data.areas.find(a => a.id === defaultArea.id);
    }
    area.name = defaultArea.name;
    area.description = defaultArea.description;
    area.unitLabel = defaultArea.unitLabel;
    area.total = defaultArea.total;
    area.stages = safeClone(defaultArea.stages);
    area.officialAreaId = defaultArea.officialAreaId;
    area.officialAreaLabel = defaultArea.officialAreaLabel;
    area.officialAreaName = defaultArea.officialAreaName;
    area.colorName = defaultArea.colorName;
    area.color = defaultArea.color;
    area.soft = defaultArea.soft;
    area.trackingActive = defaultArea.trackingActive;
    area.trackingStatus = defaultArea.trackingStatus;
    area.billingQuantity = defaultArea.billingQuantity;
    area.fieldQuantity = defaultArea.fieldQuantity;
    area.quantityNote = defaultArea.quantityNote;
    area.paymentItemRefs = Array.isArray(defaultArea.paymentItemRefs) ? safeClone(defaultArea.paymentItemRefs) : [];
    if (defaultArea.subAreas) area.subAreas = safeClone(defaultArea.subAreas);
    else delete area.subAreas;
    if (defaultArea.pierCount) area.pierCount = defaultArea.pierCount;
    else delete area.pierCount;
    if (!Array.isArray(area.items)) area.items = [];
  }

  if (!data.emergencySteelRepairs || !Array.isArray(data.emergencySteelRepairs.repairs)) {
    data.emergencySteelRepairs = safeClone(defaultEmergencySteelRepairs);
  } else {
    const existingById = new Map((data.emergencySteelRepairs.repairs || []).map(r => [Number(r.id), r]));
    const mergedRepairs = emergencyRepairRows.map(base => {
      const existing = existingById.get(Number(base.id)) || {};
      return {
        ...safeClone(base),
        status: existing.status || base.status || 'Not Started',
        fieldVerified: existing.fieldVerified || base.fieldVerified || 'No',
        completedDate: existing.completedDate || '',
        notes: existing.notes || '',
        updatedAt: existing.updatedAt || '',
        enteredBy: existing.enteredBy || '',
        history: Array.isArray(existing.history) ? existing.history.slice(0, 50) : [],
        completedMembers: Array.isArray(existing.completedMembers) ? existing.completedMembers : []
      };
    });
    data.emergencySteelRepairs = {
      ...safeClone(defaultEmergencySteelRepairs),
      ...data.emergencySteelRepairs,
      repairLocations: emergencyRepairRows.length,
      estimatedMemberPieces: emergencyRepairRows.reduce((sum, r) => sum + Number(r.qtyMembers || 0), 0),
      estimatedSf: emergencyRepairRows.reduce((sum, r) => sum + Number(r.estimatedSf || 0), 0),
      estimatedCrewDays: emergencyRepairRows.reduce((sum, r) => sum + Number(r.crewDays || 0), 0),
      estimatedLaborCost: emergencyRepairRows.reduce((sum, r) => sum + Number(r.laborCost || 0), 0),
      repairs: mergedRepairs,
      activityLog: Array.isArray(data.emergencySteelRepairs.activityLog) ? data.emergencySteelRepairs.activityLog.slice(0, 500) : []
    };
  }

  return data;
}

function getPool() {
  if (!DATABASE_URL) return null;
  if (pool) return pool;
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
    return pool;
  } catch (err) {
    lastStorageWarning = `Postgres package/connection setup failed: ${err.message}`;
    return null;
  }
}

async function ensureDb() {
  const p = getPool();
  if (!p) return false;
  await p.query(`
    CREATE TABLE IF NOT EXISTS jagd_tracker_store (
      tracker_key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  dbReady = true;
  return true;
}

function ensureDataFile() {
  refreshDataPath();
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2));
}

function backupBadFile(reason) {
  try {
    if (!fs.existsSync(dataFile)) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const badName = path.join(dataDir, `vn84b-tracker-bad-${stamp}.json`);
    fs.copyFileSync(dataFile, badName);
    lastStorageWarning = `Recovered from bad tracker file (${reason}). Bad copy saved as ${path.basename(badName)}.`;
  } catch (err) {
    lastStorageWarning = `Could not backup bad tracker file: ${err.message}`;
  }
}

async function readDataFromDb() {
  await ensureDb();
  const result = await pool.query('SELECT data FROM jagd_tracker_store WHERE tracker_key = $1', [TRACKER_KEY]);
  if (!result.rows.length) {
    const clean = migrateData(safeClone(defaultData));
    await pool.query(
      'INSERT INTO jagd_tracker_store (tracker_key, data, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (tracker_key) DO NOTHING',
      [TRACKER_KEY, JSON.stringify(clean)]
    );
    return clean;
  }
  return migrateData(result.rows[0].data);
}

async function writeDataToDb(data) {
  await ensureDb();
  data.updatedAt = new Date().toISOString();
  const clean = migrateData(data);
  await pool.query(
    `INSERT INTO jagd_tracker_store (tracker_key, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (tracker_key)
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [TRACKER_KEY, JSON.stringify(clean)]
  );
  return clean;
}

function readDataFromFile() {
  ensureDataFile();
  let raw = fs.readFileSync(dataFile, 'utf8');
  try {
    if (!raw || !raw.trim()) throw new Error('file is empty');
    return migrateData(JSON.parse(raw));
  } catch (err) {
    backupBadFile(err.message);
    const clean = migrateData(safeClone(defaultData));
    fs.writeFileSync(dataFile, JSON.stringify(clean, null, 2));
    return clean;
  }
}

function writeDataToFile(data) {
  ensureDataFile();
  if (fs.existsSync(dataFile)) {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync(dataFile, path.join(dataDir, `vn84b-tracker-backup-${stamp}.json`));
    } catch (backupErr) {
      console.warn('VN84-B backup warning:', backupErr.message);
    }
  }
  data.updatedAt = new Date().toISOString();
  const clean = migrateData(data);
  fs.writeFileSync(dataFile, JSON.stringify(clean, null, 2));
  return clean;
}

async function readData() {
  if (DATABASE_URL) {
    try {
      lastStorageWarning = '';
      return await readDataFromDb();
    } catch (err) {
      console.error('VN84-B Postgres read error:', err);
      lastStorageWarning = `DATABASE READ FAILED: ${err.message}`;
      const fallback = readDataFromFile();
      fallback.warning = lastStorageWarning;
      return fallback;
    }
  }
  const data = readDataFromFile();
  data.warning = 'VN84-B is using file storage. Live field data can reset on Render redeploy. Configure VN84B_DATABASE_URL for permanent storage.';

  if (!data.emergencySteelRepairs || !Array.isArray(data.emergencySteelRepairs.repairs)) {
    data.emergencySteelRepairs = safeClone(defaultEmergencySteelRepairs);
  } else {
    const existingById = new Map((data.emergencySteelRepairs.repairs || []).map(r => [Number(r.id), r]));
    const mergedRepairs = emergencyRepairRows.map(base => {
      const existing = existingById.get(Number(base.id)) || {};
      return {
        ...safeClone(base),
        status: existing.status || base.status || 'Not Started',
        fieldVerified: existing.fieldVerified || base.fieldVerified || 'No',
        completedDate: existing.completedDate || '',
        notes: existing.notes || '',
        updatedAt: existing.updatedAt || '',
        enteredBy: existing.enteredBy || '',
        history: Array.isArray(existing.history) ? existing.history.slice(0, 50) : [],
        completedMembers: Array.isArray(existing.completedMembers) ? existing.completedMembers : []
      };
    });
    data.emergencySteelRepairs = {
      ...safeClone(defaultEmergencySteelRepairs),
      ...data.emergencySteelRepairs,
      repairLocations: emergencyRepairRows.length,
      estimatedMemberPieces: emergencyRepairRows.reduce((sum, r) => sum + Number(r.qtyMembers || 0), 0),
      estimatedSf: emergencyRepairRows.reduce((sum, r) => sum + Number(r.estimatedSf || 0), 0),
      estimatedCrewDays: emergencyRepairRows.reduce((sum, r) => sum + Number(r.crewDays || 0), 0),
      estimatedLaborCost: emergencyRepairRows.reduce((sum, r) => sum + Number(r.laborCost || 0), 0),
      repairs: mergedRepairs,
      activityLog: Array.isArray(data.emergencySteelRepairs.activityLog) ? data.emergencySteelRepairs.activityLog.slice(0, 500) : []
    };
  }

  return data;
}

async function writeData(data) {
  if (DATABASE_URL) {
    try {
      lastStorageWarning = '';
      return await writeDataToDb(data);
    } catch (err) {
      console.error('VN84-B Postgres write error:', err);
      lastStorageWarning = `DATABASE WRITE FAILED: ${err.message}`;
      throw err;
    }
  }
  return writeDataToFile(data);
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}



function emergencyMemberUnits(repair) {
  const raw = String(repair.members || '').split(',').map(m => m.trim()).filter(Boolean);
  if (raw.length === 1 && raw[0].toUpperCase() === 'ALL') {
    return [{ key: 'ALL', label: 'ALL', units: Number(repair.qtyMembers || 1) }];
  }
  return raw.map(m => ({ key: m, label: m, units: 1 }));
}

function emergencyCompletedPieces(repair) {
  const done = new Set(Array.isArray(repair.completedMembers) ? repair.completedMembers.map(String) : []);
  return emergencyMemberUnits(repair).reduce((sum, m) => sum + (done.has(m.key) ? Number(m.units || 1) : 0), 0);
}

function syncEmergencyRepairStatusFromMembers(repair) {
  const donePieces = emergencyCompletedPieces(repair);
  const totalPieces = Number(repair.qtyMembers || 0);
  if (totalPieces > 0 && donePieces >= totalPieces) {
    repair.status = 'Complete';
    repair.fieldVerified = 'Yes';
    if (!repair.completedDate) repair.completedDate = new Date().toISOString().slice(0, 10);
  } else if (donePieces > 0 && (!repair.status || repair.status === 'Not Started' || repair.status === 'Complete')) {
    repair.status = 'Installed';
    repair.completedDate = '';
  } else if (donePieces === 0 && repair.status === 'Complete') {
    repair.status = 'Not Started';
    repair.completedDate = '';
  }
}


function paymentPasswordConfigured() {
  return !!(process.env.VN84B_PAYMENT_PASSWORD || '').trim();
}

function getPaymentPassword() {
  return (process.env.VN84B_PAYMENT_PASSWORD || 'JAGD2026').trim();
}

function requirePaymentPassword(req, res, next) {
  const configuredPassword = getPaymentPassword();
  const suppliedPassword = (req.get('x-vn84b-payment-password') || req.query.password || '').trim();
  if (!suppliedPassword || suppliedPassword !== configuredPassword) {
    return res.status(401).json({
      ok: false,
      locked: true,
      error: 'Payment breakdown is password protected.'
    });
  }
  next();
}

router.get('/api/vn84b/payment-breakdown', requirePaymentPassword, (req, res) => {
  res.json(paymentBreakdown);
});

router.get('/api/vn84b/payment-breakdown/status', (req, res) => {
  res.json({ ok: true, locked: true, passwordConfigured: paymentPasswordConfigured() });
});

router.get('/api/vn84b/emergency-steel-repairs', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.emergencySteelRepairs);
  } catch (err) {
    console.error('VN84-B emergency steel repairs read error:', err);
    res.status(500).json({ error: `Could not load Emergency Steel Repairs: ${err.message}` });
  }
});


router.post('/api/vn84b/emergency-steel-repairs/member', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const { id, memberKey, enteredBy } = req.body || {};
    const data = await readData();
    const tracker = data.emergencySteelRepairs;
    const repair = tracker.repairs.find(r => Number(r.id) === Number(id));
    if (!repair) return res.status(404).json({ error: 'Emergency steel repair row not found.' });

    const allowed = emergencyMemberUnits(repair).map(m => m.key);
    if (!allowed.includes(String(memberKey))) return res.status(400).json({ error: 'Member is not part of this repair row.' });

    repair.completedMembers = Array.isArray(repair.completedMembers) ? repair.completedMembers.map(String) : [];
    const key = String(memberKey);
    const wasDone = repair.completedMembers.includes(key);
    if (wasDone) repair.completedMembers = repair.completedMembers.filter(m => m !== key);
    else repair.completedMembers.push(key);

    const stamp = new Date().toISOString();
    syncEmergencyRepairStatusFromMembers(repair);
    repair.enteredBy = enteredBy || repair.enteredBy || '';
    repair.updatedAt = stamp;
    repair.history = Array.isArray(repair.history) ? repair.history : [];
    repair.history.unshift({
      timestamp: stamp,
      status: repair.status,
      fieldVerified: repair.fieldVerified,
      completedDate: repair.completedDate || '',
      enteredBy: enteredBy || '',
      notes: `${wasDone ? 'Unchecked' : 'Checked'} member ${key}. ${emergencyCompletedPieces(repair)} of ${repair.qtyMembers} pieces complete.`
    });
    repair.history = repair.history.slice(0, 20);

    tracker.activityLog = Array.isArray(tracker.activityLog) ? tracker.activityLog : [];
    tracker.activityLog.unshift({
      id: Date.now().toString(36),
      timestamp: stamp,
      repairId: repair.id,
      location: `${repair.pier} / ${repair.span} / ${repair.betweenStringers}`,
      members: `${wasDone ? 'Unchecked' : 'Checked'} ${key} — ${emergencyCompletedPieces(repair)} of ${repair.qtyMembers} pieces complete`,
      status: repair.status,
      fieldVerified: repair.fieldVerified,
      completedDate: repair.completedDate || '',
      enteredBy: enteredBy || '',
      notes: repair.notes || ''
    });
    tracker.activityLog = tracker.activityLog.slice(0, 500);

    res.json((await writeData(data)).emergencySteelRepairs);
  } catch (err) {
    console.error('VN84-B emergency steel member save error:', err);
    res.status(500).json({ error: `Could not update Emergency Steel Repair member: ${err.message}` });
  }
});

router.post('/api/vn84b/emergency-steel-repairs/repair', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const { id, status, fieldVerified, completedDate, notes, enteredBy } = req.body || {};
    const data = await readData();
    const tracker = data.emergencySteelRepairs;
    const repair = tracker.repairs.find(r => Number(r.id) === Number(id));
    if (!repair) return res.status(404).json({ error: 'Emergency steel repair row not found.' });

    repair.completedMembers = Array.isArray(repair.completedMembers) ? repair.completedMembers : [];
    const allowedStatuses = tracker.statuses || defaultEmergencySteelRepairs.statuses;
    const safeStatus = allowedStatuses.includes(status) ? status : repair.status || 'Not Started';
    const stamp = new Date().toISOString();

    repair.status = safeStatus;
    repair.fieldVerified = fieldVerified === 'Yes' ? 'Yes' : 'No';
    repair.completedDate = completedDate || '';
    repair.notes = notes || '';
    repair.enteredBy = enteredBy || repair.enteredBy || '';
    repair.updatedAt = stamp;
    repair.history = Array.isArray(repair.history) ? repair.history : [];
    repair.history.unshift({
      timestamp: stamp,
      status: repair.status,
      fieldVerified: repair.fieldVerified,
      completedDate: repair.completedDate,
      enteredBy: enteredBy || '',
      notes: notes || ''
    });
    repair.history = repair.history.slice(0, 20);

    tracker.activityLog = Array.isArray(tracker.activityLog) ? tracker.activityLog : [];
    tracker.activityLog.unshift({
      id: Date.now().toString(36),
      timestamp: stamp,
      repairId: repair.id,
      location: `${repair.pier} / ${repair.span} / ${repair.betweenStringers}`,
      members: repair.members,
      status: repair.status,
      fieldVerified: repair.fieldVerified,
      completedDate: repair.completedDate,
      enteredBy: enteredBy || '',
      notes: notes || ''
    });
    tracker.activityLog = tracker.activityLog.slice(0, 500);

    res.json((await writeData(data)).emergencySteelRepairs);
  } catch (err) {
    console.error('VN84-B emergency steel repairs save error:', err);
    res.status(500).json({ error: `Could not save Emergency Steel Repairs: ${err.message}` });
  }
});

router.get('/api/vn84b/emergency-steel-repairs/backup', async (req, res) => {
  try {
    const data = await readData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="vn84b-emergency-steel-repairs-backup.json"');
    res.send(JSON.stringify(data.emergencySteelRepairs, null, 2));
  } catch (err) {
    res.status(500).json({ error: 'Could not download Emergency Steel Repairs backup.' });
  }
});


router.get('/api/vn84b/storage', async (req, res) => {
  try {
    const p = getPool();
    let databaseReachable = false;
    let databaseRows = null;
    if (p) {
      try {
        await ensureDb();
        const r = await p.query('SELECT updated_at FROM jagd_tracker_store WHERE tracker_key = $1', [TRACKER_KEY]);
        databaseReachable = true;
        databaseRows = r.rowCount;
      } catch (err) {
        lastStorageWarning = err.message;
      }
    }

    refreshDataPath();
    const exists = fs.existsSync(dataFile);
    let readable = false;
    let bytes = null;
    let updatedAt = null;
    try {
      if (exists) {
        const stat = fs.statSync(dataFile);
        bytes = stat.size;
        updatedAt = stat.mtime.toISOString();
        fs.accessSync(dataFile, fs.constants.R_OK | fs.constants.W_OK);
        readable = true;
      }
    } catch (err) {
      lastStorageWarning = err.message;
    }

    res.json({
      ok: true,
      storageMode: DATABASE_URL && databaseReachable ? 'postgres' : 'file',
      databaseConfigured: Boolean(DATABASE_URL),
      databaseReachable,
      databaseRows,
      dataFile,
      fallbackDataFile,
      usingPersistentPath: Boolean(process.env.VN84B_DATA_PATH),
      fileExists: exists,
      fileReadable: readable,
      fileBytes: bytes,
      fileUpdatedAt: updatedAt,
      warning: lastStorageWarning || null
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/api/vn84b', async (req, res) => {
  try {
    res.json(await readData());
  } catch (err) {
    console.error('VN84-B read error:', err);
    const safeData = migrateData(safeClone(defaultData));
    safeData.warning = `Storage problem: ${err.message}`;
    res.json(safeData);
  }
});

router.post('/api/vn84b/progress', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const { areaId, subAreaId, stage, completed, note, enteredBy } = req.body || {};
    const data = await readData();
    const area = data.areas.find(a => a.id === areaId);
    if (!area) return res.status(404).json({ error: 'Area not found.' });
    const wasFutureScope = area.trackingActive === false;
    if (!area.stages.includes(stage)) return res.status(400).json({ error: 'Stage not found for this area.' });

    const subArea = area.subAreas && subAreaId ? area.subAreas.find(s => s.id === subAreaId) : null;
    if (area.subAreas && area.subAreas.length && !subArea) return res.status(400).json({ error: 'Location / pier is required for this area.' });

    const totalForEntry = subArea ? subArea.total : area.total;
    const safeCompleted = clampNumber(completed, 0, totalForEntry);
    const existing = (area.items || []).find(i => i.stage === stage && (i.subAreaId || '') === (subAreaId || ''));
    if (existing) {
      existing.completed = safeCompleted;
      existing.updatedAt = new Date().toISOString();
      existing.enteredBy = enteredBy || existing.enteredBy || '';
      existing.subAreaId = subArea ? subArea.id : '';
      existing.subAreaName = subArea ? subArea.name : '';
    } else {
      if (!area.items) area.items = [];
      area.items.push({
        stage,
        subAreaId: subArea ? subArea.id : '',
        subAreaName: subArea ? subArea.name : '',
        completed: safeCompleted,
        enteredBy: enteredBy || '',
        updatedAt: new Date().toISOString()
      });
    }

    if (wasFutureScope && safeCompleted > 0) {
      area.trackingActive = true;
      area.trackingStatus = 'Active Field Tracking';
      area.quantityNote = `${area.quantityNote || ''} Opened from future/not-started status when field progress was entered.`.trim();
    }

    const areaLogName = subArea ? `${area.name} — ${subArea.name}` : area.name;
    data.dailyLog.unshift({
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      areaId,
      subAreaId: subArea ? subArea.id : '',
      areaName: areaLogName,
      stage,
      completed: safeCompleted,
      total: totalForEntry,
      note: note || '',
      enteredBy: enteredBy || ''
    });
    data.dailyLog = data.dailyLog.slice(0, 500);
    res.json(await writeData(data));
  } catch (err) {
    console.error('VN84-B progress save error:', err);
    res.status(500).json({ error: `Could not save VN84-B progress: ${err.message}` });
  }
});

router.post('/api/vn84b/restore', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.areas)) return res.status(400).json({ error: 'Invalid VN84-B backup file.' });
    await writeData(data);
    res.json(await readData());
  } catch (err) {
    console.error('VN84-B restore error:', err);
    res.status(500).json({ error: `Could not restore VN84-B backup: ${err.message}` });
  }
});

router.get('/api/vn84b/backup', async (req, res) => {
  try {
    const data = await readData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="vn84b-tracker-backup.json"');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('VN84-B backup download error:', err);
    res.status(500).json({ error: 'Could not download VN84-B backup.' });
  }
});

router.post('/api/vn84b/note', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const { areaId, note, enteredBy } = req.body || {};
    if (!note || !note.trim()) return res.status(400).json({ error: 'Note is required.' });
    const data = await readData();
    const area = data.areas.find(a => a.id === areaId);
    data.notes.unshift({
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      areaId: areaId || '',
      areaName: area ? area.name : 'General',
      note: note.trim(),
      enteredBy: enteredBy || ''
    });
    data.notes = data.notes.slice(0, 300);
    res.json(await writeData(data));
  } catch (err) {
    console.error('VN84-B note save error:', err);
    res.status(500).json({ error: `Could not save VN84-B note: ${err.message}` });
  }
});

router.get('/vn84b/payment-breakdown', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'vn84b', 'payment-breakdown.html'));
});

router.get('/vn84b/emergency-steel-repairs', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'vn84b', 'emergency-steel-repairs.html'));
});

router.get('/vn84b', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'vn84b', 'index.html'));
});

module.exports = router;
