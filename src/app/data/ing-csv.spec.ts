import { decodeCsv, parseGermanNumber, parseIngCsv, splitCsvLine } from './ing-csv';

const SAMPLE = [
  'Umsatzanzeige;Datei erstellt am: 18.10.2026 09:00',
  '',
  'IBAN;DE12 5001 0517 0000 0000 00',
  'Kontoname;Girokonto',
  'Bank;ING',
  'Kunde;Max Mustermann',
  'Zeitraum;01.10.2026 - 18.10.2026',
  'Saldo;2.345,67;EUR',
  '',
  'Sortierung;Datum absteigend',
  '',
  'Buchung;Wertstellungsdatum;Auftraggeber/Empfänger;Buchungstext;Verwendungszweck;Saldo;Währung;Betrag;Währung',
  '17.10.2026;17.10.2026;REWE Markt GmbH;Lastschrift;"Einkauf; Filiale 12";2.345,67;EUR;-45,10;EUR',
  '15.10.2026;15.10.2026;Netflix;Lastschrift;Abo;2.390,77;EUR;-13,99;EUR',
  '15.10.2026;15.10.2026;Netflix;Lastschrift;Abo;2.404,76;EUR;-13,99;EUR',
  '01.10.2026;01.10.2026;Muster GmbH;Gehalt/Rente;Gehalt Oktober;2.418,75;EUR;3.450,00;EUR',
].join('\r\n');

describe('ING CSV import', () => {
  it('splits semicolon lines and honors quotes', () => {
    expect(splitCsvLine('a;"b; c";"d ""x"""')).toEqual(['a', 'b; c', 'd "x"']);
  });

  it('parses German numbers', () => {
    expect(parseGermanNumber('-1.234,56')).toBe(-1234.56);
    expect(parseGermanNumber('3.450,00')).toBe(3450);
  });

  it('skips the metadata block and reads all bookings', () => {
    const result = parseIngCsv(SAMPLE);
    expect(result.errors).toEqual([]);
    expect(result.iban).toBe('DE12500105170000000000');
    expect(result.bookings).toHaveLength(4);
    expect(result.bookings[0]).toMatchObject({
      date: '2026-10-17',
      amount: -45.1,
      counterparty: 'REWE Markt GmbH',
      bookingText: 'Lastschrift',
      purpose: 'Einkauf; Filiale 12',
    });
    expect(result.bookings[3].amount).toBe(3450);
  });

  it('gives identical bookings on the same day distinct keys', () => {
    const [, first, second] = parseIngCsv(SAMPLE).bookings;
    expect(first.importKey).not.toBe(second.importKey);
    expect(parseIngCsv(SAMPLE).bookings[1].importKey).toBe(first.importKey);
  });

  it('reports files without the booking header', () => {
    expect(parseIngCsv('foo;bar').errors[0]).toContain('Kopfzeile');
  });

  it('decodes Windows-1252 files with umlauts', () => {
    const bytes = new Uint8Array([0x45, 0x6d, 0x70, 0x66, 0xe4, 0x6e, 0x67, 0x65, 0x72]); // "Empfänger"
    expect(decodeCsv(bytes.buffer)).toBe('Empfänger');
  });
});
