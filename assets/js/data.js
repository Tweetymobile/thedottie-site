/* data.js — the demo's made-up record. Nothing here is a real person.
   "Today" is Oct 28 2026. Seven periods, so six completed cycles, the last
   period Oct 14–18. The figures below (the window, the predicted period days,
   the average) are what the app's own prediction engine gives for this record;
   they were worked out by running it, and they change together or not at all. */
window.DOTTIE_DATA = {
  today: new Date(2026, 9, 28),
  // every period start, oldest first, and how many days each lasted
  starts: [new Date(2026, 3, 11), new Date(2026, 4, 10), new Date(2026, 5, 10), new Date(2026, 6, 10), new Date(2026, 7, 11), new Date(2026, 8, 11), new Date(2026, 9, 14)],
  periodLengths: [5, 4, 5, 5, 4, 5, 5],
  cycleLengths: [29, 31, 30, 32, 31, 33], // the six completed cycles
  avgCycle: 31,          // shown as "31d"
  avgExact: 31.4,        // the recency-weighted average the ring is drawn from
  periodLen: 5,          // predicted period length
  windowDays: 2,         // the window is the likely start, give or take this many days
  spread: 4,             // longest minus shortest of the last six: "vary by about 4 days"
  usualVariation: '±1.3d',
  usualPeriod: 'Usually 4–5 days for you',
  // Two of Rob's own notes from the app, one per phase the demo can reach.
  notes: {
    follicular: 'Some of your best ideas arrive when you stop forcing them. Leave a little room for surprise.',
    menstrual: 'Every cycle is different. Meet this one with curiosity instead of expectations.',
  },
  // She had a copper IUD fitted on Jun 22 2026. It keeps her natural cycle, so predictions and
  // statistics read one continuous history; only History groups her cycles by method.
  method: { now: 'Copper IUD', since: new Date(2026, 5, 22), before: 'No birth control' },
  // symptoms by the phase they were logged in: how many cycles, out of the cycles that reached that phase
  // (seven have reached menstrual, the open one included; six have reached luteal)
  symptoms: [
    { name: 'Cramps', phase: 'menstrual', count: 7 },
    { name: 'Fatigue', phase: 'menstrual', count: 5 },
    { name: 'Headache', phase: 'menstrual', count: 4 },
    { name: 'Tender breasts', phase: 'luteal', count: 4 },
    { name: 'Bloating', phase: 'luteal', count: 2 },
  ],
  // which completed cycles (0 is the oldest) each symptom was logged in
  inCycle: { 'Cramps': [0, 1, 2, 3, 4, 5], 'Fatigue': [0, 1, 3, 4, 5], 'Headache': [0, 2, 4, 5], 'Tender breasts': [1, 3, 4, 5], 'Bloating': [3, 5] },
  symptomDays: ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'], // October days that carry the "Symptoms logged" mark
  frequent: ['Cramps', 'Fatigue', 'Headache', 'Tender breasts'],
  flows: ['Spotting', 'Light', 'Medium', 'Heavy', 'Flooding'],
  feelings: ['Calm', 'Happy', 'Energetic', 'Confident', 'Irritable', 'Anxious', 'Sad', 'Stressed', 'Sensitive', 'Foggy', 'Overwhelmed', 'Motivated'],
  // the app's 29, in its order
  symptomChips: ['Cramps', 'Headache', 'Bloating', 'Tender breasts', 'Acne', 'Fatigue', 'Nausea', 'Back pain', 'Discharge', 'Insomnia', 'Cravings', 'Dizziness', 'Diarrhea', 'Constipation', 'Joint pain', 'Hot flashes', 'Low libido', 'Night sweats', 'Brain fog', 'Palpitations', 'Vaginal dryness', 'Anxiety', 'Urinary changes', 'Excessive hair growth', 'Hair loss', 'Pelvic pain', 'Pain with sex', 'Painful bowel movements', 'Painful urination'],
  more: [
    ['Energy', ['Low', 'OK', 'High']],
    ['Cervical mucus', ['Dry', 'Sticky', 'Creamy', 'Egg white']],
    ['Stress', ['Low', 'Medium', 'High']],
    ['Exercise', ['None', 'Light', 'Moderate', 'Intense']],
  ],
};
