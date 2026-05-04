import type { ProjectedField } from './types';
import { escapeHtml, sanitizeId } from './utils';

export function renderField(field: ProjectedField, options: { prefix?: string } = {}): string {
  const id = `${options.prefix ?? 'field-'}${sanitizeId(field.name)}`;
  const common = `id="${escapeHtml(id)}" name="${escapeHtml(field.name)}" data-sync-field="${escapeHtml(
    field.name
  )}" ${field.required ? 'required' : ''}`;
  const value = field.sampleValue ?? '';
  const label = `<label class="field-label" for="${escapeHtml(id)}">${escapeHtml(field.label)}${
    field.required ? '<span aria-label="必須">*</span>' : ''
  }</label>`;

  let control: string;
  switch (field.type) {
    case 'text':
      control = `<textarea ${common} rows="4">${escapeHtml(value)}</textarea>`;
      break;
    case 'number':
      control = `<input ${common} type="number" value="${escapeHtml(value)}">`;
      break;
    case 'date':
      control = `<input ${common} type="date" value="${escapeHtml(value)}">`;
      break;
    case 'enum':
      control = `<select ${common}>${(field.options ?? [])
        .map((option) => {
          const selected = option === value ? ' selected' : '';
          return `<option value="${escapeHtml(option)}"${selected}>${escapeHtml(option)}</option>`;
        })
        .join('')}</select>`;
      break;
    case 'boolean':
      control = `<input ${common} type="checkbox"${value === true ? ' checked' : ''}>`;
      break;
    case 'string':
    default:
      control = `<input ${common} type="text" value="${escapeHtml(value)}">`;
      break;
  }

  return `<div class="field-control" data-field="${escapeHtml(field.name)}">${label}${control}</div>`;
}
