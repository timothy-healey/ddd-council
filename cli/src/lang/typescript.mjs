// TypeScript parsing layer behind the language-module seam. Uses the tsx grammar (a
// superset that parses .ts and .tsx), so one parser serves both extensions. Tolerant:
// every collector degrades to empty on malformed source and never throws.
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import { walkTree } from './walk.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { contextForFile } from '../config.mjs';

const parser = new Parser();
parser.setLanguage(TypeScript.tsx);

// Strip the surrounding quotes from a `string` node's text.
function stringValue(node) {
  return node ? node.text.replace(/^['"`]|['"`]$/g, '') : null;
}

// Collect import + re-export specifiers. `import ... from 'x'` and `export ... from 'x'`
// both carry a `source` field; a local `export` (no source) is skipped.
function collectImports(tree) {
  const out = [];
  walkTree(tree, (node) => {
    if (node.type !== 'import_statement' && node.type !== 'export_statement') return false;
    const source = node.childForFieldName('source');
    if (source) {
      const specifier = stringValue(source);
      if (specifier) out.push({ specifier, line: node.startPosition.row + 1 });
    }
    return true; // don't descend into the statement
  });
  return out;
}

// The ONE home of Sequelize write-ness (per-language analogue of the diesel verb sets).
const WRITE_VERBS = new Set(['create', 'bulkCreate', 'update', 'upsert', 'destroy', 'increment', 'decrement', 'findOrCreate', 'restore']);
const READ_VERBS = new Set(['findAll', 'findOne', 'findByPk', 'findAndCountAll', 'count', 'max', 'min', 'sum']);

// Keys of an object literal node -> column names (best-effort).
function objectKeys(objNode) {
  if (!objNode || objNode.type !== 'object') return [];
  const keys = [];
  for (const pair of objNode.namedChildren) {
    if (pair.type !== 'pair') continue;
    const k = pair.childForFieldName('key');
    if (k) keys.push(k.text.replace(/^['"`]|['"`]$/g, ''));
  }
  return keys;
}

// tableName from a Sequelize options object literal, or null.
function tableNameOpt(objNode) {
  if (!objNode || objNode.type !== 'object') return null;
  for (const pair of objNode.namedChildren) {
    if (pair.type !== 'pair') continue;
    const k = pair.childForFieldName('key');
    if (k && k.text.replace(/^['"`]|['"`]$/g, '') === 'tableName') {
      return stringValue(pair.childForFieldName('value'));
    }
  }
  return null;
}

// member call shape: returns { object, property } identifiers for `obj.prop(...)`, else null.
function memberCall(node) {
  if (node.type !== 'call_expression') return null;
  const fn = node.childForFieldName('function');
  if (!fn || fn.type !== 'member_expression') return null;
  const object = fn.childForFieldName('object');
  const property = fn.childForFieldName('property');
  if (!object || !property) return null;
  return { object, property, args: node.childForFieldName('arguments') };
}

function argAt(argsNode, i) {
  if (!argsNode) return null;
  const named = argsNode.namedChildren;
  return named[i] ?? null;
}

function collectTableDefs(tree) {
  const out = [];
  walkTree(tree, (node) => {
    const m = memberCall(node);
    if (!m) return false;
    const verb = m.property.text;
    try {
      if (verb === 'define') {
        // sequelize.define('Name', {attrs}, {options})
        const modelName = stringValue(argAt(m.args, 0));
        const attrs = argAt(m.args, 1);
        const opts = argAt(m.args, 2);
        const table = tableNameOpt(opts) ?? modelName;
        // binding = the variable this define() is assigned to, else the model name.
        let binding = modelName;
        for (let p = node.parent; p; p = p.parent) {
          if (p.type === 'variable_declarator') { binding = (p.childForFieldName('name')?.text) ?? binding; break; }
        }
        if (table) out.push({ table, binding, columns: objectKeys(attrs), line: node.startPosition.row + 1 });
      } else if (verb === 'init' && m.object.type === 'identifier') {
        // Model.init({attrs}, {options})
        const binding = m.object.text;
        const attrs = argAt(m.args, 0);
        const opts = argAt(m.args, 1);
        const table = tableNameOpt(opts) ?? binding;
        out.push({ table, binding, columns: objectKeys(attrs), line: node.startPosition.row + 1 });
      }
    } catch { /* tolerant: skip this def */ }
    return false; // a define/init may nest; keep scanning siblings
  });
  return out;
}

function collectTableAccesses(tree) {
  const out = [];
  walkTree(tree, (node) => {
    const m = memberCall(node);
    if (!m || m.object.type !== 'identifier') return false;
    const verb = m.property.text;
    const isWrite = WRITE_VERBS.has(verb);
    const isRead = READ_VERBS.has(verb);
    if (!isWrite && !isRead) return false;
    out.push({ binding: m.object.text, column: null, kind: isWrite ? 'write' : 'read', line: node.startPosition.row + 1, isTouch: true });
    return false;
  });
  return out;
}

/**
 * Parse one TypeScript source file. Tolerant: unparseable source -> empty collections.
 * @returns {{ imports: Array<{specifier:string,line:number}>, tableDefs: Array, tableAccesses: Array }}
 */
export function parseFile(source) {
  let tree;
  try {
    tree = parser.parse(source);
  } catch {
    return { imports: [], tableDefs: [], tableAccesses: [] };
  }
  return { imports: collectImports(tree), tableDefs: collectTableDefs(tree), tableAccesses: collectTableAccesses(tree) };
}

// TS owns its own resolver config (vet P1): load tsconfig baseUrl/paths, memoised by repoRoot
// so the file is read once per run. Tolerant: missing or non-JSON (JSONC) tsconfig -> empty
// default (relative resolution still works; only alias resolution is skipped).
const _tsconfigCache = new Map();
function tsconfigFor(repoRoot) {
  if (_tsconfigCache.has(repoRoot)) return _tsconfigCache.get(repoRoot);
  let result = { baseUrl: '.', paths: {} };
  const p = join(repoRoot, 'tsconfig.json');
  if (existsSync(p)) {
    try {
      const co = (JSON.parse(readFileSync(p, 'utf8')).compilerOptions) ?? {};
      result = { baseUrl: co.baseUrl ?? '.', paths: co.paths ?? {} };
    } catch { /* JSONC / malformed -> empty default */ }
  }
  _tsconfigCache.set(repoRoot, result);
  return result;
}

// The longest leading non-wildcard prefix of a glob -> the context's base directory.
// 'src/billing/**' -> 'src/billing'; 'billing/**' -> 'billing'.
function baseDir(glob) {
  const segs = glob.split('/');
  const out = [];
  for (const s of segs) {
    if (s.includes('*')) break;
    out.push(s);
  }
  return out.join('/');
}

// Resolve a specifier to a repo-relative path (no extension needed for glob matching),
// or null if it's a bare/external specifier we don't resolve. Pure (tsconfig passed in)
// so the alias substitution is unit-testable (via the default export's `resolveSpecifier`).
function resolveSpecifier(specifier, fromFile, tsconfig) {
  if (specifier.startsWith('.')) {
    // relative to the importing file's directory
    return normalize(join(dirname(fromFile), specifier)).split('\\').join('/');
  }
  // tsconfig path alias: '@app/*': ['src/*'] -> substitute the matched tail
  for (const [pattern, targets] of Object.entries(tsconfig?.paths ?? {})) {
    const star = pattern.indexOf('*');
    if (star === -1) continue;
    const prefix = pattern.slice(0, star);
    const suffix = pattern.slice(star + 1);
    if (specifier.startsWith(prefix) && specifier.endsWith(suffix)) {
      const tail = specifier.slice(prefix.length, specifier.length - suffix.length);
      const target = (targets[0] ?? '').replace('*', tail);
      const base = tsconfig.baseUrl && tsconfig.baseUrl !== '.' ? tsconfig.baseUrl + '/' : '';
      return normalize(base + target).split('\\').join('/');
    }
  }
  return null; // bare package -> external
}

// Public-surface check: the first path segment past the context base decides, mirroring
// Rust's restModule. The context-root barrel (no segment / 'index') is never a leak.
function publicSurface(targetRel, contextCfg) {
  const base = baseDir(contextCfg.paths[0] ?? '');
  let rel = targetRel;
  if (base && (targetRel === base)) rel = '';
  else if (base && targetRel.startsWith(base + '/')) rel = targetRel.slice(base.length + 1);
  const segs = rel.split('/').filter(Boolean);
  const first = segs[0];
  const restModule = first && first !== 'index' ? first : null;
  const isLeak = restModule != null && !contextCfg.publicModules.includes(restModule);
  return { restModule, isLeak };
}

export default {
  extensions: ['.ts', '.tsx'],
  parseFile,
  resolveSpecifier,
  resolveImport({ specifier }, { fromFile, fromContext, config, repoRoot }) {
    const targetRel = resolveSpecifier(specifier, fromFile, tsconfigFor(repoRoot));
    if (!targetRel) return null;
    // Specifiers like `../billing` resolve to a directory path (`src/billing`).
    // The glob `src/billing/**` won't match that bare dir, so also probe with `/index`.
    const toContext = contextForFile(targetRel, config) ?? contextForFile(targetRel + '/index', config);
    if (!toContext || toContext === fromContext) return null;
    const { restModule, isLeak } = publicSurface(targetRel, config.contexts[toContext]);
    const moduleKey = restModule ? `${toContext}/${restModule}` : toContext;
    return { toContext, restModule, isLeak, displayPath: specifier, moduleKey };
  },
};
