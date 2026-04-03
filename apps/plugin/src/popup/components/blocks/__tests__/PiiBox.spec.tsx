import { render, screen } from '@testing-library/react'
import { PiiBox } from '../PiiBox.js'
import type { PiiDetection } from '@trackshield/shared-types'

const EMAIL: PiiDetection = {
  type: 'EMAIL',
  maskedValue: 'j••••@gmail.com',
  destination: 'pixel.facebook.com',
  timestamp: 1000,
}

const PHONE: PiiDetection = {
  type: 'TEL',
  maskedValue: '+336••••5678',
  destination: 'pixel.facebook.com',
  timestamp: 2000,
}

describe('PiiBox — déduplication', () => {
  it("affiche ×2 pour deux détections identiques", () => {
    render(<PiiBox detections={[EMAIL, { ...EMAIL }]} />)
    expect(screen.getByText('×2')).toBeInTheDocument()
  })

  it("n'affiche qu'une seule ligne pour des PIIs identiques", () => {
    render(<PiiBox detections={[EMAIL, { ...EMAIL }]} />)
    expect(screen.getAllByText('j••••@gmail.com')).toHaveLength(1)
  })

  it("n'affiche pas ×1 pour les entrées non dupliquées", () => {
    render(<PiiBox detections={[EMAIL]} />)
    expect(screen.queryByText('×1')).not.toBeInTheDocument()
  })

  it("affiche la valeur masquée suivie de la destination", () => {
    render(<PiiBox detections={[EMAIL]} />)
    expect(screen.getByText('j••••@gmail.com')).toBeInTheDocument()
    expect(screen.getByText(/pixel\.facebook\.com/)).toBeInTheDocument()
  })

  it("affiche les entrées triées par nombre d'occurrences décroissant", () => {
    // EMAIL × 2, PHONE × 1 — EMAIL doit apparaître avant PHONE
    render(<PiiBox detections={[PHONE, EMAIL, { ...EMAIL }]} />)
    const emailEl = screen.getByText('j••••@gmail.com')
    const phoneEl = screen.getByText('+336••••5678')
    expect(emailEl.compareDocumentPosition(phoneEl)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it("traite deux PIIs différentes vers la même destination comme deux entrées distinctes", () => {
    render(<PiiBox detections={[EMAIL, PHONE]} />)
    expect(screen.getByText('j••••@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('+336••••5678')).toBeInTheDocument()
    expect(screen.queryByText('×2')).not.toBeInTheDocument()
  })
})
