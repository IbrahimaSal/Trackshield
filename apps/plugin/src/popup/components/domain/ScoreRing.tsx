import type { RgpdGrade } from '@trackshield/shared-types'

const GRADE_COLOR: Record<RgpdGrade, string> = {
  A: '#1FCC7A',
  B: '#1FCC7A',
  C: '#FFB020',
  D: '#FF3B5C',
  F: '#CC1F3B',
}

interface ScoreRingProps {
  grade: RgpdGrade
  score: number
  size?: number
}

export function ScoreRing({ grade, score, size = 76 }: ScoreRingProps): JSX.Element {
  const r = size * 0.42
  const circumference = 2 * Math.PI * r
  const filled = (score / 100) * circumference
  const color = GRADE_COLOR[grade]

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={`${color}20`}
          strokeWidth={size * 0.09}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.09}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
        style={{ color }}
      >
        {grade}
      </div>
    </div>
  )
}
