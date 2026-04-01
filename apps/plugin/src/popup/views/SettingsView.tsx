import { useState } from 'react'
import type { View } from '../App.js'
import { useSyncStore } from '../stores/sync.store.js'

interface SettingsViewProps {
  onNavigate: (view: View) => void
}

function ConsentModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }): JSX.Element {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-5 w-[300px] flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-white">Données synchronisées</h3>
        <ul className="text-xs text-white/70 flex flex-col gap-1">
          <li>→ Trackers détectés par session</li>
          <li>→ Données PII masquées (jamais en clair)</li>
          <li>→ Score RGPD par domaine</li>
        </ul>
        <div className="text-[10px] text-white/40 border border-white/10 rounded p-2">
          Stockage : PostgreSQL · Supabase · EU (RGPD compliant)
        </div>
        <p className="text-[10px] text-white/50">
          La sync est optionnelle. Tu peux la désactiver à tout moment et supprimer tes données.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 rounded border border-white/20 text-xs text-white/60 hover:border-white/40"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-1.5 rounded bg-white/10 text-xs text-white hover:bg-white/20"
          >
            J'accepte
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsView({ onNavigate }: SettingsViewProps): JSX.Element {
  const { enabled, setEnabled, setConsent } = useSyncStore()
  const [showModal, setShowModal] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  function handleToggle(): void {
    if (enabled) {
      setEnabled(false)
      chrome.storage.local.set({ syncEnabled: false })
    } else {
      setShowModal(true)
    }
  }

  function handleConfirm(): void {
    setEnabled(true)
    setConsent(true)
    setShowModal(false)
    chrome.storage.local.set({ syncEnabled: true })
  }

  function handleCancel(): void {
    setShowModal(false)
  }

  async function handleDeleteData(): Promise<void> {
    setDeleteStatus('loading')
    try {
      const { apiUrl, jwt } = await chrome.storage.local.get(['apiUrl', 'jwt']) as {
        apiUrl?: string
        jwt?: string
      }
      const base = apiUrl ?? 'http://localhost:3000'
      const res = await fetch(`${base}/api/sync/data`, {
        method: 'DELETE',
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      })
      setDeleteStatus(res.ok ? 'done' : 'error')
    } catch {
      setDeleteStatus('error')
    }
  }

  return (
    <div className="w-[340px] p-4 text-white flex flex-col">
      {showModal && <ConsentModal onConfirm={handleConfirm} onCancel={handleCancel} />}

      <button
        onClick={() => onNavigate('main')}
        className="text-xs text-white/40 mb-4 self-start"
      >
        ← Retour
      </button>
      <h2 className="text-sm font-semibold mb-4">Paramètres</h2>

      {/* Toggle sync */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex flex-col gap-0.5">
          <label htmlFor="sync-toggle" className="text-xs font-medium text-white">
            Synchronisation cloud
          </label>
          <span className="text-[10px] text-white/40">
            {enabled ? 'Activée — données sauvegardées' : 'Désactivée — données locales uniquement'}
          </span>
        </div>
        <input
          id="sync-toggle"
          type="checkbox"
          role="checkbox"
          aria-label="Synchronisation"
          checked={enabled}
          onChange={handleToggle}
          className="w-4 h-4 accent-white cursor-pointer"
        />
      </div>

      {/* Suppression des données */}
      <div className="border-t border-white/10 pt-4">
        <button
          onClick={handleDeleteData}
          disabled={deleteStatus === 'loading'}
          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          {deleteStatus === 'loading'
            ? 'Suppression…'
            : deleteStatus === 'done'
              ? 'Données supprimées ✓'
              : 'Supprimer toutes mes données cloud'}
        </button>
        {deleteStatus === 'error' && (
          <p className="text-[10px] text-red-400/70 mt-1">Échec de la suppression. Réessaie plus tard.</p>
        )}
      </div>
    </div>
  )
}
