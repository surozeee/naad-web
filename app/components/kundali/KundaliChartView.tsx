'use client';

import type { ChartStyleType, KundaliChart } from '@/app/lib/kundali.types';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';

type Props = {
  chart: KundaliChart;
  style?: ChartStyleType;
  className?: string;
};

export default function KundaliChartView({ chart, style, className }: Props) {
  const resolved = style ?? chart.chartStyle ?? 'NORTH_INDIAN';
  if (resolved === 'SOUTH_INDIAN') {
    return <SouthIndianChart chart={chart} className={className} />;
  }
  // EAST_INDIAN falls back to North Indian diamond for now
  return <NorthIndianChart chart={chart} className={className} />;
}
