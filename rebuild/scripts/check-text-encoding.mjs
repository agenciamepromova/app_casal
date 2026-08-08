import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", ".vercel", "node_modules"]);
const extensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".sql", ".toml", ".ts", ".tsx", ".txt", ".yml", ".yaml"]);
const suspicious = /\uFFFD|\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2[\u0080-\u00BF]/u;
const decoder = new TextDecoder("utf-8", { fatal: true });
const failures = [];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name === "package-lock.json") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await scan(path); continue; }
    if (!extensions.has(extname(entry.name))) continue;
    const bytes = await readFile(path);
    let content;
    try { content = decoder.decode(bytes); }
    catch { failures.push(`${relative(root, path)}: arquivo inválido em UTF-8`); continue; }
    content.split(/\r?\n/u).forEach((line, index) => {
      if (suspicious.test(line)) failures.push(`${relative(root, path)}:${index + 1}: sequência suspeita de mojibake`);
    });
  }
}

await scan(root);
if (failures.length) {
  console.error(`Falha na integridade textual:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("Integridade textual aprovada: UTF-8 válido e nenhum mojibake encontrado.");
