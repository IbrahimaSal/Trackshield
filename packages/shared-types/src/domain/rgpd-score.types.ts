export type RgpdGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface RgpdScore {
  grade: RgpdGrade
  score: number
  breakdown: {
    trackers: number
    pii: number
    cookies: number
    destinations: number
  }
}
