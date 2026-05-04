const PROTECTED_IDS = ['app-shell', 'spec-context', 'prototype-area', 'non-ui-spec-area'];

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stableKeys<T extends Record<string, unknown>>(value: T | undefined): string[] {
  if (!value || typeof value !== 'object') {
    return [];
  }
  return Object.keys(value).sort((a, b) => a.localeCompare(b, 'en'));
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function jsonForScript(value: unknown): string {
  return JSON.stringify(sortValue(value))
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function toHumanLabel(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

export function sanitizeId(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return sanitized || 'item';
}

export function assertSafeFragment(fragment: string): void {
  if (/<\s*script\b/i.test(fragment)) {
    throw new Error('Unsafe fragment: script tags are not allowed');
  }
  if (/<\s*style\b/i.test(fragment)) {
    throw new Error('Unsafe fragment: style tags are not allowed');
  }
  for (const id of PROTECTED_IDS) {
    const pattern = new RegExp(`id=["']${id}["']`, 'i');
    if (pattern.test(fragment)) {
      throw new Error(`Unsafe fragment: protected shell id "${id}" is not allowed`);
    }
  }
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([key, nested]) => [key, sortValue(nested)])
    );
  }
  return value;
}
