import type { Severity } from '../../types/severity.js'
import { SEVERITY_COLORS } from '../../types/severity.js'

interface MaskedValueProps {
  value: string
  severity: Severity
  'data-testid'?: string
}

export function MaskedValue({ value, severity, 'data-testid': testId }: MaskedValueProps): JSX.Element {
  return (
    <span
      className="font-mono text-[10px]"
      style={{ color: SEVERITY_COLORS[severity] }}
      data-testid={testId}
    >
      {value}
    </span>
  )
}
