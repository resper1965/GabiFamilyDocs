import { supabase } from '../lib/supabase'
import { storageService } from './storage'
import { documentService } from './documents'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import * as Crypto from 'expo-crypto'

interface BackupMetadata {
  id: string
  timestamp: string
  version: string
  size: number
  documents_count: number
  checksum: string
  status: 'pending' | 'completed' | 'failed'
  encryption_key?: string
}

interface BackupConfig {
  auto_backup: boolean
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  retention_days: number
  include_documents: boolean
  include_settings: boolean
  encryption_enabled: boolean
}

export class BackupService {
  private config: BackupConfig = {
    auto_backup: true,
    backup_frequency: 'daily',
    retention_days: 30,
    include_documents: true,
    include_settings: true,
    encryption_enabled: true,
  }

  constructor() {
    this.loadConfig()
  }

  private async loadConfig() {
    try {
      const config = await AsyncStorage.getItem('backup_config')
      if (config) {
        this.config = { ...this.config, ...JSON.parse(config) }
      }
    } catch (error) {
      console.error('Error loading backup config:', error)
    }
  }

  private async saveConfig() {
    try {
      await AsyncStorage.setItem('backup_config', JSON.stringify(this.config))
    } catch (error) {
      console.error('Error saving backup config:', error)
    }
  }

  async updateConfig(newConfig: Partial<BackupConfig>) {
    this.config = { ...this.config, ...newConfig }
    await this.saveConfig()
  }

  async getConfig(): Promise<BackupConfig> {
    return this.config
  }

