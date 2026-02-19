export function toTsArrayFile(varName: string, items: string[]): string {
  const body = items.map((t) => `  ${JSON.stringify(t)},`).join("\n");
  return `export const ${varName}: string[] = [\n${body}\n];\n`;
}
