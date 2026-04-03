import type { PiiType } from '@trackshield/shared-types'

const FIELD_PII_MAP: Record<string, PiiType> = {
  tel: 'TEL',
  email: 'EMAIL',
  phone: 'TEL',
}

function onFieldChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const piiType: PiiType | undefined = FIELD_PII_MAP[input.type] ?? FIELD_PII_MAP[input.name?.toLowerCase()]
  if (!piiType) return

  chrome.runtime.sendMessage({
    kind: 'form-pii-detected',
    piiType,
    fieldName: input.name,
  })
}

function observeForms(): void {
  document.querySelectorAll<HTMLInputElement>('input[type="tel"], input[type="email"]')
    .forEach(input => input.addEventListener('change', onFieldChange))
}

const observer = new MutationObserver(() => {
  observeForms()
})

function startObserving(): void {
  observer.observe(document.body, { childList: true, subtree: true })
  observeForms()
}

// document_start : document.body peut être null — attendre DOMContentLoaded
if (document.body) {
  startObserving()
} else {
  document.addEventListener('DOMContentLoaded', startObserving)
}
