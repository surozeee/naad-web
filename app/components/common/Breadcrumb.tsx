'use client';

import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb">
      <ol>
        <li>
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <Home size={14} />
            <span>Dashboard</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index}>
            <ChevronRight size={14} />
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
