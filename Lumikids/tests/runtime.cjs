// Run app modules with real SQLite/Skia while substituting native UI and network boundaries.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(__dirname, '..');

function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (Object.hasOwn(mocks, file)) return mocks[file];
    if (cache.has(file)) return cache.get(file).exports;
    const mod = new Module(file, module);
    cache.set(file, mod);
    mod.filename = file;
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod.require = specifier => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      if (specifier.startsWith('.')) {
        const base = path.resolve(path.dirname(file), specifier);
        const target = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts')]
          .find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        if (!target) throw new Error('Cannot resolve ' + base);
        if (/\.tsx?$/.test(target)) return load(target);
      }
      return Module.createRequire(file)(specifier);
    };
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.React, esModuleInterop: true, inlineSourceMap: true, inlineSources: true },
    });
    mod._compile(output.outputText, file);
    return mod.exports;
  }
  return load;
}

function sqlite(filename = ':memory:') {
  const raw = new DatabaseSync(filename);
  const db = {
    runSync: (sql, params = []) => raw.prepare(sql).run(...params),
    getFirstSync: (sql, params = []) => raw.prepare(sql).get(...params) ?? null,
    getAllSync: (sql, params = []) => raw.prepare(sql).all(...params),
    execSync: sql => raw.exec(sql),
    withTransactionSync(task) {
      raw.exec('BEGIN');
      try { task(); raw.exec('COMMIT'); }
      catch (error) { raw.exec('ROLLBACK'); throw error; }
    },
  };
  return { raw, db };
}

// A hook harness, not a native renderer. Executes the component's real handlers and render code.
function hooks() {
  let slots = [], cursor = 0, pending = [];
  const equal = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const React = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    Fragment: 'Fragment',
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], v => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useMemo(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !equal(slots[i].deps, deps)) slots[i] = { deps, value: fn() };
      return slots[i].value;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !equal(slots[i].deps, deps)) {
        pending.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  React.useCallback = (fn, deps) => React.useMemo(() => fn, deps);
  return { React, render(Component, props = {}) {
    cursor = 0; const tree = Component(props);
    const effects = pending; pending = []; effects.forEach(fn => fn());
    return tree;
  } };
}
function nodes(tree, predicate) {
  const result = [];
  function visit(n) {
    if (Array.isArray(n)) return n.forEach(visit);
    if (!n || typeof n !== 'object') return;
    if (predicate(n)) result.push(n);
    visit(n.props?.children);
  }
  visit(tree); return result;
}
const native = {
  View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity', ScrollView: 'ScrollView',
  StyleSheet: { create: value => value, absoluteFill: {} },
  PanResponder: { create: handlers => ({ panHandlers: handlers }) },
};
module.exports = { loader, sqlite, hooks, nodes, native, root };
