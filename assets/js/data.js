/* data.js — the demo's fictional dataset. Nothing here is a real person.
   "Today" is Oct 28 2026. Six completed cycles, the last period Oct 14–18.
   Change the numbers here and every screen follows. */
window.DOTTIE_DATA = {
  today: new Date(2026, 9, 28),
  lastPeriodStart: new Date(2026, 9, 14),
  loggedPeriods: [
    [new Date(2026, 9, 14), new Date(2026, 9, 18)],
    [new Date(2026, 8, 13), new Date(2026, 8, 17)],
  ],
  cycleLengths: [29, 31, 30, 32, 31, 33], // oldest → newest, six completed cycles
  periodLengths: [5, 4, 5, 5, 4, 5],
  avgCycle: 31,
  within: 3,           // "usually within 3 days"
  windowStart: new Date(2026, 10, 12), // Nov 12–18, the expected window
  windowEnd: new Date(2026, 10, 18),
  phaseNote: 'Some of your best ideas arrive when you stop forcing them. Leave a little room for surprise.',
  symptoms: [
    { name: 'Cramps', phase: 'menstrual', count: 6, of: 6 },
    { name: 'Fatigue', phase: 'menstrual', count: 5, of: 6 },
    { name: 'Headache', phase: 'menstrual', count: 4, of: 6 },
    { name: 'Tender breasts', phase: 'luteal', count: 4, of: 5 },
    { name: 'Bloating', phase: 'luteal', count: 2, of: 5 },
  ],
  feelings: ['Calm', 'Happy', 'Energetic', 'Confident', 'Irritable', 'Anxious', 'Sad', 'Stressed', 'Sensitive', 'Foggy', 'Overwhelmed', 'Motivated'],
  symptomChips: ['Cramps', 'Headache', 'Bloating', 'Tender breasts', 'Acne', 'Fatigue', 'Nausea', 'Back pain', 'Discharge', 'Insomnia', 'Cravings', 'Dizziness'],
};
