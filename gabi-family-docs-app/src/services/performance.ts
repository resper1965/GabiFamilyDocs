import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { analyticsService } from './analytics'
import * as FileSystem from 'expo-file-system'
import * as ImageManipulator from 'expo-image-manipulator'
import NetInfo from '@react-native-community/netinfo'

interface PerformanceConfig {
  enabled: boolean
  lazy_loading: boolean
  image_optimization: boolean
  cache_enabled: boolean
  compression_enabled: boolean
  memory_management: boolean
  background_sync: boolean
  performance_monitoring: boolean
}

interface CacheItem {
  key: string
  data: any
  timestamp: number
  ttl: number
  size: number
}

interface PerformanceMetrics {
  app_start_time: number
  screen_load_times: Record<string, number>
  memory_usage: number
  cache_hit_rate: number
  image_optimization_savings: number
  background_sync_success_rate: number
  network_requests: number
  errors_count: number
}

export class PerformanceService {
  private config: PerformanceConfig = {
    enabled: true,
    lazy_loading: true,
    image_optimization: true,
    cache_enabled: true,
    compression_enabled: true,
    memory_management: true,
    background_sync: true,
    performance_monitoring: true,
  }

  private cache: Map<string, CacheItem> = new Map()
  private maxCacheSize = 50 * 1024 * 1024 // 50MB
  private currentCacheSize = 0
  private performanceMetrics: PerformanceMetrics = {
    app_start_time: 0,
    screen_load_times: {},
    memory_usage: 0,
    cache_hit_rate: 0,
    image_optimization_savings: 0,
    background_sync_success_rate: 0,
    network_requests: 0,
    errors_count: 0,
  }

  constructor() {
    this.initializePerformance()
  }

  private async initializePerformance() {
    await this.loadConfig()
    this.startPerformanceMonitoring()
    this.setupMemoryManagement()
  }

  private async loadConfig() {
    try {
      const config = await AsyncStorage.getItem('performance_config')
      if (config) {
        this.config = { ...this.config, ...JSON.parse(config) }
      }
    } catch (error) {
      console.error('Error loading performance config:', error)
    }
  }

  private async saveConfig() {
    try {
      await AsyncStorage.setItem('performance_config', JSON.stringify(this.config))
    } catch (error) {
      console.error('Error saving performance config:', error)
    }
  }

