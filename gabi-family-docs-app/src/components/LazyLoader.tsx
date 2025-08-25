import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'
import { performanceService } from '../services/performance'

interface LazyLoaderProps {
  children: React.ReactNode
  placeholder?: React.ReactNode
  threshold?: number
  onLoad?: () => void
  onError?: (error: Error) => void
  style?: any
  fadeInDuration?: number
  springConfig?: {
    damping: number
    stiffness: number
  }
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

export const LazyLoader: React.FC<LazyLoaderProps> = ({
  children,
  placeholder,
  threshold = 0.1,
  onLoad,
  onError,
  style,
  fadeInDuration = 300,
  springConfig = { damping: 15, stiffness: 150 },
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Animated values
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const translateY = useSharedValue(20)

  // Load state tracking
  const loadStartTime = useSharedValue(0)
  const loadEndTime = useSharedValue(0)

  // Default placeholder
  const defaultPlaceholder = (
    <View style={styles.defaultPlaceholder}>
      <View style={styles.shimmer} />
    </View>
  )

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    }
  })

  const placeholderAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        opacity.value,
        [0, 1],
        [1, 0],
        Extrapolate.CLAMP
      ),
    }
  })

  // Load animation
  const animateLoad = useCallback(() => {
    loadStartTime.value = Date.now()

    // Animate in with spring
    opacity.value = withSpring(1, springConfig)
    scale.value = withSpring(1, springConfig)
    translateY.value = withSpring(0, springConfig)

    // Track load completion
    setTimeout(() => {
      loadEndTime.value = Date.now()
      const loadTime = loadEndTime.value - loadStartTime.value
      
      // Track performance
      performanceService.trackScreenLoad('LazyLoader', loadTime)
      
      // Call onLoad callback
      if (onLoad) {
        onLoad()
      }
    }, fadeInDuration)
  }, [fadeInDuration, springConfig, onLoad])

  // Error animation
  const animateError = useCallback(() => {
    // Shake animation for error
    translateY.value = withSpring(0, { damping: 10, stiffness: 100 })
    
    // Flash red briefly
    opacity.value = withTiming(0.8, { duration: 100 }, () => {
      opacity.value = withTiming(1, { duration: 100 })
    })
  }, [])

  // Intersection observer simulation
  useEffect(() => {
    const checkVisibility = () => {
      // Simple visibility check - in a real app, you'd use IntersectionObserver
      const isInViewport = Math.random() > 0.5 // Simulate visibility check
      
      if (isInViewport && !isVisible) {
        setIsVisible(true)
        animateLoad()
      }
    }

    // Check visibility after a delay
    const timer = setTimeout(checkVisibility, 100)
    
    return () => clearTimeout(timer)
  }, [isVisible, animateLoad])

  // Error handling
  useEffect(() => {
    if (hasError) {
      animateError()
      if (onError) {
        onError(new Error('Failed to load component'))
      }
    }
  }, [hasError, animateError, onError])

  // Simulate loading state
  useEffect(() => {
    if (isVisible) {
      const loadTimer = setTimeout(() => {
        setIsLoaded(true)
      }, Math.random() * 1000 + 500) // Random load time between 500-1500ms

      return () => clearTimeout(loadTimer)
    }
  }, [isVisible])

  // Simulate error (for testing)
  useEffect(() => {
    if (isVisible && Math.random() < 0.1) { // 10% chance of error
      const errorTimer = setTimeout(() => {
        setHasError(true)
      }, Math.random() * 2000 + 1000)

      return () => clearTimeout(errorTimer)
    }
  }, [isVisible])

  return (
    <View style={[styles.container, style]}>
      {/* Placeholder */}
      <Animated.View style={[styles.placeholderContainer, placeholderAnimatedStyle]}>
        {placeholder || defaultPlaceholder}
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.contentContainer, containerAnimatedStyle]}>
        {isLoaded && !hasError ? children : null}
      </Animated.View>

      {/* Error state */}
      {hasError && (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <View style={styles.errorIcon} />
            <View style={styles.errorText} />
          </View>
        </View>
      )}
    </View>
  )
}

// Lazy component wrapper
export const createLazyComponent = <T extends {}>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options: {
    placeholder?: React.ReactNode
    threshold?: number
    onLoad?: () => void
    onError?: (error: Error) => void
  } = {}
) => {
  const LazyComponent = React.lazy(importFn)
  
  return React.forwardRef<any, T>((props, ref) => (
    <LazyLoader
      placeholder={options.placeholder}
      threshold={options.threshold}
      onLoad={options.onLoad}
      onError={options.onError}
    >
      <LazyComponent {...props} ref={ref} />
    </LazyLoader>
  ))
}

// Lazy image component
export const LazyImage: React.FC<{
  source: { uri: string }
  style?: any
  placeholder?: React.ReactNode
  onLoad?: () => void
  onError?: (error: Error) => void
}> = ({ source, style, placeholder, onLoad, onError }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    if (onLoad) onLoad()
  }, [onLoad])

  const handleImageError = useCallback(() => {
    setImageError(true)
    if (onError) onError(new Error('Failed to load image'))
  }, [onError])

  return (
    <LazyLoader
      placeholder={placeholder}
      onLoad={handleImageLoad}
      onError={handleImageError}
    >
      <Animated.Image
        source={source}
        style={[styles.image, style]}
        onLoad={handleImageLoad}
        onError={handleImageError}
        resizeMode="cover"
      />
    </LazyLoader>
  )
}

// Lazy list component
export const LazyList: React.FC<{
  data: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  keyExtractor: (item: any, index: number) => string
  style?: any
  contentContainerStyle?: any
  showsVerticalScrollIndicator?: boolean
  showsHorizontalScrollIndicator?: boolean
}> = ({
  data,
  renderItem,
  keyExtractor,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
}) => {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())

  const handleItemVisible = useCallback((key: string) => {
    setVisibleItems(prev => new Set([...prev, key]))
  }, [])

  return (
    <Animated.ScrollView
      style={[styles.list, style]}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
    >
      {data.map((item, index) => {
        const key = keyExtractor(item, index)
        const isVisible = visibleItems.has(key)

        return (
          <LazyLoader
            key={key}
            onLoad={() => handleItemVisible(key)}
            threshold={0.1}
          >
            {isVisible ? renderItem(item, index) : null}
          </LazyLoader>
        )
      })}
    </Animated.ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  contentContainer: {
    position: 'relative',
    zIndex: 2,
  },
  defaultPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    opacity: 0.6,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#f44336',
    borderRadius: 12,
    marginBottom: 8,
  },
  errorText: {
    width: 80,
    height: 12,
    backgroundColor: '#f44336',
    borderRadius: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  list: {
    flex: 1,
  },
})

export default LazyLoader
