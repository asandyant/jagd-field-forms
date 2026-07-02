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
  { id: 'sp12', name: 'SP12', total: 18 }
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

const defaultEmergencySteelRepairs = {
  id: 'emergency-steel-repairs',
  name: 'Emergency Steel Repairs',
  contract: 'VN84-B',
  bridge: 'Verrazzano-Narrows Bridge',
  description: 'Extra Belt Parkway Ramp SP end cross frame steel repairs outside JAGD original contract.',
  source: 'VN-84B Belt Parkway Ramp SP End Cross Frame Repairs / DU08A-CS-452',
  drawingNote: 'Red indicates additional repairs. Blue indicates original repairs. This tracker calls out each row as Red / Additional or Blue / Original and lets the field click a repair box to update it.',
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
  updatedAt: null,
  areas: [
    {
      id: 'blue-bridge-87',
      name: 'Blue Bridge 87',
      description: 'Steel repairs, power tool prep, zinc, midcoat, finish coat',
      unitLabel: 'locations',
      total: 87,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: []
    },
    {
      id: 'belt-parkway-bearings',
      name: 'Belt Parkway Bearings',
      description: '230 bearings broken out by Abutment and SP1–SP12. Each stage counts as its own 100% billing item: power tool, zinc, midcoat, finish.',
      unitLabel: 'bearings',
      total: 230,
      subAreas: bearingSubAreas,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: []
    },
    {
      id: 'blue-bridge-237-crosses',
      name: 'Blue Bridge 237 New Crosses',
      description: '237 new crosses: power tool prep, zinc, midcoat, finish coat',
      unitLabel: 'crosses',
      total: 237,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: []
    },
    {
      id: 'orange-bridge-piers',
      name: 'Orange Bridge Piers',
      description: '25,200 sq ft across 9 piers: power tool prep, zinc, midcoat, finish coat',
      unitLabel: 'sq ft',
      total: 25200,
      pierCount: 9,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: []
    },
    {
      id: 'belt-parkway-jacking',
      name: 'Belt Parkway Jacking Locations',
      description: '13 piers / jacking locations: power tool prep only',
      unitLabel: 'piers',
      total: 13,
      stages: ['Power Tool Prep'],
      items: []
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
        history: Array.isArray(existing.history) ? existing.history.slice(0, 50) : []
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
        history: Array.isArray(existing.history) ? existing.history.slice(0, 50) : []
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


router.get('/api/vn84b/emergency-steel-repairs', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.emergencySteelRepairs);
  } catch (err) {
    console.error('VN84-B emergency steel repairs read error:', err);
    res.status(500).json({ error: `Could not load Emergency Steel Repairs: ${err.message}` });
  }
});

router.post('/api/vn84b/emergency-steel-repairs/repair', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const { id, status, fieldVerified, completedDate, notes, enteredBy } = req.body || {};
    const data = await readData();
    const tracker = data.emergencySteelRepairs;
    const repair = tracker.repairs.find(r => Number(r.id) === Number(id));
    if (!repair) return res.status(404).json({ error: 'Emergency steel repair row not found.' });

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

router.get('/vn84b/emergency-steel-repairs', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'vn84b', 'emergency-steel-repairs.html'));
});

router.get('/vn84b', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'vn84b', 'index.html'));
});

module.exports = router;