  async updateConfig(newConfig: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...newConfig }
    await this.saveConfig()
  }

  async getConfig(): Promise<PerformanceConfig> {
    return this.config
  }

  // Cache Management
  async setCache(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.config.cache_enabled) return

    try {
      const size = JSON.stringify(data).length
      const item: CacheItem = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
        size,
      }

      // Check if we need to evict items
      if (this.currentCacheSize + size > this.maxCacheSize) {
        await this.evictCacheItems(size)
      }

      this.cache.set(key, item)
      this.currentCacheSize += size

      // Track cache metrics
      await analyticsService.trackPerformance('cache_set', size, 'bytes')
    } catch (error) {
      console.error('Error setting cache:', error)
    }
  }

  async getCache(key: string): Promise<any | null> {
    if (!this.config.cache_enabled) return null

    try {
      const item = this.cache.get(key)
      if (!item) {
        await analyticsService.trackPerformance('cache_miss', 1, 'count')
        return null
      }

      // Check if item is expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.cache.delete(key)
        this.currentCacheSize -= item.size
        await analyticsService.trackPerformance('cache_expired', 1, 'count')
        return null
      }

      // Track cache hit
      await analyticsService.trackPerformance('cache_hit', 1, 'count')
      return item.data
    } catch (error) {
      console.error('Error getting cache:', error)
      return null
    }
  }

  private async evictCacheItems(requiredSize: number): Promise<void> {
    const items = Array.from(this.cache.values())
      .sort((a, b) => a.timestamp - b.timestamp) // LRU eviction

    let freedSize = 0
    for (const item of items) {
      if (freedSize >= requiredSize) break

      this.cache.delete(item.key)
      freedSize += item.size
      this.currentCacheSize -= item.size
    }
  }

  async clearCache(): Promise<void> {
    this.cache.clear()
    this.currentCacheSize = 0
    await analyticsService.trackPerformance('cache_cleared', 1, 'count')
  }

  // Image Optimization
  async optimizeImage(imagePath: string, options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  } = {}): Promise<string> {
    if (!this.config.image_optimization) return imagePath

    try {
      const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8,
        format = 'jpeg'
      } = options

      const originalSize = await this.getFileSize(imagePath)
      
      const optimizedImage = await ImageManipulator.manipulateAsync(
        imagePath,
        [
          { resize: { width: maxWidth, height: maxHeight } },
        ],
        {
          compress: quality,
          format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG :
                   format === 'png' ? ImageManipulator.SaveFormat.PNG :
                   ImageManipulator.SaveFormat.WEBP,
        }
      )

      const optimizedSize = await this.getFileSize(optimizedImage.uri)
      const savings = originalSize - optimizedSize

      this.performanceMetrics.image_optimization_savings += savings
      await analyticsService.trackPerformance('image_optimized', savings, 'bytes')

      return optimizedImage.uri
    } catch (error) {
      console.error('Error optimizing image:', error)
      return imagePath
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(filePath)
      return info.size || 0
    } catch (error) {
      return 0
    }
  }

  // Lazy Loading
  createLazyComponent<T>(
    importFn: () => Promise<{ default: React.ComponentType<T> }>,
    fallback?: React.ComponentType
  ): React.ComponentType<T> {
    if (!this.config.lazy_loading) {
      return importFn().then(module => module.default)
    }

    const LazyComponent = React.lazy(importFn)
    
    return (props: T) => (
      <React.Suspense fallback={fallback || <div>Loading...</div>}>
        <LazyComponent {...props} />
      </React.Suspense>
    )
  }

  // Memory Management
  private setupMemoryManagement(): void {
    if (!this.config.memory_management) return

    // Monitor memory usage
    setInterval(() => {
      this.checkMemoryUsage()
    }, 30000) // Check every 30 seconds

    // Cleanup on app state changes
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        this.cleanupMemory()
      }
    })
  }

  private async checkMemoryUsage(): Promise<void> {
    try {
      // Simulate memory usage check
      const memoryUsage = Math.random() * 100 // Mock value
      this.performanceMetrics.memory_usage = memoryUsage

      if (memoryUsage > 80) {
        await this.cleanupMemory()
      }

      await analyticsService.trackPerformance('memory_usage', memoryUsage, 'percentage')
    } catch (error) {
      console.error('Error checking memory usage:', error)
    }
  }

  private async cleanupMemory(): Promise<void> {
    try {
      // Clear old cache items
      const now = Date.now()
      const itemsToRemove: string[] = []

      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          itemsToRemove.push(key)
        }
      }

      for (const key of itemsToRemove) {
        const item = this.cache.get(key)
        if (item) {
          this.cache.delete(key)
          this.currentCacheSize -= item.size
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      await analyticsService.trackPerformance('memory_cleanup', itemsToRemove.length, 'count')
    } catch (error) {
      console.error('Error cleaning up memory:', error)
    }
  }

  // Background Sync
  async setupBackgroundSync(syncFunction: () => Promise<void>): Promise<void> {
    if (!this.config.background_sync) return

    try {
      const netInfo = await NetInfo.fetch()
      
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        await syncFunction()
        this.performanceMetrics.background_sync_success_rate += 1
        await analyticsService.trackPerformance('background_sync_success', 1, 'count')
      } else {
        await analyticsService.trackPerformance('background_sync_failed', 1, 'count')
      }
    } catch (error) {
      console.error('Error in background sync:', error)
      await analyticsService.trackPerformance('background_sync_error', 1, 'count')
    }
  }

  // Performance Monitoring
  private startPerformanceMonitoring(): void {
    if (!this.config.performance_monitoring) return

    // Track app start time
    this.performanceMetrics.app_start_time = Date.now()

    // Monitor screen load times
    this.monitorScreenLoadTimes()

    // Monitor network requests
    this.monitorNetworkRequests()

    // Monitor errors
    this.monitorErrors()
  }

  private monitorScreenLoadTimes(): void {
    // This would integrate with React Navigation or similar
    // For now, we'll track manually
  }

  trackScreenLoad(screenName: string, loadTime: number): void {
    this.performanceMetrics.screen_load_times[screenName] = loadTime
    analyticsService.trackPerformance(`screen_load_${screenName}`, loadTime, 'milliseconds')
  }

  private monitorNetworkRequests(): void {
    // This would integrate with fetch or axios interceptors
    // For now, we'll track manually
  }

  trackNetworkRequest(url: string, duration: number, success: boolean): void {
    this.performanceMetrics.network_requests += 1
    
    if (!success) {
      this.performanceMetrics.errors_count += 1
    }

    analyticsService.trackPerformance('network_request', duration, 'milliseconds')
  }

  private monitorErrors(): void {
    // Global error handler
    const originalErrorHandler = ErrorUtils.setGlobalHandler
    
    ErrorUtils.setGlobalHandler = (error: Error, isFatal?: boolean) => {
      this.performanceMetrics.errors_count += 1
      analyticsService.trackError('global_error', error.message, error.stack)
      
      // Call original handler
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal)
      }
    }
  }

  // Data Compression
  async compressData(data: any): Promise<string> {
    if (!this.config.compression_enabled) {
      return JSON.stringify(data)
    }

    try {
      const jsonString = JSON.stringify(data)
      const compressed = await this.compressString(jsonString)
      
      const originalSize = jsonString.length
      const compressedSize = compressed.length
      const compressionRatio = (originalSize - compressedSize) / originalSize

      await analyticsService.trackPerformance('data_compression', compressionRatio * 100, 'percentage')
      
      return compressed
    } catch (error) {
      console.error('Error compressing data:', error)
      return JSON.stringify(data)
    }
  }

  async decompressData(compressedData: string): Promise<any> {
    if (!this.config.compression_enabled) {
      return JSON.parse(compressedData)
    }

    try {
      const decompressed = await this.decompressString(compressedData)
      return JSON.parse(decompressed)
    } catch (error) {
      console.error('Error decompressing data:', error)
      return JSON.parse(compressedData)
    }
  }

  private async compressString(str: string): Promise<string> {
    // Simple compression using LZ-string or similar
    // For now, return the original string
    return str
  }

  private async decompressString(str: string): Promise<string> {
    // Simple decompression
    return str
  }

  // Performance Metrics
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.performanceMetrics
  }

  async resetPerformanceMetrics(): Promise<void> {
    this.performanceMetrics = {
      app_start_time: Date.now(),
      screen_load_times: {},
      memory_usage: 0,
      cache_hit_rate: 0,
      image_optimization_savings: 0,
      background_sync_success_rate: 0,
      network_requests: 0,
      errors_count: 0,
    }
  }

  // Cache Statistics
  getCacheStats(): {
    size: number
    itemCount: number
    hitRate: number
    maxSize: number
  } {
    const hitRate = this.performanceMetrics.cache_hit_rate
    return {
      size: this.currentCacheSize,
      itemCount: this.cache.size,
      hitRate,
      maxSize: this.maxCacheSize,
    }
  }

  // Performance Recommendations
  async getPerformanceRecommendations(): Promise<string[]> {
    const recommendations: string[] = []
    const metrics = await this.getPerformanceMetrics()

    if (metrics.memory_usage > 70) {
      recommendations.push('Memory usage is high. Consider clearing cache or optimizing images.')
    }

    if (metrics.errors_count > 10) {
      recommendations.push('High error rate detected. Check network connectivity and error handling.')
    }

    if (metrics.cache_hit_rate < 0.5) {
      recommendations.push('Low cache hit rate. Consider adjusting cache TTL or increasing cache size.')
    }

    if (metrics.image_optimization_savings < 1024 * 1024) {
      recommendations.push('Image optimization savings are low. Consider enabling more aggressive compression.')
    }

    return recommendations
  }

  // Performance Testing
  async runPerformanceTest(): Promise<{
    cache_performance: number
    image_optimization_performance: number
    memory_cleanup_performance: number
    overall_score: number
  }> {
    const startTime = Date.now()

    // Test cache performance
    const cacheStart = Date.now()
    await this.setCache('test_key', { test: 'data' })
    await this.getCache('test_key')
    const cachePerformance = Date.now() - cacheStart

    // Test image optimization
    const imageStart = Date.now()
    // Mock image optimization test
    await new Promise(resolve => setTimeout(resolve, 100))
    const imageOptimizationPerformance = Date.now() - imageStart

    // Test memory cleanup
    const memoryStart = Date.now()
    await this.cleanupMemory()
    const memoryCleanupPerformance = Date.now() - memoryStart

    const overallScore = Math.max(0, 100 - (Date.now() - startTime) / 10)

    return {
      cache_performance: cachePerformance,
      image_optimization_performance: imageOptimizationPerformance,
      memory_cleanup_performance: memoryCleanupPerformance,
      overall_score: overallScore,
    }
  }
}

export const performanceService = new PerformanceService()
