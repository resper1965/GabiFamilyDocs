import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { documentService } from './documents'
import { alertService } from './alerts'

interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
  retryCount: number
}

interface SyncStatus {
  isOnline: boolean
  lastSync: string | null
  pendingItems: number
  isSyncing: boolean
  syncProgress: number
}

export class OfflineSyncService {
  private syncQueue: SyncQueueItem[] = []
  private syncStatus: SyncStatus = {
    isOnline: true,
    lastSync: null,
    pendingItems: 0,
    isSyncing: false,
    syncProgress: 0,
  }
  private listeners: ((status: SyncStatus) => void)[] = []

  constructor() {
    this.initializeSync()
  }

  private async initializeSync() {
    // Load existing sync queue
    await this.loadSyncQueue()
    
    // Setup network listener
    NetInfo.addEventListener(state => {
      this.handleNetworkChange(state.isConnected)
    })

    // Start periodic sync check
    setInterval(() => {
      this.checkAndSync()
    }, 30000) // Check every 30 seconds
  }

  private async loadSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem('sync_queue')
      if (queueData) {
        this.syncQueue = JSON.parse(queueData)
        this.updateSyncStatus()
      }
    } catch (error) {
      console.error('Error loading sync queue:', error)
    }
  }

  private async saveSyncQueue() {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue))
      this.updateSyncStatus()
    } catch (error) {
      console.error('Error saving sync queue:', error)
    }
  }

  private updateSyncStatus() {
    this.syncStatus.pendingItems = this.syncQueue.length
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.syncStatus))
  }

  addSyncListener(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener)
    // Immediately notify with current status
    listener(this.syncStatus)
  }

  removeSyncListener(listener: (status: SyncStatus) => void) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  private handleNetworkChange(isConnected: boolean | null) {
    const wasOnline = this.syncStatus.isOnline
    this.syncStatus.isOnline = isConnected || false

    if (!wasOnline && this.syncStatus.isOnline) {
      // Just came online, trigger sync
      this.checkAndSync()
    }

    this.notifyListeners()
  }

  async addToSyncQueue(type: 'create' | 'update' | 'delete', table: string, data: any) {
    const queueItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random()}`,
      type,
      table,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    }

    this.syncQueue.push(queueItem)
    await this.saveSyncQueue()

    // Try to sync immediately if online
    if (this.syncStatus.isOnline) {
      this.checkAndSync()
    }
  }

  async checkAndSync() {
    if (this.syncStatus.isSyncing || !this.syncStatus.isOnline || this.syncQueue.length === 0) {
      return
    }

    await this.performSync()
  }

  private async performSync() {
    this.syncStatus.isSyncing = true
    this.syncStatus.syncProgress = 0
    this.notifyListeners()

    try {
      const itemsToSync = [...this.syncQueue]
      const totalItems = itemsToSync.length

      for (let i = 0; i < itemsToSync.length; i++) {
        const item = itemsToSync[i]
        this.syncStatus.syncProgress = (i / totalItems) * 100
        this.notifyListeners()

        try {
          await this.processSyncItem(item)
          
          // Remove from queue on success
          this.syncQueue = this.syncQueue.filter(qItem => qItem.id !== item.id)
        } catch (error) {
          console.error(`Sync failed for item ${item.id}:`, error)
          
          // Increment retry count
          item.retryCount++
          
          // Remove from queue if max retries reached
          if (item.retryCount >= 3) {
            this.syncQueue = this.syncQueue.filter(qItem => qItem.id !== item.id)
            console.warn(`Removing sync item ${item.id} after max retries`)
          }
        }
      }

      await this.saveSyncQueue()
      this.syncStatus.lastSync = new Date().toISOString()
    } catch (error) {
      console.error('Sync process failed:', error)
    } finally {
      this.syncStatus.isSyncing = false
      this.syncStatus.syncProgress = 0
      this.notifyListeners()
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.table) {
      case 'documents':
        await this.syncDocument(item)
        break
      case 'alerts':
        await this.syncAlert(item)
        break
      case 'family_members':
        await this.syncFamilyMember(item)
        break
      default:
        throw new Error(`Unknown table: ${item.table}`)
    }
  }

  private async syncDocument(item: SyncQueueItem): Promise<void> {
    const { type, data } = item

    switch (type) {
      case 'create':
        await supabase.from('documents').insert([data])
        break
      case 'update':
        await supabase.from('documents').update(data).eq('id', data.id)
        break
      case 'delete':
        await supabase.from('documents').delete().eq('id', data.id)
        break
    }
  }

  private async syncAlert(item: SyncQueueItem): Promise<void> {
    const { type, data } = item

    switch (type) {
      case 'create':
        await supabase.from('alerts').insert([data])
        break
      case 'update':
        await supabase.from('alerts').update(data).eq('id', data.id)
        break
      case 'delete':
        await supabase.from('alerts').delete().eq('id', data.id)
        break
    }
  }

  private async syncFamilyMember(item: SyncQueueItem): Promise<void> {
    const { type, data } = item

    switch (type) {
      case 'create':
        await supabase.from('family_members').insert([data])
        break
      case 'update':
        await supabase.from('family_members').update(data).eq('id', data.id)
        break
      case 'delete':
        await supabase.from('family_members').delete().eq('id', data.id)
        break
    }
  }

  // Offline-first document operations
  async createDocumentOffline(documentData: any): Promise<string> {
    const tempId = `temp_${Date.now()}`
    const documentWithTempId = { ...documentData, id: tempId }

    // Save to local storage immediately
    await this.saveDocumentLocally(documentWithTempId)

    // Add to sync queue
    await this.addToSyncQueue('create', 'documents', documentData)

    return tempId
  }

  async updateDocumentOffline(documentId: string, updates: any): Promise<void> {
    // Update local storage immediately
    await this.updateDocumentLocally(documentId, updates)

    // Add to sync queue
    await this.addToSyncQueue('update', 'documents', { id: documentId, ...updates })
  }

  async deleteDocumentOffline(documentId: string): Promise<void> {
    // Remove from local storage immediately
    await this.deleteDocumentLocally(documentId)

    // Add to sync queue
    await this.addToSyncQueue('delete', 'documents', { id: documentId })
  }

  // Local storage operations
  private async saveDocumentLocally(document: any): Promise<void> {
    try {
      const localDocuments = await this.getLocalDocuments()
      localDocuments.push(document)
      await AsyncStorage.setItem('local_documents', JSON.stringify(localDocuments))
    } catch (error) {
      console.error('Error saving document locally:', error)
    }
  }

  private async updateDocumentLocally(documentId: string, updates: any): Promise<void> {
    try {
      const localDocuments = await this.getLocalDocuments()
      const index = localDocuments.findIndex(doc => doc.id === documentId)
      if (index !== -1) {
        localDocuments[index] = { ...localDocuments[index], ...updates }
        await AsyncStorage.setItem('local_documents', JSON.stringify(localDocuments))
      }
    } catch (error) {
      console.error('Error updating document locally:', error)
    }
  }

  private async deleteDocumentLocally(documentId: string): Promise<void> {
    try {
      const localDocuments = await this.getLocalDocuments()
      const filteredDocuments = localDocuments.filter(doc => doc.id !== documentId)
      await AsyncStorage.setItem('local_documents', JSON.stringify(filteredDocuments))
    } catch (error) {
      console.error('Error deleting document locally:', error)
    }
  }

  private async getLocalDocuments(): Promise<any[]> {
    try {
      const documents = await AsyncStorage.getItem('local_documents')
      return documents ? JSON.parse(documents) : []
    } catch (error) {
      console.error('Error getting local documents:', error)
      return []
    }
  }

  // Get documents (online + offline)
  async getDocuments(): Promise<any[]> {
    if (this.syncStatus.isOnline) {
      try {
        // Try to get from server
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        // Update local cache
        await AsyncStorage.setItem('local_documents', JSON.stringify(data || []))
        return data || []
      } catch (error) {
        console.error('Error fetching documents from server:', error)
        // Fallback to local data
        return this.getLocalDocuments()
      }
    } else {
      // Offline mode - return local data
      return this.getLocalDocuments()
    }
  }

  // Cache management
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem('local_documents')
      await AsyncStorage.removeItem('sync_queue')
      this.syncQueue = []
      this.updateSyncStatus()
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const localDocuments = await this.getLocalDocuments()
      const queueSize = this.syncQueue.length
      return localDocuments.length + queueSize
    } catch (error) {
      console.error('Error getting cache size:', error)
      return 0
    }
  }

  // Conflict resolution
  private async resolveConflicts(localData: any[], serverData: any[]): Promise<any[]> {
    const merged = [...serverData]
    
    for (const localItem of localData) {
      const serverItem = serverData.find(item => item.id === localItem.id)
      
      if (!serverItem) {
        // Local item doesn't exist on server, add it
        merged.push(localItem)
      } else if (localItem.updated_at > serverItem.updated_at) {
        // Local item is newer, update server
        const index = merged.findIndex(item => item.id === localItem.id)
        merged[index] = localItem
      }
    }

    return merged
  }

  // Manual sync trigger
  async forceSync(): Promise<void> {
    if (this.syncStatus.isSyncing) {
      throw new Error('Sync already in progress')
    }

    await this.performSync()
  }

  // Get sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  // Check if item is pending sync
  isItemPendingSync(itemId: string): boolean {
    return this.syncQueue.some(item => 
      item.data.id === itemId || item.data.temp_id === itemId
    )
  }

  // Get pending sync items count
  getPendingItemsCount(): number {
    return this.syncQueue.length
  }

  // Get sync queue for debugging
  getSyncQueue(): SyncQueueItem[] {
    return [...this.syncQueue]
  }
}

export const offlineSyncService = new OfflineSyncService()
