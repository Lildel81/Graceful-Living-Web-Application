const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// label <-> slug maps for experience (support old data & new UI)
const EXP_LABEL_TO_SLUG = {
  'Currently working with one': 'current',
  'In the past': 'past',
  'First time': 'no',
  'Not sure': 'notSure',
  'Other': 'other',
};
const EXP_SLUG_TO_LABEL = {
  current: 'Currently working with one',
  past: 'In the past',
  no: 'First time',
  notSure: 'Not sure',
};

function buildChakraFilter(qs = {}) {
  const {
    q,
    ageBracket,
    healthcareWorker,
    experience,
    familiarWith,
    challenges,
    from,
    to,
    focusChakra,
    archetype
  } = qs;

  const filter = {};

  // text search
  if (q && q.trim()) {
    const rx = new RegExp(q.trim(), 'i');
    filter.$or = [
      { fullName: rx },
      { email: rx },
      { contactNumber: rx },
      { jobTitle: rx },
    ];
  }

  // single-selects
  if (ageBracket) filter.ageBracket = ageBracket;

  if (healthcareWorker) {
    // your UI now sends 'yes'/'no' — store as-is
    filter.healthcareWorker = String(healthcareWorker).toLowerCase();
  }

  // experience (slug values: current | past | no | notSure | other)
    if (experience && String(experience).trim()) {
    const exp = String(experience).trim();
    filter.experience = (exp === 'other')
        ? { $regex: /^Other:\s*/i }   // matches "Other: ..."
        : exp;                        // e.g. 'current', 'past', 'no', 'notSure'
    }

  // MULTI FILTERS
  // Accept both ?x=a&x=b and ?x[]=a&x[]=b
  const fam = toArr(familiarWith ?? qs['familiarWith[]']);
  if (fam.length) {
    // DB stores slugs (e.g., 'kundalini', 'eft'), so direct match:
    filter.familiarWith = { $in: fam };
    // If you *know* some old docs stored labels, use regex fallback:
    // const famRx = fam.map(v => new RegExp(`^\\s*${esc(v)}\\s*$`, 'i'));
    // filter.familiarWith = { $in: famRx };
  }

  const ch = toArr(challenges ?? qs['challenges[]']);
  if (ch.length) {
    // Want Physical + Emotional to return rows that have BOTH → use $all
    filter.challenges = { $all: ch };
    // If legacy docs used labels, use regex:
    // const chRx = ch.map(v => new RegExp(`^\\s*${esc(v)}\\s*$`, 'i'));
    // filter.challenges = { $all: chRx };
  }

  const fc = toArr(focusChakra ?? qs['focusChakra[]']);
  if (fc.length) filter.focusChakra = { $in: fc };

  const arch = toArr(archetype ?? qs['archetype[]']);
  if (arch.length) filter.archetype = { $in: arch };

  // dates
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = d;
    }
  }

  return filter;
}

module.exports = { buildChakraFilter, toArr };
