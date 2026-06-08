import type { RatingLevel } from '../types';

export const LEVEL_STYLES: Record<RatingLevel, { bg: string; color: string }> = {
  'A++': { bg: '#1a6e3c', color: '#fff' },
  'A+':  { bg: '#27924f', color: '#fff' },
  'A':   { bg: '#35b865', color: '#fff' },
  'B++': { bg: '#c9a84c', color: '#1a1e2e' },
  'B+':  { bg: '#d4822a', color: '#fff' },
  'B':   { bg: '#c0621c', color: '#fff' },
  'C++': { bg: '#b04a20', color: '#fff' },
  'C+':  { bg: '#9e2e20', color: '#fff' },
  'C':   { bg: '#7a1a1a', color: '#fff' },
};

interface Props {
  level: RatingLevel;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<NonNullable<Props['size']>, React.CSSProperties> = {
  sm: { fontSize: '11px', padding: '3px 9px', minWidth: '30px', borderRadius: '6px' },
  md: { fontSize: '13px', padding: '4px 11px', minWidth: '36px', borderRadius: '7px' },
  lg: { fontSize: '20px', padding: '5px 16px', minWidth: '54px', borderRadius: '9px' },
};

export default function RatingBadge({ level, size = 'md' }: Props) {
  const { bg, color } = LEVEL_STYLES[level];
  return (
    <span
      style={{
        background: bg,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1.2,
        fontFamily: 'monospace',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        ...SIZES[size],
      }}
    >
      {level}
    </span>
  );
}
