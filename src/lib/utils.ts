import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merges Tailwind classes safely — use this instead of string concatenation
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
