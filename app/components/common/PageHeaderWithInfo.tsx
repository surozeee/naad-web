'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

type PageHeaderWithInfoProps = {
  title: string;
  infoText: string;
  children?: React.ReactNode;
};

export function PageHeaderWithInfo({ title, infoText, children }: PageHeaderWithInfoProps) {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  return (
    <div className="page-header-section">
      <div className="page-header-with-info">
        <h1 className="page-title">{title}</h1>
        <div
          className="page-header-info-wrap"
          onMouseEnter={() => setShowInfoTooltip(true)}
          onMouseLeave={() => setShowInfoTooltip(false)}
        >
          <button type="button" aria-label="Page information" className="page-header-info-btn">
            <Info size={18} />
          </button>
          {showInfoTooltip && (
            <div className="page-header-info-tooltip">
              <div className="page-header-info-tooltip-arrow" />
              {infoText}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
