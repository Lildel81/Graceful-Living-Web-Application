// Generate Joi schemas + HPP whitelist from forms in EJS/HTML.
// Run: node generate-schemas.js "views/**/*.{ejs,html}"
// Dev deps: npm i -D jsdom glob

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { JSDOM } = require('jsdom');

const patterns = process.argv.slice(2);
if (!patterns.length) {
  console.error('Usage: node generate-schemas.js "views/**/*.{ejs,html}"');
  process.exit(1);
}

const files = patterns.flatMap(p => glob.sync(p, { nodir: true }));
if (!files.length) {
  console.error('No files matched those patterns.');
  process.exit(1);
}

// Helpers
const esc = (v) => JSON.stringify(v);
const uniq = (arr) => [...new Set(arr)];
const trim = (s) => (typeof s === 'string' ? s.trim() : s);

// Data accumulators
const forms = []; // { file, method, action, fields: Map<name, info> }
const hppWhitelist = new Set();

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');

  // crude: strip EJS control blocks to reduce parser hiccups
  html = html.replace(/<%[\s\S]*?%>/g, '');

  const dom = new JSDOM(html, { contentType: 'text/html' });
  const doc = dom.window.document;

  doc.querySelectorAll('form').forEach(form => {
    const method = (form.getAttribute('method') || 'GET').toUpperCase();
    let action = form.getAttribute('action') || '(no action)';
    // normalize action: remove query string in action if present
    action = action.split('?')[0];

    const fields = new Map();

    // Gather inputs
    form.querySelectorAll('input[name]').forEach(input => {
      const name = input.getAttribute('name');
      const type = (input.getAttribute('type') || 'text').toLowerCase();
      const value = input.getAttribute('value') || '';
      const required = input.hasAttribute('required');
      const max = input.getAttribute('maxlength');
      const min = input.getAttribute('min');
      const maxAttr = input.getAttribute('max');
      const pattern = input.getAttribute('pattern');

      if (!fields.has(name)) {
        fields.set(name, {
          kind: type,        // first seen wins; radios/checkboxes will be unified
          values: new Set(), // for radios/checkboxes/selects
          required: false,   // any member required => required
          multiple: false,
          constraints: { max, min, maxAttr, pattern },
          typesSeen: new Set([type]),
        });
      }
      const f = fields.get(name);
      f.typesSeen.add(type);
      f.required = f.required || required;

      if (type === 'radio') {
        f.kind = 'radio';
        if (value) f.values.add(value);
      } else if (type === 'checkbox') {
        f.kind = 'checkbox';
        f.multiple = true;
        if (value) f.values.add(value);
        hppWhitelist.add(name);
      } else {
        // text, email, number, tel, password, etc.
        if (f.kind !== 'radio' && f.kind !== 'checkbox') {
          f.kind = type;
        }
      }
    });

    // Selects
    form.querySelectorAll('select[name]').forEach(sel => {
      const name = sel.getAttribute('name');
      const multiple = sel.hasAttribute('multiple');
      const required = sel.hasAttribute('required');

      if (!fields.has(name)) {
        fields.set(name, {
          kind: 'select',
          values: new Set(),
          required,
          multiple,
          constraints: {},
          typesSeen: new Set(['select']),
        });
      }
      const f = fields.get(name);
      f.kind = 'select';
      f.required = f.required || required;
      f.multiple = f.multiple || multiple;
      if (multiple) hppWhitelist.add(name);

      sel.querySelectorAll('option').forEach(opt => {
        const v = opt.hasAttribute('value') ? opt.getAttribute('value') : opt.textContent.trim();
        if (v) f.values.add(v);
      });
    });

    // Textareas
    form.querySelectorAll('textarea[name]').forEach(ta => {
      const name = ta.getAttribute('name');
      const required = ta.hasAttribute('required');
      const max = ta.getAttribute('maxlength');

      if (!fields.has(name)) {
        fields.set(name, {
          kind: 'textarea',
          values: new Set(),
          required,
          multiple: false,
          constraints: { max },
          typesSeen: new Set(['textarea']),
        });
      } else {
        const f = fields.get(name);
        f.kind = 'textarea';
        f.required = f.required || required;
        if (max) f.constraints.max = max;
      }
    });

    forms.push({ file, method, action, fields });
  });
}

// ---- Printing ----

function joiForField(name, f) {
  const max = f.constraints?.max ? parseInt(f.constraints.max, 10) : null;
  const minNum = f.constraints?.min ? Number(f.constraints.min) : null;
  const maxNum = f.constraints?.maxAttr ? Number(f.constraints.maxAttr) : null;
  const pattern = f.constraints?.pattern;

  const req = f.required ? '.required()' : '';

  // choose base by kind
  if (f.kind === 'radio') {
    const vals = [...f.values].map(esc).join(', ');
    return `${name}: Joi.string().valid(${vals})${req}`;
  }

  if (f.kind === 'checkbox') {
    const vals = [...f.values].map(esc).join(', ');
    const base = `Joi.array().items(Joi.string().valid(${vals})).single()`;
    const min1 = f.required ? '.min(1)' : '';
    return `${name}: ${base}${min1}${req ? '' : ''}`;
  }

  if (f.kind === 'select') {
    const vals = [...f.values].map(esc).join(', ');
    if (f.multiple) {
      const base = `Joi.array().items(Joi.string().valid(${vals})).single()`;
      const min1 = f.required ? '.min(1)' : '';
      return `${name}: ${base}${min1}${req ? '' : ''}`;
    } else {
      return `${name}: Joi.string().valid(${vals})${req}`;
    }
  }

  if (f.kind === 'email') {
    let s = `Joi.string().lowercase().email({ tlds: false })`;
    if (max) s += `.max(${max})`;
    return `${name}: ${s}${req}`;
  }

  if (f.kind === 'number') {
    let s = `Joi.number()`;
    if (!Number.isNaN(minNum) && minNum !== null) s += `.min(${minNum})`;
    if (!Number.isNaN(maxNum) && maxNum !== null) s += `.max(${maxNum})`;
    return `${name}: ${s}${req}`;
  }

  if (f.kind === 'tel') {
    let s = `Joi.string().max(20)`;
    return `${name}: ${s}${req}`;
  }

  // default text-ish
  let s = `Joi.string()`;
  if (max) s += `.max(${max})`;
  if (pattern) s += `.pattern(new RegExp(${esc(pattern)}))`;
  return `${name}: ${s}${req}`;
}

function printSchemaForForm(form) {
  const entries = [];
  // Assume CSRF is required for POST forms
  if (form.method === 'POST') {
    entries.push(`_csrf: Joi.string().required()`);
  }
  for (const [name, info] of form.fields.entries()) {
    entries.push(joiForField(name, info));
  }

  const key = `${form.method} ${form.action}`;
  console.log(`\n// From ${path.relative(process.cwd(), form.file)}\n'${key}': Joi.object({`);
  console.log('  ' + entries.join(',\n  '));
  console.log(`}).prefs({ abortEarly: false, stripUnknown: true }),`);
}

// Output HPP whitelist and Joi registry entries
console.log('// ===== HPP whitelist (add to index.js) =====');
console.log('const hpp = require("hpp");');
console.log(`app.use(hpp({ whitelist: ${JSON.stringify([...hppWhitelist].sort())} }));`);
console.log('\n// ===== Joi schemas (add to validation/registry.js) =====');
console.log('const Joi = require("joi");');
console.log('module.exports = {');

for (const form of forms) {
  printSchemaForForm(form);
}

console.log('};');
