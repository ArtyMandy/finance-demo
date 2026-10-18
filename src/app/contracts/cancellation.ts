import type { IsoDate, Profile, RecurringItem } from '../data/models';
import { addDays } from '../data/months';
import { formatDate } from '../shared/format';

/** Plain-text cancellation letter for a contract, filled with the profile's address. */
export function cancellationLetter(item: RecurringItem, profile: Profile, today: IsoDate): string {
  const sender = [
    profile.name || '[Dein Name]',
    profile.street || '[Straße Hausnummer]',
    profile.city || '[PLZ Ort]',
  ];
  const place = profile.city.replace(/^\d+\s*/, '') || '[Ort]';
  const reference = item.customerNumber ? ` (Kunden-/Vertragsnummer: ${item.customerNumber})` : '';
  return [
    ...sender,
    '',
    item.provider || item.name,
    '',
    `${place}, ${formatDate(today)}`,
    '',
    `Kündigung meines Vertrags „${item.name}“${reference}`,
    '',
    'Sehr geehrte Damen und Herren,',
    '',
    `hiermit kündige ich meinen Vertrag „${item.name}“${reference} fristgerecht zum nächstmöglichen Zeitpunkt.`,
    '',
    'Bitte bestätigen Sie mir den Eingang dieser Kündigung und das Datum des Vertragsendes schriftlich. ' +
      'Einer Nutzung meiner Daten zu Werbezwecken sowie Rückgewinnungsanrufen widerspreche ich.',
    '',
    'Mit freundlichen Grüßen',
    '',
    profile.name || '[Dein Name]',
  ].join('\n');
}

const icsDate = (date: IsoDate) => date.replace(/-/g, '');
const icsEscape = (text: string) =>
  text.replace(/[\\;,]/g, (char) => `\\${char}`).replace(/\n/g, '\\n');

/**
 * Calendar reminder 30 days before the cancellation deadline (or today if that is later),
 * so the user gets notified by their own calendar app.
 */
export function cancellationReminder(item: RecurringItem, today: IsoDate, uid: string): string {
  const reminder = addDays(item.cancelBy, -30) > today ? addDays(item.cancelBy, -30) : today;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Finanz-demo//Vertragswecker//DE',
    'BEGIN:VEVENT',
    `UID:${uid}@finanz-demo`,
    `DTSTAMP:${icsDate(today)}T090000Z`,
    `DTSTART;VALUE=DATE:${icsDate(reminder)}`,
    `DTEND;VALUE=DATE:${icsDate(addDays(reminder, 1))}`,
    `SUMMARY:${icsEscape(`Kündigungsfrist: ${item.name}`)}`,
    `DESCRIPTION:${icsEscape(`Kündigung bis ${formatDate(item.cancelBy)} beim Anbieter eingehen lassen.`)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(`Kündigungsfrist ${item.name}`)}`,
    'TRIGGER:PT9H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
