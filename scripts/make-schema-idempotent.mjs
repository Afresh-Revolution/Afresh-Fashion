import fs from "fs";
import path from "path";

const schemaPath = path.join(process.cwd(), "schema.sql");
let s = fs.readFileSync(schemaPath, "utf8");

const header = `-- =============================================================================
-- AFRESH Fashion — PostgreSQL schema (IDEMPOTENT)
-- Safe to re-run: skips existing types/tables/indexes; does not DROP data.
-- Adds missing objects and seed rows only where absent.
-- =============================================================================

`;

s = s.replace(
  /^-- =============================================================================[\s\S]*?^BEGIN;/m,
  `${header}BEGIN;`
);

const enumDefs = [
  ["content_status", "'draft', 'published', 'archived'"],
  ["product_badge", "'none', 'new', 'limited'"],
  ["cart_status", "'active', 'merged', 'abandoned', 'converted'"],
  [
    "order_status",
    "'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'",
  ],
  ["inquiry_type", "'press', 'collaboration', 'wholesale', 'support', 'other'"],
  ["marquee_direction", "'forward', 'reverse'"],
  ["editorial_layout", "'featured', 'card', 'mini'"],
  ["admin_role", "'superadmin', 'editor', 'viewer'"],
];

let enumBlock = "-- ENUMS (create only if missing)\n";
for (const [name, vals] of enumDefs) {
  enumBlock += `DO $$ BEGIN CREATE TYPE ${name} AS ENUM (${vals}); EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n`;
}

s = s.replace(
  /-- -\n-- ENUMS[\s\S]*?CREATE TYPE admin_role AS ENUM \('superadmin', 'editor', 'viewer'\);\n\n/,
  `${enumBlock}\n`
);

s = s.replace(/CREATE TABLE /g, "CREATE TABLE IF NOT EXISTS ");
s = s.replace(/CREATE INDEX /g, "CREATE INDEX IF NOT EXISTS ");
s = s.replace(/CREATE UNIQUE INDEX /g, "CREATE UNIQUE INDEX IF NOT EXISTS ");
s = s.replace(
  /CREATE SEQUENCE order_number_seq START 1000;/,
  "CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;"
);

const triggerMatches = [...s.matchAll(/CREATE TRIGGER (trg_\w+)\s+[\s\S]*?ON (\w+)/g)];
const seen = new Set();
for (const [, name, table] of triggerMatches) {
  const key = `${name}|${table}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const drop = `DROP TRIGGER IF EXISTS ${name} ON ${table};\n`;
  s = s.replace(`CREATE TRIGGER ${name}`, `${drop}CREATE TRIGGER ${name}`);
}

fs.writeFileSync(schemaPath, s);
console.log("schema.sql updated (structure)");
