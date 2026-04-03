import type { TrackerMatch } from '@trackshield/shared-types'
import { CompanyAvatar } from '../primitives/CompanyAvatar.js'
import { Badge } from '../primitives/Badge.js'

const CATEGORY_LABEL: Record<TrackerMatch['category'], string> = {
  advertising: 'Pub',
  analytics: 'Analytique',
  social: 'Social',
  fingerprinting: 'Device',
}

const CATEGORY_SEVERITY = {
  advertising: 'warn',
  analytics: 'info',
  social: 'info',
  fingerprinting: 'fingerprint',
} as const

const CATEGORY_COLOR: Record<TrackerMatch['category'], string> = {
  advertising: '#FFB020',
  analytics:   '#3B9EFF',
  social:      '#FF5FA8',
  fingerprinting: '#FF3B5C',
}

interface TrackerRowProps {
  tracker: TrackerMatch
}

export function TrackerRow({ tracker }: TrackerRowProps): JSX.Element {
  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-border last:border-0">
      <CompanyAvatar initials={tracker.company.slice(0, 1).toUpperCase()} color={CATEGORY_COLOR[tracker.category]} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{tracker.company}</div>
        <div className="text-[10px] text-white/40 truncate">{tracker.domain}</div>
      </div>
      <Badge severity={CATEGORY_SEVERITY[tracker.category]}>
        {CATEGORY_LABEL[tracker.category]}
      </Badge>
    </div>
  )
}
