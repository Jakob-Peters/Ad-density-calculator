import type { AdSlotSample } from '../types/measurement.js';

const OVERLAY_ROOT_ID = '__ad_score_overlay_root__';

export interface OverlayOptions {
  palette?: string[];
  opacity?: number;
  showLabels?: boolean;
}

const DEFAULT_PALETTE = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];
const DEFAULT_OVERLAY_OPACITY = 0.4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(color: string): { r: number; g: number; b: number } | null {
  const normalized = color.replace('#', '');
  if (normalized.length === 3) {
    const rHex = normalized.charAt(0);
    const gHex = normalized.charAt(1);
    const bHex = normalized.charAt(2);
    const r = parseInt(rHex + rHex, 16);
    const g = parseInt(gHex + gHex, 16);
    const b = parseInt(bHex + bHex, 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return null;
    }
    return { r, g, b };
  }

  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return null;
    }
    return { r, g, b };
  }

  return null;
}

function applyAlpha(color: string, alpha: number): string {
  const clampedAlpha = clamp(alpha, 0, 1);

  if (color.startsWith('rgba(')) {
    return color.replace(/rgba\(([^)]+)\)/, (_match, components) => {
      const parts = components.split(',').map((part: string) => part.trim());
      const base = parts.slice(0, 3).join(', ');
      return `rgba(${base}, ${clampedAlpha})`;
    });
  }

  if (color.startsWith('rgb(')) {
    return color.replace(/rgb\(([^)]+)\)/, (_match, components) => {
      return `rgba(${components.trim()}, ${clampedAlpha})`;
    });
  }

  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (rgb) {
      const { r, g, b } = rgb;
      return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
    }
  }

  return color;
}

function uniqueSlotsByElement(slots: AdSlotSample[]): AdSlotSample[] {
  const seen = new Set<HTMLElement>();
  const uniques: AdSlotSample[] = [];

  slots.forEach((slot) => {
    if (seen.has(slot.element)) {
      return;
    }
    seen.add(slot.element);
    uniques.push(slot);
  });

  return uniques;
}

type OverlayState = {
  root: HTMLElement;
  slots: AdSlotSample[];
  overlays: HTMLElement[];
  rafId: number | null;
  handleScroll: () => void;
  handleResize: () => void;
};

let activeState: OverlayState | null = null;

function disposeActiveState(): void {
  if (!activeState) {
    return;
  }

  window.removeEventListener('scroll', activeState.handleScroll, true);
  window.removeEventListener('resize', activeState.handleResize);
  if (activeState.rafId !== null) {
    cancelAnimationFrame(activeState.rafId);
  }
  activeState = null;
}

export function clearAdOverlays(): void {
  if (typeof document === 'undefined') {
    return;
  }
  disposeActiveState();
  const existing = document.getElementById(OVERLAY_ROOT_ID);
  if (existing?.parentNode) {
    existing.parentNode.removeChild(existing);
  }
}

export function renderAdOverlays(slots: AdSlotSample[], options: OverlayOptions = {}): void {
  if (typeof document === 'undefined') {
    return;
  }

  clearAdOverlays();

  const uniqueSlots = uniqueSlotsByElement(slots);

  if (uniqueSlots.length === 0) {
    return;
  }

  const palette = options.palette ?? DEFAULT_PALETTE;
  const opacity = options.opacity ?? DEFAULT_OVERLAY_OPACITY;
  const showLabels = options.showLabels ?? true;

  const root = document.createElement('div');
  root.id = OVERLAY_ROOT_ID;
  root.style.position = 'absolute';
  root.style.top = '0';
  root.style.left = '0';
  root.style.width = '0';
  root.style.height = '0';
  root.style.pointerEvents = 'none';
  root.style.zIndex = '2147483647';
  root.style.fontFamily = 'system-ui, sans-serif';
  document.body.appendChild(root);

  const overlays: HTMLElement[] = [];

  uniqueSlots.forEach((slot, index) => {
    const color = palette[index % palette.length] ?? '#ff00ff';
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.backgroundColor = applyAlpha(color, opacity);
    overlay.style.border = `1px solid ${color}`;
    overlay.style.boxSizing = 'border-box';
    overlay.style.pointerEvents = 'none';

    if (showLabels) {
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = '50%';
      label.style.left = '50%';
      label.style.transform = 'translate(-50%, -50%)';
      label.style.padding = '6px 10px';
      label.style.background = '#111';
      label.style.color = '#fff';
      label.style.fontSize = '13px';
      label.style.lineHeight = '1.35';
      label.style.textAlign = 'center';
      label.style.borderRadius = '6px';
      label.style.pointerEvents = 'none';
      label.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.45)';
      label.style.maxWidth = '260px';
      label.style.whiteSpace = 'pre-line';
      label.style.opacity = '1';

      const coverage = (slot.coverageRatio * 100).toFixed(1);
      label.textContent = `${slot.slotName ?? slot.logicalId}\n${slot.provider} · ${coverage}% viewport`;

      overlay.appendChild(label);
    }

    root.appendChild(overlay);
    overlays.push(overlay);
  });

  const state: OverlayState = {
    root,
    slots: uniqueSlots,
    overlays,
    rafId: null,
    handleScroll: () => {},
    handleResize: () => {}
  };

  state.handleScroll = () => scheduleUpdate(state);
  state.handleResize = () => scheduleUpdate(state);

  activeState = state;

  window.addEventListener('scroll', state.handleScroll, true);
  window.addEventListener('resize', state.handleResize);

  updateOverlayPositions(state);
}

function updateOverlayPositions(state: OverlayState): void {
  state.overlays.forEach((overlay, index) => {
    const slot = state.slots[index];
    if (!slot) {
      overlay.style.display = 'none';
      return;
    }
    const element = slot.element;

    if (!element || typeof element.getBoundingClientRect !== 'function') {
      overlay.style.display = 'none';
      return;
    }

    const rect = element.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      overlay.style.display = 'none';
      return;
    }

    overlay.style.display = 'block';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.transform = `translate(${rect.left + window.scrollX}px, ${rect.top + window.scrollY}px)`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.transformOrigin = 'top left';
  });
}

function scheduleUpdate(state: OverlayState): void {
  if (state.rafId !== null) {
    return;
  }
  state.rafId = requestAnimationFrame(() => {
    state.rafId = null;
    updateOverlayPositions(state);
  });
}
