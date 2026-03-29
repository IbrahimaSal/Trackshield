export type Severity = 'ok' | 'warn' | 'danger' | 'info' | 'fingerprint'

export const SEVERITY_COLORS: Record<Severity, string> = {
  ok: '#1FCC7A',
  warn: '#FFB020',
  danger: '#FF3B5C',
  info: '#3B9EFF',
  fingerprint: '#FF5FA8',
}

export const SEVERITY_BG: Record<Severity, string> = {
  ok: 'rgba(31,204,122,0.08)',
  warn: 'rgba(255,176,32,0.08)',
  danger: 'rgba(255,59,92,0.08)',
  info: 'rgba(59,158,255,0.08)',
  fingerprint: 'rgba(255,95,168,0.08)',
}
