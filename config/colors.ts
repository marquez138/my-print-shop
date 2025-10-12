// Simple id → hex map. Keep ids aligned with your swatch ids on the PDP.
export const COLOR_HEX: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  ash: '#e5e7eb',
  gray: '#9ca3af',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#10b981',
}

export function resolveHex(id?: string | null, fallback = '#ffffff') {
  if (!id) return fallback
  const hex = COLOR_HEX[id.toLowerCase()]
  return hex ?? fallback
}
