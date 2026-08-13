import type { ScheduleEvent } from './ScheduleContext';

export const generateICS = (event: ScheduleEvent | { what: string, when: string, where?: string }) => {
  const d = new Date(event.when);
  const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
  const start = formatDate(d);
  const endObj = new Date(d);
  endObj.setHours(endObj.getHours() + 1);
  const end = formatDate(endObj);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.what}`,
    event.where ? `LOCATION:${event.where}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');
};

export const downloadIcsForEvent = (event: ScheduleEvent | { what: string, when: string, where?: string }) => {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.what || 'event'}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};
