#!/usr/bin/env node
import { resolve } from 'node:path';
import { detect } from '../src/detect.mjs';

function parseArgs(argv) {
  const args = { path: '.', json: false };
  for (const a of argv) {
    if (a === '--json') args.json = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('-')) args.path = a;
  }
  return args;
}

const HELP = `ddd-council detect — deterministic DDD anti-pattern detector (Rust)

Usage:
  ddd-council-detect [path] [--json]

Reads ddd-council.json at <path> (contexts -> paths/module/publicModules) and
flags strategic anti-patterns from the module/use graph:
  leaky-boundary · circular-dependency · god-module · cross-context-coupling

Options:
  --json   machine-readable findings (same shape the council folds in)
  --help   this message
`;

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }
  const root = resolve(args.path);
  let result;
  try {
    result = detect(root);
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
    process.exit(2);
  }

  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(result.findings.length > 0 ? 1 : 0);
  }

  const { findings, contexts, fileCount } = result;
  process.stdout.write(
    `ddd-council detect — ${fileCount} Rust files, ${contexts.length} contexts (${contexts.join(', ')})\n\n`
  );
  if (findings.length === 0) {
    process.stdout.write('No strategic anti-patterns found.\n');
    process.exit(0);
  }
  for (const f of findings) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    process.stdout.write(`[${f.severity}] ${f.signalId}  ${loc}\n`);
    process.stdout.write(`   ${f.message}\n`);
    process.stdout.write(`   → ${f.suggestedMove}\n\n`);
  }
  process.stdout.write(`${findings.length} finding(s).\n`);
  process.exit(1);
}

main();
