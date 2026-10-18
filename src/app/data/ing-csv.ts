import type { IsoDate } from './models';

/** One booking read from an ING "Umsatzanzeige" CSV export. */
export interface ParsedBooking {
  date: IsoDate;
  amount: number;
  counterparty: string;
  bookingText: string;
  purpose: string;
  /** Stable fingerprint; identical bookings on the same day get a running number. */
  importKey: string;
}

export interface ParseResult {
  bookings: ParsedBooking[];
  iban: string;
  errors: string[];
}

/** ING exports are Windows-1252 (older) or UTF-8 (newer); try strict UTF-8 first. */
export function decodeCsv(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/** Splits one semicolon-separated line, honoring double quotes. */
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ';') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((field) => field.trim());
}

/** "1.234,56" → 1234.56 */
export function parseGermanNumber(text: string): number {
  const cleaned = text.replace(/\s|€/g, '').replace(/\./g, '').replace(',', '.');
  return cleaned === '' ? Number.NaN : Number(cleaned);
}

/** "18.10.2026" → "2026-10-18" */
export function parseGermanDate(text: string): IsoDate | undefined {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text.trim());
  return match ? `${match[3]}-${match[2]}-${match[1]}` : undefined;
}

function fingerprint(booking: Omit<ParsedBooking, 'importKey'>): string {
  return [
    booking.date,
    booking.amount.toFixed(2),
    booking.counterparty.toLowerCase(),
    booking.purpose.toLowerCase(),
  ].join('|');
}

/**
 * Parses the ING CSV export ("Umsatzanzeige"). The metadata block on top is skipped;
 * columns are found by their header names, so old and new layouts both work.
 */
export function parseIngCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const errors: string[] = [];
  let iban = '';

  const headerIndex = lines.findIndex((line) => /^"?Buchung"?;/.test(line));
  for (const line of lines.slice(0, headerIndex < 0 ? 0 : headerIndex)) {
    const [key, value] = splitCsvLine(line);
    if (key === 'IBAN' && value) iban = value.replace(/\s/g, '');
  }
  if (headerIndex < 0) {
    return {
      bookings: [],
      iban,
      errors: ['Keine Kopfzeile „Buchung;…“ gefunden. Ist das ein Umsatzexport der ING?'],
    };
  }

  const header = splitCsvLine(lines[headerIndex]);
  const column = (name: string) =>
    header.findIndex((title) => title.toLowerCase() === name.toLowerCase());
  const dateCol = column('Buchung');
  const counterpartyCol = column('Auftraggeber/Empfänger');
  const textCol = column('Buchungstext');
  const purposeCol = column('Verwendungszweck');
  const amountCol = column('Betrag');
  if (dateCol < 0 || amountCol < 0) {
    return { bookings: [], iban, errors: ['Die Spalten „Buchung“ und „Betrag“ fehlen.'] };
  }

  const seen = new Map<string, number>();
  const bookings: ParsedBooking[] = [];
  lines.slice(headerIndex + 1).forEach((line, offset) => {
    if (!line.trim()) return;
    const fields = splitCsvLine(line);
    const date = parseGermanDate(fields[dateCol] ?? '');
    const amount = parseGermanNumber(fields[amountCol] ?? '');
    if (!date || Number.isNaN(amount)) {
      errors.push(`Zeile ${headerIndex + offset + 2} konnte nicht gelesen werden.`);
      return;
    }
    const booking = {
      date,
      amount,
      counterparty: fields[counterpartyCol] ?? '',
      bookingText: fields[textCol] ?? '',
      purpose: fields[purposeCol] ?? '',
    };
    const base = fingerprint(booking);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    bookings.push({ ...booking, importKey: `ing|${base}|${count}` });
  });

  return { bookings, iban, errors };
}
