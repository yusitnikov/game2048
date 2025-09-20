// Shared helper functions for the 2048 game

// Generate all powers of 2 up to the 30th power
export const POWERS_OF_2 = Array(30)
  .fill(0)
  .map((_, i) => Math.pow(2, i + 1));

// Format large numbers with short labels
export function formatCellLabel(value: number): string {
  if (value < 8000) {
    return value.toString();
  } else if (value < 1024 * 1024) {
    const k = value / 1024;
    return `${k}K`;
  } else if (value < 1024 * 1024 * 1024) {
    const m = value / (1024 * 1024);
    return `${m}M`;
  } else {
    const b = value / (1024 * 1024 * 1024);
    return `${b}B`;
  }
}

// Get all CSS classes for a cell value
export function getCellClasses(value: number): string {
  const label = formatCellLabel(value);
  const lengthClass = `cell-len-${label.length}`;
  const labelClass = `cell-${label}`;
  return `cell ${lengthClass} ${labelClass}`;
}
