/**
 * Merge class names (for use with Tailwind / component className).
 */
export function cn(...inputs: (string | undefined | false | null)[]): string {
  return inputs.filter(Boolean).join(' ');
}
