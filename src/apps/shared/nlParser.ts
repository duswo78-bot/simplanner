import type { RecurrenceType } from './ScheduleContext';

export interface ParsedInput {
  type: 'event' | 'memo' | 'error';
  what: string;
  where: string;
  when: string; // ISO date string
  isTodo: boolean;
  recurrence: RecurrenceType;
  errorMsg?: string;
}

export function parseInput(text: string): ParsedInput {
  let what = text;
  let where = '';
  let isTodo = true; 
  let targetDate = new Date();
  let recurrence: RecurrenceType = 'none';
  let hasSpecificTime = false;

  // 1. Explicit Overrides
  if (text.includes('메모:')) {
    return { 
      type: 'memo', 
      what: text.replace('메모:', '').trim(), 
      where: '', 
      when: '', 
      isTodo: false, 
      recurrence: 'none' 
    };
  }

  // 2. Parse Recurrence
  const textNoSpace = text.replace(/\s+/g, ''); // For easier matching without worrying about spaces
  
  const dailyMatch = textNoSpace.match(/(\d+)일마다|(\d+)일에한번/);
  const weeklyMatch = textNoSpace.match(/(\d+)주마다|(\d+)주에한번/);
  const monthlyMatch = textNoSpace.match(/(\d+)개월마다|(\d+)달마다|(\d+)개월에한번|(\d+)달에한번/);
  const yearlyMatch = textNoSpace.match(/(\d+)년마다|(\d+)년에한번/);
  const freqWeeklyMatch = textNoSpace.match(/주(\d+)회|주(\d+)번/);
  const freqMonthlyMatch = textNoSpace.match(/월(\d+)회|월(\d+)번/);
  const freqYearlyMatch = textNoSpace.match(/연(\d+)회|년(\d+)회|연(\d+)번|년(\d+)번/);

  if (dailyMatch) {
    recurrence = `daily:${dailyMatch[1] || dailyMatch[2]}`;
    what = what.replace(new RegExp(`${dailyMatch[0].split('').join('\\s*')}`), '').trim();
  } else if (weeklyMatch) {
    recurrence = `weekly:${weeklyMatch[1] || weeklyMatch[2]}`;
    what = what.replace(new RegExp(`${weeklyMatch[0].split('').join('\\s*')}`), '').trim();
  } else if (monthlyMatch) {
    recurrence = `monthly:${monthlyMatch[1] || monthlyMatch[2] || monthlyMatch[3] || monthlyMatch[4]}`;
    what = what.replace(new RegExp(`${monthlyMatch[0].split('').join('\\s*')}`), '').trim();
  } else if (yearlyMatch) {
    recurrence = `yearly:${yearlyMatch[1] || yearlyMatch[2]}`;
    what = what.replace(new RegExp(`${yearlyMatch[0].split('').join('\\s*')}`), '').trim();
  } else if (freqWeeklyMatch) {
    recurrence = `freq:weekly:${freqWeeklyMatch[1] || freqWeeklyMatch[2]}`;
    what = what.replace(new RegExp(`${freqWeeklyMatch[0].split('').join('\\s*')}`), '').trim();
  } else if (freqMonthlyMatch) {
    recurrence = `freq:monthly:${freqMonthlyMatch[1] || freqMonthlyMatch[2]}`;
    what = what.replace(new RegExp(`${freqMonthlyMatch[0].split('').join('\\s*')}`), '').trim();
  } else if (freqYearlyMatch) {
    recurrence = `freq:yearly:${freqYearlyMatch[1] || freqYearlyMatch[2] || freqYearlyMatch[3] || freqYearlyMatch[4]}`;
    what = what.replace(new RegExp(`${freqYearlyMatch[0].split('').join('\\s*')}`), '').trim();
  } else if (text.match(/격일|하루\s*걸러|이틀에\s*한번|이틀에\s*한\s*번|이틀마다/)) {
    recurrence = 'daily:2';
    what = what.replace(/격일|하루\s*걸러|이틀에\s*한번|이틀에\s*한\s*번|이틀마다/g, '').trim();
  } else if (text.match(/격주|이주에\s*한번|이주에\s*한\s*번|이주마다|둘째\s*주마다/)) {
    recurrence = 'weekly:2';
    what = what.replace(/격주|이주에\s*한번|이주에\s*한\s*번|이주마다|둘째\s*주마다/g, '').trim();
  } else if (text.match(/격월|두달에\s*한번|두달에\s*한\s*번|두\s*달마다|두\s*달에\s*한번/)) {
    recurrence = 'monthly:2';
    what = what.replace(/격월|두달에\s*한번|두달에\s*한\s*번|두\s*달마다|두\s*달에\s*한번/g, '').trim();
  } else if (text.match(/매일|날마다|하루마다|하루에\s*한번|하루에\s*한\s*번/)) {
    recurrence = 'daily:1';
    what = what.replace(/매일|날마다|하루마다|하루에\s*한번|하루에\s*한\s*번|매일매일|매일\s*같이|매일같이/g, '').trim();
  } else if (text.match(/매주|일주일에\s*한번|일주일에\s*한\s*번|주마다|일주일마다|매주마다/)) {
    recurrence = 'weekly:1';
    what = what.replace(/매주|일주일에\s*한번|일주일에\s*한\s*번|주마다|일주일마다|매주마다/g, '').trim();
  } else if (text.match(/매달|매월|한달에\s*한번|한달에\s*한\s*번|한\s*달에\s*한번|달마다|한달마다|매개월/)) {
    recurrence = 'monthly:1';
    what = what.replace(/매달|매월|한달에\s*한번|한달에\s*한\s*번|한\s*달에\s*한번|달마다|한달마다|매개월/g, '').trim();
  } else if (text.match(/매년|매해|해마다|일년에\s*한번|일년에\s*한\s*번|일\s*년에\s*한번|매년마다/)) {
    recurrence = 'yearly:1';
    what = what.replace(/매년|매해|해마다|일년에\s*한번|일년에\s*한\s*번|일\s*년에\s*한번|매년마다/g, '').trim();
  }

  // 3. Parse Date (Specific dates like 8/13 or 8월 13일)
  const dateMatch = what.match(/(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*에)?|(\d{1,2})월\s*(\d{1,2})일(?:\s*에)?/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1] || dateMatch[3], 10);
    const day = parseInt(dateMatch[2] || dateMatch[4], 10);
    
    // Set to current year by default
    targetDate.setMonth(month - 1, day);
    
    what = what.replace(dateMatch[0], '').trim();
  }

  // 4. Parse Relative Dates (내일, 모레, 다음주 등)
  const daysMap: Record<string, number> = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
  
  if (what.includes('내일')) {
    targetDate.setDate(targetDate.getDate() + 1);
    what = what.replace('내일', '').trim();
  } else if (what.includes('모레')) {
    targetDate.setDate(targetDate.getDate() + 2);
    what = what.replace('모레', '').trim();
  } else if (what.includes('오늘')) {
    what = what.replace('오늘', '').trim();
  }

  // 이번주 / 다음주 처리
  const weekMatch = what.match(/(이번주|다음주)\s*(월|화|수|목|금|토|일)요일?(?:\s*에)?/);
  if (weekMatch) {
    const isNextWeek = weekMatch[1] === '다음주';
    const targetDay = daysMap[weekMatch[2]];
    const currentDay = targetDate.getDay();
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7; // Get to this week's target day
    if (isNextWeek) diff += 7;
    
    targetDate.setDate(targetDate.getDate() + diff);
    what = what.replace(weekMatch[0], '').trim();
  } else {
    // 그냥 요일만 쓴 경우 (예: "수요일")
    const dayMatch = what.match(/(월|화|수|목|금|토|일)요일?(?:\s*에)?/);
    if (dayMatch) {
      const targetDay = daysMap[dayMatch[1]];
      const currentDay = targetDate.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7; // Usually implies next upcoming
      targetDate.setDate(targetDate.getDate() + diff);
      what = what.replace(dayMatch[0], '').trim();
    }
  }

  // 5. Parse Time (오전/오후 H시 M분)
  const timeMatch = what.match(/(오전|오후|아침|점심|저녁|밤)?\s*(\d{1,2})시(?:\s*(\d{1,2})분|반)?(?:\s*에)?/);
  if (timeMatch) {
    const modifier = timeMatch[1];
    let hour = parseInt(timeMatch[2], 10);
    let minute = timeMatch[3] ? parseInt(timeMatch[3], 10) : (what.includes('반') && timeMatch[0].includes('반') ? 30 : 0);

    if (modifier === '오후' || modifier === '저녁' || modifier === '밤') {
      if (hour < 12) hour += 12;
    } else if (modifier === '오전' || modifier === '아침') {
      if (hour === 12) hour = 0;
    }

    targetDate.setHours(hour, minute, 0, 0);
    what = what.replace(timeMatch[0], '').trim();
    hasSpecificTime = true;
  } else {
    // Set to 00:00:00 if no specific time
    targetDate.setHours(0, 0, 0, 0);
  }

  // 6. Parse Location
  const locMatch = what.match(/([가-힣a-zA-Z0-9]+)\s*(?:에서|에\s*서|으로|로)(?:\s+|$)/);
  if (locMatch) {
    where = locMatch[1];
    what = what.replace(locMatch[0], ' ').trim();
  }

  // 7. Determine Intent
  if (text.includes('일정:')) {
    isTodo = false;
    what = what.replace('일정:', '').trim();
  } else if (text.includes('할일:')) {
    isTodo = true;
    what = what.replace('할일:', '').trim();
  } else {
    // Heuristic rules
    if (/(사기|하기|정하기|준비|계획|작성|관리)$/.test(what)) {
      isTodo = true; // explicitly doing something
    } else if (hasSpecificTime) {
      isTodo = false; // if there's a time, it's usually an event/schedule
    }
  }

  what = what.trim();
  if (!what) {
    return { type: 'error', errorMsg: '내용을 입력해주세요.', what: '', where: '', when: '', isTodo: false, recurrence: 'none' };
  }

  return {
    type: 'event',
    what,
    where,
    when: targetDate.toISOString(),
    isTodo,
    recurrence
  };
}
