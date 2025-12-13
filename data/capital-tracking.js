// Track capital additions/withdrawals to calculate true profit
// Add entries whenever you deposit or withdraw money

export const capitalEvents = [
  {
    date: '2025-11-12',
    amount: 9143568, // Initial portfolio value
    type: 'initial',
    note: 'Initial portfolio snapshot - Nov 12, 2025'
  },
  // Add new entries when you add money, for example:
  // {
  //   date: '2025-12-15',
  //   amount: 500000,
  //   type: 'deposit',
  //   note: 'Added ¥500K for new investments'
  // },
  // {
  //   date: '2026-01-10',
  //   amount: -200000,
  //   type: 'withdrawal',
  //   note: 'Withdrew ¥200K for expenses'
  // },
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
