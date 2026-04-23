function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\s_/-]+/g, ' ')
    .trim();
}

function fuzzyMatch(text, query) {
  const a = normalize(text);
  const b = normalize(query);
  if (!b) return true;
  let i = 0;
  for (const ch of a) {
    if (ch === b[i]) i += 1;
    if (i >= b.length) return true;
  }
  return false;
}

function regexMatch(text, pattern) {
  if (!pattern) return true;
  try {
    return new RegExp(pattern, 'i').test(String(text ?? ''));
  } catch {
    return false;
  }
}

export function indexItem(item, fields = []) {
  return fields
    .map((field) => {
      const value = item?.[field];
      if (Array.isArray(value)) return value.join(' ');
      if (value && typeof value === 'object') return Object.values(value).join(' ');
      return value ?? '';
    })
    .join(' ');
}

export function searchItems(items = [], query = '', options = {}) {
  const {
    fields = [],
    useRegex = false,
    category = '',
    activeOnly = false
  } = options;

  const q = String(query || '').trim();
  const categoryNeedle = normalize(category);

  return items.filter((item) => {
    if (activeOnly && item?.active === false) return false;
    if (categoryNeedle) {
      const itemCategory = normalize(item?.category || item?.group || '');
      if (!itemCategory.includes(categoryNeedle)) return false;
    }

    const haystack = fields.length ? indexItem(item, fields) : JSON.stringify(item);
    const text = normalize(haystack);

    if (!q) return true;
    if (useRegex) return regexMatch(haystack, q);
    return text.includes(normalize(q)) || fuzzyMatch(haystack, q);
  });
}

export function createSearchState() {
  return {
    query: '',
    useRegex: false,
    category: ''
  };
}