  async createBackup(): Promise<BackupMetadata> {
    const backupId = `backup_${Date.now()}`
    const timestamp = new Date().toISOString()
    
    try {
      // Create backup metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        version: '1.0.0',
        size: 0,
        documents_count: 0,
        checksum: '',
        status: 'pending',
      }

      // Get user session
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create backup directory
      const backupDir = `${FileSystem.documentDirectory}backups/${backupId}`
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true })

      // Backup documents
      if (this.config.include_documents) {
        await this.backupDocuments(backupDir, user.id)
      }

      // Backup settings
      if (this.config.include_settings) {
        await this.backupSettings(backupDir)
      }

      // Create backup manifest
      const manifest = await this.createBackupManifest(backupDir, metadata)
      
      // Encrypt backup if enabled
      if (this.config.encryption_enabled) {
        await this.encryptBackup(backupDir, backupId)
      }

      // Upload to cloud storage
      await this.uploadBackupToCloud(backupDir, backupId)

      // Update metadata
      metadata.status = 'completed'
      metadata.size = await this.calculateBackupSize(backupDir)
      metadata.checksum = await this.calculateChecksum(backupDir)

      // Save backup metadata
      await this.saveBackupMetadata(metadata)

      // Cleanup local backup
      await FileSystem.deleteAsync(backupDir, { idempotent: true })

      return metadata
    } catch (error) {
      console.error('Backup creation failed:', error)
      throw error
    }
  }

  private async backupDocuments(backupDir: string, userId: string) {
    const documentsDir = `${backupDir}/documents`
    await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true })

    // Get all documents for user
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    // Download and save documents
    for (const doc of documents || []) {
      if (doc.file_path) {
        const localPath = `${documentsDir}/${doc.id}.pdf`
        await this.downloadDocument(doc.file_path, localPath)
      }
    }

    // Save documents metadata
    await FileSystem.writeAsStringAsync(
      `${documentsDir}/metadata.json`,
      JSON.stringify(documents, null, 2)
    )
  }

  private async backupSettings(backupDir: string) {
    const settingsDir = `${backupDir}/settings`
    await FileSystem.makeDirectoryAsync(settingsDir, { intermediates: true })

    // Backup app settings
    const settings = await AsyncStorage.getItem('app_settings')
    if (settings) {
      await FileSystem.writeAsStringAsync(
        `${settingsDir}/app_settings.json`,
        settings
      )
    }

    // Backup user preferences
    const preferences = await AsyncStorage.getItem('user_preferences')
    if (preferences) {
      await FileSystem.writeAsStringAsync(
        `${settingsDir}/user_preferences.json`,
        preferences
      )
    }
  }

  private async createBackupManifest(backupDir: string, metadata: BackupMetadata) {
    const manifest = {
      ...metadata,
      created_at: new Date().toISOString(),
      app_version: '1.0.0',
      backup_config: this.config,
      files: await this.scanBackupFiles(backupDir),
    }

    await FileSystem.writeAsStringAsync(
      `${backupDir}/manifest.json`,
      JSON.stringify(manifest, null, 2)
    )

    return manifest
  }

  private async scanBackupFiles(backupDir: string): Promise<string[]> {
    const files: string[] = []
    
    const scanDirectory = async (dir: string) => {
      const contents = await FileSystem.readDirectoryAsync(dir)
      for (const item of contents) {
        const fullPath = `${dir}/${item}`
        const stat = await FileSystem.getInfoAsync(fullPath)
        if (stat.exists) {
          if (stat.isDirectory) {
            await scanDirectory(fullPath)
          } else {
            files.push(fullPath.replace(backupDir, ''))
          }
        }
      }
    }

    await scanDirectory(backupDir)
    return files
  }

  private async encryptBackup(backupDir: string, backupId: string) {
    // Generate encryption key
    const encryptionKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${backupId}_${Date.now()}`,
      { encoding: Crypto.CryptoEncoding.HEX }
    )

    // Encrypt all files in backup
    const contents = await FileSystem.readDirectoryAsync(backupDir)
    for (const item of contents) {
      const filePath = `${backupDir}/${item}`
      const stat = await FileSystem.getInfoAsync(filePath)
      
      if (stat.exists && !stat.isDirectory) {
        const fileContent = await FileSystem.readAsStringAsync(filePath)
        const encryptedContent = await this.encryptString(fileContent, encryptionKey)
        await FileSystem.writeAsStringAsync(filePath, encryptedContent)
      }
    }

    return encryptionKey
  }

  private async encryptString(text: string, key: string): Promise<string> {
    // Simple encryption for demo - in production use proper encryption
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const keyData = encoder.encode(key)
    
    const encrypted = new Uint8Array(data.length)
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ keyData[i % keyData.length]
    }
    
    return btoa(String.fromCharCode(...encrypted))
  }

  private async uploadBackupToCloud(backupDir: string, backupId: string) {
    // Create backup archive
    const archivePath = `${backupDir}.zip`
    await this.createBackupArchive(backupDir, archivePath)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('backups')
      .upload(`${backupId}.zip`, archivePath, {
        contentType: 'application/zip',
        upsert: false,
      })

    if (error) throw error

    // Cleanup archive
    await FileSystem.deleteAsync(archivePath, { idempotent: true })
  }

  private async createBackupArchive(sourceDir: string, archivePath: string) {
    // In a real implementation, use a proper zip library
    // For now, we'll just copy the directory
    await FileSystem.copyAsync({
      from: sourceDir,
      to: archivePath,
    })
  }

  private async downloadDocument(filePath: string, localPath: string) {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (error) throw error

    const arrayBuffer = await data.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    await FileSystem.writeAsStringAsync(localPath, '', { encoding: FileSystem.EncodingType.Base64 })
    // Note: In a real implementation, properly write binary data
  }

  private async calculateBackupSize(backupDir: string): Promise<number> {
    let totalSize = 0
    
    const calculateDirectorySize = async (dir: string) => {
      const contents = await FileSystem.readDirectoryAsync(dir)
      for (const item of contents) {
        const fullPath = `${dir}/${item}`
        const stat = await FileSystem.getInfoAsync(fullPath)
        if (stat.exists) {
          if (stat.isDirectory) {
            await calculateDirectorySize(fullPath)
          } else {
            totalSize += stat.size || 0
          }
        }
      }
    }

    await calculateDirectorySize(backupDir)
    return totalSize
  }

  private async calculateChecksum(backupDir: string): Promise<string> {
    const manifestPath = `${backupDir}/manifest.json`
    const manifest = await FileSystem.readAsStringAsync(manifestPath)
    
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      manifest,
      { encoding: Crypto.CryptoEncoding.HEX }
    )
  }

  private async saveBackupMetadata(metadata: BackupMetadata) {
    const { error } = await supabase
      .from('backups')
      .insert([metadata])

    if (error) throw error
  }

  async getBackups(): Promise<BackupMetadata[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })

    if (error) throw error
    return data || []
  }

  async restoreBackup(backupId: string): Promise<void> {
    try {
      // Download backup from cloud
      const backupDir = `${FileSystem.documentDirectory}restore/${backupId}`
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true })

      // Download backup archive
      const { data, error } = await supabase.storage
        .from('backups')
        .download(`${backupId}.zip`)

      if (error) throw error

      // Extract backup
      await this.extractBackup(data, backupDir)

      // Restore documents
      await this.restoreDocuments(backupDir)

      // Restore settings
      await this.restoreSettings(backupDir)

      // Cleanup
      await FileSystem.deleteAsync(backupDir, { idempotent: true })
    } catch (error) {
      console.error('Backup restoration failed:', error)
      throw error
    }
  }

  private async extractBackup(data: Blob, extractDir: string) {
    // In a real implementation, extract zip file
    // For now, just create a placeholder
    await FileSystem.writeAsStringAsync(
      `${extractDir}/placeholder.txt`,
      'Backup extracted'
    )
  }

  private async restoreDocuments(backupDir: string) {
    const documentsDir = `${backupDir}/documents`
    const metadataPath = `${documentsDir}/metadata.json`
    
    try {
      const metadata = await FileSystem.readAsStringAsync(metadataPath)
      const documents = JSON.parse(metadata)

      // Restore documents to database
      for (const doc of documents) {
        await documentService.createDocument(doc)
      }
    } catch (error) {
      console.error('Error restoring documents:', error)
    }
  }

  private async restoreSettings(backupDir: string) {
    const settingsDir = `${backupDir}/settings`
    
    try {
      // Restore app settings
      const appSettingsPath = `${settingsDir}/app_settings.json`
      const appSettings = await FileSystem.readAsStringAsync(appSettingsPath)
      await AsyncStorage.setItem('app_settings', appSettings)

      // Restore user preferences
      const preferencesPath = `${settingsDir}/user_preferences.json`
      const preferences = await FileSystem.readAsStringAsync(preferencesPath)
      await AsyncStorage.setItem('user_preferences', preferences)
    } catch (error) {
      console.error('Error restoring settings:', error)
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    // Delete from cloud storage
    const { error } = await supabase.storage
      .from('backups')
      .remove([`${backupId}.zip`])

    if (error) throw error

    // Delete from database
    await supabase
      .from('backups')
      .delete()
      .eq('id', backupId)
  }

  async scheduleAutomaticBackup(): Promise<void> {
    if (!this.config.auto_backup) return

    // Schedule next backup based on frequency
    const now = new Date()
    let nextBackup: Date

    switch (this.config.backup_frequency) {
      case 'daily':
        nextBackup = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'weekly':
        nextBackup = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        nextBackup = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      default:
        nextBackup = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }

    // Save next backup schedule
    await AsyncStorage.setItem('next_backup_schedule', nextBackup.toISOString())
  }

  async checkAndPerformAutomaticBackup(): Promise<void> {
    if (!this.config.auto_backup) return

    const nextBackupStr = await AsyncStorage.getItem('next_backup_schedule')
    if (!nextBackupStr) {
      await this.scheduleAutomaticBackup()
      return
    }

    const nextBackup = new Date(nextBackupStr)
    const now = new Date()

    if (now >= nextBackup) {
      await this.createBackup()
      await this.scheduleAutomaticBackup()
    }
  }
}

export const backupService = new BackupService()
