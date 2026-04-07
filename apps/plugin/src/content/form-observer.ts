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

function collectStorageValues(): Record<string, string> {
  const values: Record<string, string> = {}

  // localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const val = localStorage.getItem(key)
        if (val) values[`ls:${key}`] = val
      }
    }
  } catch {
    // localStorage inaccessible (cross-origin iframe, etc.)
  }

  // cookies first-party
  try {
    for (const pair of document.cookie.split(';')) {
      const eqIdx = pair.indexOf('=')
      if (eqIdx === -1) continue
      const key = pair.slice(0, eqIdx).trim()
      const val = pair.slice(eqIdx + 1).trim()
      if (key && val) values[`ck:${key}`] = val
    }
  } catch {
    // document.cookie inaccessible
  }

  return values
}

function sendStorageValues(): void {
  const values = collectStorageValues()
  if (Object.keys(values).length === 0) return
  chrome.runtime.sendMessage({ kind: 'storage-values', values })
}

function startObserving(): void {
  observer.observe(document.body, { childList: true, subtree: true })
  observeForms()
  sendStorageValues()
}

// document_start : document.body peut être null — attendre DOMContentLoaded
if (document.body) {
  startObserving()
} else {
  document.addEventListener('DOMContentLoaded', startObserving)
}
