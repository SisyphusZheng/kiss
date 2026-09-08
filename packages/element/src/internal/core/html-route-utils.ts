/** Insert markup before a tolerant HTML body close (`</body >`, case-insensitive). */
export function insertBeforeBodyClose(html: string, content: string): string {
  const match = /<\/body\s*>/i.exec(html);
  if (!match || match.index === undefined) return `${html}\n${content}\n`;
  return `${html.slice(0, match.index)}${content}\n${html.slice(match.index)}`;
}
