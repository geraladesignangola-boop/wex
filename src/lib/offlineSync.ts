import { supabase } from './supabase'
import type { OfflineCheckIn } from '../types/database'

const DB_NAME = 'wex-checkin'
const DB_VERSION = 1
const STORE_QUEUE = 'checkin-queue'
const STORE_CACHE = 'participants-cache'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'participant_id' })
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function addToQueue(item: OfflineCheckIn): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite')
    tx.objectStore(STORE_QUEUE).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function removeFromQueue(participantId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite')
    tx.objectStore(STORE_QUEUE).delete(participantId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQueue(): Promise<OfflineCheckIn[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readonly')
    const request = tx.objectStore(STORE_QUEUE).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getQueueCount(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readonly')
    const request = tx.objectStore(STORE_QUEUE).count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function cacheParticipants(participants: { id: string; nome: string; email: string; telefone: string; whatsapp: string }[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CACHE, 'readwrite')
    const store = tx.objectStore(STORE_CACHE)
    store.clear()
    for (const p of participants) {
      store.put(p)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function searchCache(term: string): Promise<{ id: string; nome: string; email: string; telefone: string; whatsapp: string }[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CACHE, 'readonly')
    const request = tx.objectStore(STORE_CACHE).getAll()
    request.onsuccess = () => {
      const normalized = term.toLowerCase().trim()
      const results = request.result.filter((p: { nome: string; email: string; telefone: string }) =>
        p.nome.toLowerCase().includes(normalized) ||
        p.email.toLowerCase().includes(normalized) ||
        p.telefone.includes(term)
      ).slice(0, 10)
      resolve(results)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of queue) {
    try {
      const { error } = await supabase.rpc('mark_checkin', {
        p_participant_id: item.participant_id,
        p_staff_name: item.staff_name,
      })

      if (error) {
        if (error.message === 'already_checked_in') {
          await removeFromQueue(item.participant_id)
          synced++
        } else {
          failed++
        }
      } else {
        await removeFromQueue(item.participant_id)
        synced++
      }
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

export function isOnline(): boolean {
  return navigator.onLine
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
