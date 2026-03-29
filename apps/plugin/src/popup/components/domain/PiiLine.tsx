import type { PiiDetection } from '@trackshield/shared-types'
import { PII_SEVERITY } from '../../types/pii.js'
import { MaskedValue } from '../primitives/MaskedValue.js'

interface PiiLineProps {
  detection: PiiDetection
}

export function PiiLine({ detection }: PiiLineProps): JSX.Element {
  const severity = PII_SEVERITY[detection.type]
  return (
    <div className="flex items-center justify-between">
      <MaskedValue value={detection.maskedValue} severity={severity} />
      <span className="text-[10px] text-white/40">→ {detection.destination}</span>
    </div>
  )
}
