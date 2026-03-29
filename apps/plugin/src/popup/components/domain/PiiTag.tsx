import type { PiiType } from '@trackshield/shared-types'
import { PII_SEVERITY, PII_LABELS } from '../../types/pii.js'
import { SEVERITY_COLORS, SEVERITY_BG } from '../../types/severity.js'

interface PiiTagProps {
  type: PiiType
}

export function PiiTag({ type }: PiiTagProps): JSX.Element {
  const severity = PII_SEVERITY[type]
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide"
      style={{
        color: SEVERITY_COLORS[severity],
        backgroundColor: SEVERITY_BG[severity],
      }}
    >
      {PII_LABELS[type]}
    </span>
  )
}
