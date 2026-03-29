import type { RgpdGrade } from '@trackshield/shared-types'
import { ScoreRing } from '../domain/ScoreRing.js'
import { Badge } from '../primitives/Badge.js'

interface ScoreBlockProps {
  grade: RgpdGrade
  score: number
  trackerCount: number
  piiCount: number
}

const GRADE_DESCRIPTIONS: Record<RgpdGrade, string> = {
  A: 'Aucune collecte problématique.',
  B: 'Collectes mineures et conformes.',
  C: 'Quelques points à surveiller.',
  D: 'Collectes importantes détectées.',
  F: 'Collectes massives ou non conformes.',
}

export function ScoreBlock({ grade, score, trackerCount, piiCount }: ScoreBlockProps): JSX.Element {
  const trackerSeverity = trackerCount >= 10 ? 'danger' : trackerCount >= 3 ? 'warn' : 'ok'
  const piiSeverity = piiCount > 0 ? 'danger' : 'ok'

  return (
    <div className="flex items-center gap-3.5 mb-3">
      <ScoreRing grade={grade} score={score} />
      <div className="flex-1">
        <div className="text-sm font-semibold mb-1">Score RGPD : {grade}</div>
        <div className="text-[11px] text-white/60 leading-relaxed mb-2">
          {GRADE_DESCRIPTIONS[grade]}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Badge severity={trackerSeverity}>{trackerCount} tracker{trackerCount !== 1 ? 's' : ''}</Badge>
          <Badge severity={piiSeverity}>{piiCount} PII exposée{piiCount !== 1 ? 's' : ''}</Badge>
        </div>
      </div>
    </div>
  )
}
