import type { Dose, FamilyMember, HistoryDay, Medicine } from './types';

export const patientFirstName = 'Dad';

export const todaysDoses: Dose[] = [
  { id: '1', medicineName: 'Aspirin', dosage: '75 mg', scheduledTime: '8:00 AM', status: 'taken', takenAt: '8:12 AM' },
  { id: '2', medicineName: 'Metoprolol', dosage: '25 mg', scheduledTime: '8:00 AM', status: 'taken', takenAt: '8:14 AM' },
  { id: '3', medicineName: 'Ramipril', dosage: '2.5 mg', scheduledTime: '1:00 PM', status: 'missed', takenAt: null },
  { id: '4', medicineName: 'Clopidogrel', dosage: '75 mg', scheduledTime: '9:00 PM', status: 'pending', takenAt: null },
  { id: '5', medicineName: 'Atorvastatin', dosage: '40 mg', scheduledTime: '10:00 PM', status: 'pending', takenAt: null },
];

export const historyDays: HistoryDay[] = [
  {
    id: 'd1', label: 'Yesterday · 7 Sep', summary: '5 of 5 taken',
    rows: [
      { id: 'r1', name: 'Atorvastatin', detail: 'Scheduled 10:00 PM', status: 'Taken 10:04 PM', taken: true },
      { id: 'r2', name: 'Clopidogrel', detail: 'Scheduled 9:00 PM', status: 'Taken 9:02 PM', taken: true },
      { id: 'r3', name: 'Ramipril', detail: 'Scheduled 1:00 PM', status: 'Taken 1:20 PM', taken: true },
      { id: 'r4', name: 'Aspirin + Metoprolol', detail: 'Scheduled 8:00 AM', status: 'Taken 8:10 AM', taken: true },
    ],
  },
  {
    id: 'd2', label: 'Saturday · 6 Sep', summary: '4 of 5 taken',
    rows: [
      { id: 'r5', name: 'Atorvastatin', detail: 'Scheduled 10:00 PM', status: 'Taken 10:40 PM', taken: true },
      { id: 'r6', name: 'Ramipril', detail: 'Scheduled 1:00 PM', status: 'Missed', taken: false },
      { id: 'r7', name: 'Aspirin + Metoprolol', detail: 'Scheduled 8:00 AM', status: 'Taken 8:05 AM', taken: true },
    ],
  },
  {
    id: 'd3', label: 'Friday · 5 Sep', summary: '5 of 5 taken',
    rows: [
      { id: 'r8', name: 'Evening doses', detail: 'Clopidogrel · Atorvastatin', status: 'Taken', taken: true },
      { id: 'r9', name: 'Morning doses', detail: 'Aspirin · Metoprolol · Ramipril', status: 'Taken', taken: true },
    ],
  },
];

export const medicines: Medicine[] = [
  { id: 'm1', name: 'Aspirin', dosage: '75 mg', schedule: '8:00 AM, after breakfast', stockCount: 24, stockCapacity: 35, runsOut: 'about 24 days', low: false },
  { id: 'm2', name: 'Clopidogrel', dosage: '75 mg', schedule: '9:00 PM', stockCount: 4, stockCapacity: 33, runsOut: 'runs out Friday', low: true },
  { id: 'm3', name: 'Atorvastatin', dosage: '40 mg', schedule: '10:00 PM', stockCount: 31, stockCapacity: 38, runsOut: 'about a month', low: false },
  { id: 'm4', name: 'Metoprolol', dosage: '25 mg', schedule: '8:00 AM and 8:00 PM', stockCount: 9, stockCapacity: 41, runsOut: 'runs out in 4 days', low: true },
  { id: 'm5', name: 'Ramipril', dosage: '2.5 mg', schedule: '1:00 PM', stockCount: 18, stockCapacity: 33, runsOut: 'about 18 days', low: false },
];

export const familyMembers: FamilyMember[] = [
  { id: 'f1', name: 'Priya', initials: 'PR', relation: 'Daughter', notify: 'all' },
  { id: 'f2', name: 'Arjun', initials: 'AR', relation: 'Son', notify: 'missed' },
  { id: 'f3', name: 'Meera', initials: 'ME', relation: 'Wife', notify: 'all' },
];
