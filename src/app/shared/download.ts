/** Lets the browser save generated text as a file. */
export function downloadText(
  document: Document,
  filename: string,
  content: string,
  type = 'text/plain',
): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** File name safe slug: "Netflix Abo" → "netflix-abo". */
export function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'datei'
  );
}

/** Saves all finance data as a JSON backup that "Profil & Daten" can restore. */
export function downloadBackup(document: Document, data: unknown, today: string): void {
  downloadText(
    document,
    `finanz-demo-sicherung-${today}.json`,
    JSON.stringify(data, null, 2),
    'application/json',
  );
}
