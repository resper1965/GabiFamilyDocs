import { PerformanceProfiler, LogLevel, RenderPassReport } from '@shopify/react-native-performance';
import { analyticsService } from '@services/analytics';

/**
 * Configuração de Performance para React Native
 * Baseada nas melhores práticas do @shopify/react-native-performance
 */
export class PerformanceConfig {
  private static instance: PerformanceConfig;
  private isEnabled: boolean = __DEV__;
  private logLevel: LogLevel = __DEV__ ? LogLevel.Debug : LogLevel.Error;

  private constructor() {}

  static getInstance(): PerformanceConfig {
    if (!PerformanceConfig.instance) {
      PerformanceConfig.instance = new PerformanceConfig();
    }
    return PerformanceConfig.instance;
  }

  /**
   * Configura o nível de log baseado no ambiente
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Habilita ou desabilita o profiler
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Handler para relatórios de performance
   */
  onReportPrepared = (report: RenderPassReport): void => {
    // Envia métricas para analytics
    analyticsService.trackPerformance('render_pass', report.timeToRenderMillis || 0, 'ms');
    
    // Log detalhado em desenvolvimento
    if (__DEV__) {
      console.log('📊 Performance Report:', JSON.stringify(report, null, 2));
    }

    // Alertas para performance ruim
    if (report.timeToRenderMillis && report.timeToRenderMillis > 5000) {
      console.warn('⚠️ Slow render detected:', {
        screen: report.destinationScreen,
        time: report.timeToRenderMillis,
        interactive: report.interactive,
      });
    }
  };

  /**
   * Handler para erros de performance
   */
  onError = (error: Error): void => {
    console.error('🚨 Performance Error:', error);
    analyticsService.trackError('performance_error', error.message, error.stack);
  };

  /**
   * Configuração do PerformanceProfiler
   */
  getProfilerConfig() {
    return {
      enabled: this.isEnabled,
      logLevel: this.logLevel,
      onReportPrepared: this.onReportPrepared,
      errorHandler: this.onError,
      renderTimeoutMillis: 7000, // 7 segundos timeout
      useRenderTimeouts: true,
    };
  }

  /**
   * Métricas de performance customizadas
   */
  trackCustomMetric(name: string, value: number, unit: string = 'ms'): void {
    analyticsService.trackPerformance(name, value, unit);
  }

  /**
   * Monitoramento de memória
   */
  trackMemoryUsage(): void {
    if (__DEV__) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        this.trackCustomMetric('memory_used', memoryInfo.usedJSHeapSize, 'bytes');
        this.trackCustomMetric('memory_total', memoryInfo.totalJSHeapSize, 'bytes');
      }
    }
  }
}

export const performanceConfig = PerformanceConfig.getInstance();
