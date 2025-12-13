// Track capital additions/withdrawals to calculate true profit
// Add entries whenever you deposit or withdraw money

export const capitalEvents = [
  {
    date: '2025-11-12',
    amount: 9143568, // Initial portfolio value
    type: 'initial',
    note: 'Initial portfolio snapshot - Nov 12, 2025'
  },
  // TEST DATA - 2026
  {
    date: '2026-02-15',
    amount: 1500000,
    type: 'deposit',
    note: '[TEST] Bonus investment'
  },
  {
    date: '2026-07-20',
    amount: 800000,
    type: 'deposit',
    note: '[TEST] Mid-year addition'
  },
  // TEST DATA - 2027
  {
    date: '2027-01-10',
    amount: 1200000,
    type: 'deposit',
    note: '[TEST] New year investment'
  },
  {
    date: '2027-09-05',
    amount: -500000,
    type: 'withdrawal',
    note: '[TEST] Partial withdrawal'
  },
  // TEST DATA - 2028
  {
    date: '2028-03-15',
    amount: 2000000,
    type: 'deposit',
    note: '[TEST] Large deposit'
  },
  // TEST DATA - 2029
  {
    date: '2029-05-20',
    amount: 1000000,
    type: 'deposit',
    note: '[TEST] Regular contribution'
  },
];

// Calculate total capital invested up to a specific date
export function getTotalCapitalAtDate(targetDate) {
  const target = new Date(targetDate);
  let totalCapital = 0;
  
  for (const event of capitalEvents) {
    const eventDate = new Date(event.date);
    if (eventDate <= target) {
      totalCapital += event.amount;
    }
  }
  
  return totalCapital;
}

// Get capital events for a specific year
export function getCapitalEventsForYear(year) {
  return capitalEvents.filter(event => event.date.startsWith(year));
}

// Calculate capital added during a year (excluding initial if it's the start year)
export function getCapitalAddedInYear(year, isStartYear = false) {
  const events = getCapitalEventsForYear(year);
  let total = 0;
  
  for (const event of events) {
    // Skip initial capital for the starting year
    if (isStartYear && event.type === 'initial') {
      continue;
    }
    total += event.amount;
  }
  
  return total;
}
