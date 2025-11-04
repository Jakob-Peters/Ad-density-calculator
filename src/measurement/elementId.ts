const DATA_ATTRIBUTE_KEY = 'adsCoreId';

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'ad_' + Math.random().toString(36).slice(2, 11);
}

export function ensureElementId(element: HTMLElement): string {
  const existing = element.dataset[DATA_ATTRIBUTE_KEY];
  if (existing) {
    return existing;
  }
  const id = randomId();
  element.dataset[DATA_ATTRIBUTE_KEY] = id;
  return id;
}
