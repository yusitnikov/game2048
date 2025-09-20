// Shared helper functions for the 2048 game

// Generate all powers of 2 up to 1M (2^20)
export const POWERS_OF_2 = Array(20)
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

export const getCellSizeProp = (size: number) =>
  `calc(var(--cell-size) * ${size})`;

export const setCellSizeStyles = (
  element: HTMLElement,
  styles: Partial<Record<StringCssProps, number>>,
) => {
  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined) {
      delete element.style[key as StringCssProps];
    } else {
      element.style[key as StringCssProps] = getCellSizeProp(value);
    }
  }
};

type FilterKeysOfType<ObjectT, BaseT> = {
  [K in keyof ObjectT]: ObjectT[K] extends BaseT ? K : never;
}[keyof ObjectT];

type StringCssProps = FilterKeysOfType<CSSStyleDeclaration, string>;
