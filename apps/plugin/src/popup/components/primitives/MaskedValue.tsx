import type { Severity } from '../../types/severity.js'
import { SEVERITY_COLORS } from '../../types/severity.js'

interface MaskedValueProps {
  value: string
  severity: Severity
}

export function MaskedValue({ value, severity }: MaskedValueProps): JSX.Element {
  return (
    <span
      className="font-mono text-[10px]"
      style={{ color: SEVERITY_COLORS[severity] }}
    >
      {value}
    </span>
  )
}
