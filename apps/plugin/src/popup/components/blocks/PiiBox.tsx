import type { PiiDetection } from '@trackshield/shared-types'
import { PiiLine } from '../domain/PiiLine.js'

interface PiiBoxProps {
  detections: PiiDetection[]
}

export function PiiBox({ detections }: PiiBoxProps): JSX.Element {
  return (
    <div
      className="rounded-lg p-2.5 mb-3"
      style={{
        background: 'rgba(255,59,92,0.06)',
        border: '1px solid rgba(255,59,92,0.18)',
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-severity-danger mb-1.5">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 1L1 9.5h9L5.5 1z" stroke="#FF3B5C" strokeWidth="1.2" />
          <path d="M5.5 5v2M5.5 8v.4" stroke="#FF3B5C" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        Données personnelles transmises
      </div>
      <div className="flex flex-col gap-1.5">
        {detections.map((d, i) => (
          <PiiLine key={i} detection={d} />
        ))}
      </div>
    </div>
  )
}
