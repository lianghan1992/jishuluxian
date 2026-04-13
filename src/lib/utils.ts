import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DIMENSIONS = [
  '智能安全',
  'AI',
  '智慧内饰',
  '智慧光',
  'MF平台',
  '极致能耗',
  '轻量化',
  '智能仿真',
  '先进动力',
  '健康车'
] as const;

export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
