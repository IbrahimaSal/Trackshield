import type { Severity } from '../../types/severity.js'
import { SEVERITY_COLORS, SEVERITY_BG } from '../../types/severity.js'

interface BadgeProps {
  severity: Severity
  children: React.ReactNode
  className?: string
}

export function Badge({ severity, children, className = '' }: BadgeProps): JSX.Element {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${className}`}
      style={{
        color: SEVERITY_COLORS[severity],
        backgroundColor: SEVERITY_BG[severity],
        border: `1px solid ${SEVERITY_COLORS[severity]}22`,
      }}
    >
      {children}
    </span>
  )
}
