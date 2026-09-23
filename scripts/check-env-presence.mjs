import fs from "node:fs";

const buf = fs.readFileSync(".env.local");
const bom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
const utf16 = (buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff);
const text = buf.toString("utf8").replace(/^\uFEFF/, "");
const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];
const found = {};
for (const line of text.split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match) continue;
  const key = match[1];
  let value = match[2];
  const quoted =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));
  if (quoted) value = value.slice(1, -1);
  found[key] = {
    present: true,
    nonEmpty: value.trim().length > 0,
    length: value.trim().length,
    quoted,
  };
}
const report = {};
for (const key of keys) {
  report[key] = found[key] ?? { present: false, nonEmpty: false, length: 0 };
}
const allKeys = Object.fromEntries(
  Object.entries(found).map(([key, value]) => [
    key,
    { nonEmpty: value.nonEmpty, length: value.length },
  ]),
);
const processKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const fromProcess = Object.fromEntries(
  processKeys.map((key) => [
    key,
    { nonEmpty: Boolean(process.env[key]?.trim()), length: process.env[key]?.trim().length ?? 0 },
  ]),
);
console.log(
  JSON.stringify(
    {
      bytes: buf.length,
      bom,
      utf16,
      newline: text.includes("\r\n") ? "crlf" : "lf",
      fileKeys: allKeys,
      processEnv: fromProcess,
    },
    null,
    2,
  ),
);
