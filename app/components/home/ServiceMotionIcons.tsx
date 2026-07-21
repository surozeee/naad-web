'use client';

/** Animated SVG marks for homepage service cards — motion only, no decorative noise. */

type IconProps = { className?: string };

export function HoroscopeMotionIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle className="naad-mi-ring" cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.4" />
      <circle className="naad-mi-ring naad-mi-ring--delayed" cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <g className="naad-mi-spin-slow">
        <circle cx="24" cy="8" r="2.2" fill="currentColor" />
        <circle cx="40" cy="24" r="1.7" fill="currentColor" opacity="0.7" />
        <circle cx="24" cy="40" r="1.7" fill="currentColor" opacity="0.55" />
        <circle cx="8" cy="24" r="1.7" fill="currentColor" opacity="0.7" />
      </g>
      <circle className="naad-mi-pulse" cx="24" cy="24" r="3.2" fill="currentColor" />
    </svg>
  );
}

export function KundaliMotionIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect
        className="naad-mi-draw"
        x="8"
        y="8"
        width="32"
        height="32"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        className="naad-mi-draw naad-mi-draw--delayed"
        d="M8 24h32M24 8v32M8 8l32 32M40 8L8 40"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.75"
      />
      <circle className="naad-mi-pulse" cx="24" cy="24" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function MatchMotionIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle className="naad-mi-orbit-a" cx="18" cy="24" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle className="naad-mi-orbit-b" cx="30" cy="24" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle className="naad-mi-pulse" cx="18" cy="24" r="2.2" fill="currentColor" />
      <circle className="naad-mi-pulse naad-mi-pulse--alt" cx="30" cy="24" r="2.2" fill="currentColor" />
      <path
        className="naad-mi-link"
        d="M22 20c2-2 4-2 6 0M22 28c2 2 4 2 6 0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AstrologerMotionIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle className="naad-mi-draw" cx="24" cy="16" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        className="naad-mi-draw naad-mi-draw--delayed"
        d="M10 38c2.5-7 7.5-10.5 14-10.5S35.5 31 38 38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g className="naad-mi-twinkle">
        <path d="M36 10l1.1 2.4L40 13.5l-2.4 1.1L36 17l-1.1-2.4L32.5 13.5l2.4-1.1L36 10z" fill="currentColor" />
      </g>
      <g className="naad-mi-twinkle naad-mi-twinkle--delayed">
        <path d="M11 12l0.7 1.5L13.5 14.2l-1.5.7L11 16.5l-.7-1.6L8.8 14.2l1.5-.7L11 12z" fill="currentColor" opacity="0.7" />
      </g>
    </svg>
  );
}

export function CalendarMotionIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect
        className="naad-mi-draw"
        x="9"
        y="12"
        width="30"
        height="26"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path className="naad-mi-draw" d="M9 20h30" stroke="currentColor" strokeWidth="1.5" />
      <path
        className="naad-mi-bob"
        d="M16 8v6M32 8v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g className="naad-mi-dots">
        <circle cx="17" cy="27" r="1.6" fill="currentColor" />
        <circle cx="24" cy="27" r="1.6" fill="currentColor" />
        <circle cx="31" cy="27" r="1.6" fill="currentColor" />
        <circle cx="17" cy="33" r="1.6" fill="currentColor" opacity="0.55" />
        <circle cx="24" cy="33" r="1.6" fill="currentColor" />
      </g>
    </svg>
  );
}

export function TransitsMotionIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <ellipse className="naad-mi-ring" cx="24" cy="24" rx="16" ry="8" stroke="currentColor" strokeWidth="1.3" />
      <ellipse
        className="naad-mi-ring naad-mi-ring--delayed"
        cx="24"
        cy="24"
        rx="8"
        ry="16"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.65"
      />
      <g className="naad-mi-spin-slow">
        <circle cx="24" cy="8" r="2" fill="currentColor" />
      </g>
      <g className="naad-mi-spin-slow naad-mi-spin-slow--alt">
        <circle cx="40" cy="24" r="2.2" fill="currentColor" />
      </g>
      <circle className="naad-mi-pulse" cx="24" cy="24" r="2.8" fill="currentColor" />
    </svg>
  );
}
