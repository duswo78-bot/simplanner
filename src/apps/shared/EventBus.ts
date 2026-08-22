import type { Transaction } from '../AccountBook/AccountStore';
import type { ScheduleEvent } from './ScheduleContext';

const ACCOUNT_BOOK_KEY = 'simplanner_account_book_data';
const PLANNER_KEY = 'simplanner_events';
const CAR_LEDGER_KEY = 'simplanner_car_ledger_data';

// --- Account Book ---
export const pushToAccountBook = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
  try {
    const raw = localStorage.getItem(ACCOUNT_BOOK_KEY);
    const transactions: Transaction[] = raw ? JSON.parse(raw) : [];
    
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    transactions.unshift(newTransaction);
    localStorage.setItem(ACCOUNT_BOOK_KEY, JSON.stringify(transactions));
    
    window.dispatchEvent(new CustomEvent('account_book_updated'));
    return true;
  } catch (e) {
    console.error('Failed to push to AccountBook', e);
    return false;
  }
};

// --- Planner ---
export const pushToPlanner = (event: Omit<ScheduleEvent, 'id'>) => {
  try {
    const raw = localStorage.getItem(PLANNER_KEY);
    const events: ScheduleEvent[] = raw ? JSON.parse(raw) : [];
    
    const newEvent: ScheduleEvent = {
      ...event,
      status: event.status || 'todo',
      recurrence: event.recurrence || 'none',
      completedDates: event.completedDates || [],
      id: Date.now().toString() + Math.random().toString(36).substring(7),
    };
    
    events.push(newEvent);
    localStorage.setItem(PLANNER_KEY, JSON.stringify(events));
    
    window.dispatchEvent(new CustomEvent('planner_updated'));
    return true;
  } catch (e) {
    console.error('Failed to push to Planner', e);
    return false;
  }
};

// --- Car Ledger ---
export const pushToCarLedger = (
  type: 'expense' | 'maintenance',
  record: any
) => {
  try {
    const raw = localStorage.getItem(CAR_LEDGER_KEY);
    const data = raw ? JSON.parse(raw) : { vehicles: [], drives: [], fuels: [], maintenances: [], expenses: [] };
    
    const newRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    if (type === 'expense') {
      data.expenses = [newRecord, ...(data.expenses || [])];
    } else if (type === 'maintenance') {
      data.maintenances = [newRecord, ...(data.maintenances || [])];
    }

    localStorage.setItem(CAR_LEDGER_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('car_ledger_updated'));
    return true;
  } catch (e) {
    console.error('Failed to push to Car Ledger', e);
    return false;
  }
};
