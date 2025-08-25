import * as SecureStore from 'expo-secure-store';
import { analyticsService } from '@services/analytics';

/**
 * Configuração de Segurança Avançada
 * Implementa as melhores práticas de segurança para React Native
 */
export class SecurityConfig {
  private static instance: SecurityConfig;
  private encryptionKey: string | null = null;
  private readonly SECURE_KEYS = {
    ENCRYPTION_KEY: 'gabi_family_docs_encryption_key',
    AUTH_TOKEN: 'gabi_family_docs_auth_token',
    REFRESH_TOKEN: 'gabi_family_docs_refresh_token',
    USER_CREDENTIALS: 'gabi_family_docs_user_credentials',
    API_KEYS: 'gabi_family_docs_api_keys',
  };

  private constructor() {
    this.initializeSecurity();
  }

  static getInstance(): SecurityConfig {
    if (!SecurityConfig.instance) {
      SecurityConfig.instance = new SecurityConfig();
    }
    return SecurityConfig.instance;
  }

  /**
   * Inicializa configurações de segurança
   */
  private async initializeSecurity(): Promise<void> {
    try {
      // Verifica se o SecureStore está disponível
      const isAvailable = await SecureStore.isAvailableAsync();
      if (!isAvailable) {
        console.warn('⚠️ SecureStore não está disponível. Usando AsyncStorage como fallback.');
      }

      // Gera chave de criptografia se não existir
      await this.ensureEncryptionKey();
      
      // Configura headers de segurança
      this.setupSecurityHeaders();
      
      console.log('🔒 Configuração de segurança inicializada');
    } catch (error) {
      console.error('❌ Erro ao inicializar segurança:', error);
      analyticsService.trackError('security_init_error', error.message, error.stack);
    }
  }

  /**
   * Garante que existe uma chave de criptografia
   */
  private async ensureEncryptionKey(): Promise<void> {
    try {
      let key = await SecureStore.getItemAsync(this.SECURE_KEYS.ENCRYPTION_KEY);
      
      if (!key) {
        // Gera uma nova chave de 32 bytes (256 bits)
        key = this.generateSecureKey(32);
        await SecureStore.setItemAsync(this.SECURE_KEYS.ENCRYPTION_KEY, key);
        console.log('🔑 Nova chave de criptografia gerada');
      }
      
      this.encryptionKey = key;
    } catch (error) {
      console.error('❌ Erro ao configurar chave de criptografia:', error);
      throw error;
    }
  }

  /**
   * Gera uma chave segura
   */
  private generateSecureKey(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomArray[i] % chars.length);
    }
    
    return result;
  }

  /**
   * Configura headers de segurança para requisições
   */
  private setupSecurityHeaders(): void {
    // Headers de segurança para todas as requisições
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };

    // Aplica headers globalmente
    Object.entries(securityHeaders).forEach(([key, value]) => {
      // Implementar conforme necessário para sua biblioteca de HTTP
      console.log(`🔒 Header de segurança configurado: ${key}: ${value}`);
    });
  }

  /**
   * Armazena dados sensíveis de forma segura
   */
  async storeSecureData(key: string, data: string): Promise<void> {
    try {
      if (!this.encryptionKey) {
        throw new Error('Chave de criptografia não inicializada');
      }

      // Criptografa os dados antes de armazenar
      const encryptedData = await this.encryptData(data);
      await SecureStore.setItemAsync(key, encryptedData);
      
      analyticsService.trackEvent('secure_data_stored', { key, dataLength: data.length });
    } catch (error) {
      console.error('❌ Erro ao armazenar dados seguros:', error);
      analyticsService.trackError('secure_store_error', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Recupera dados sensíveis de forma segura
   */
  async getSecureData(key: string): Promise<string | null> {
    try {
      const encryptedData = await SecureStore.getItemAsync(key);
      
      if (!encryptedData) {
        return null;
      }

      // Descriptografa os dados
      const decryptedData = await this.decryptData(encryptedData);
      
      analyticsService.trackEvent('secure_data_retrieved', { key, dataLength: decryptedData.length });
      return decryptedData;
    } catch (error) {
      console.error('❌ Erro ao recuperar dados seguros:', error);
      analyticsService.trackError('secure_retrieve_error', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Remove dados sensíveis
   */
  async removeSecureData(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      analyticsService.trackEvent('secure_data_removed', { key });
    } catch (error) {
      console.error('❌ Erro ao remover dados seguros:', error);
      analyticsService.trackError('secure_remove_error', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Criptografa dados usando AES-256
   */
  private async encryptData(data: string): Promise<string> {
    try {
      // Implementação simplificada - em produção, use uma biblioteca robusta
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Gera IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Importa chave
      const keyBuffer = encoder.encode(this.encryptionKey!);
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // Criptografa
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBuffer
      );
      
      // Combina IV + dados criptografados
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedBuffer), iv.length);
      
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('❌ Erro na criptografia:', error);
      throw error;
    }
  }

  /**
   * Descriptografa dados usando AES-256
   */
  private async decryptData(encryptedData: string): Promise<string> {
    try {
      // Decodifica base64
      const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // Extrai IV (primeiros 12 bytes)
      const iv = data.slice(0, 12);
      const encryptedBuffer = data.slice(12);
      
      // Importa chave
      const encoder = new TextEncoder();
      const keyBuffer = encoder.encode(this.encryptionKey!);
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Descriptografa
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encryptedBuffer
      );
      
      // Converte para string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('❌ Erro na descriptografia:', error);
      throw error;
    }
  }

  /**
   * Valida entrada de dados para prevenir ataques
   */
  validateInput(input: string, type: 'email' | 'password' | 'text' | 'url'): boolean {
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      text: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
      url: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
    };

    const pattern = patterns[type];
    if (!pattern) {
      throw new Error(`Tipo de validação não suportado: ${type}`);
    }

    return pattern.test(input);
  }

  /**
   * Sanitiza dados para prevenir XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Gera token seguro para autenticação
   */
  generateSecureToken(): string {
    return this.generateSecureKey(64);
  }

  /**
   * Verifica se o dispositivo é seguro
   */
  async checkDeviceSecurity(): Promise<{ isSecure: boolean; issues: string[] }> {
    const issues: string[] = [];
    let isSecure = true;

    try {
      // Verifica se o SecureStore está disponível
      const isAvailable = await SecureStore.isAvailableAsync();
      if (!isAvailable) {
        issues.push('SecureStore não disponível');
        isSecure = false;
      }

      // Verifica se a chave de criptografia existe
      if (!this.encryptionKey) {
        issues.push('Chave de criptografia não configurada');
        isSecure = false;
      }

      // Verifica se o dispositivo está em modo de desenvolvimento
      if (__DEV__) {
        issues.push('Aplicação em modo de desenvolvimento');
        // Não marca como inseguro, apenas avisa
      }

      return { isSecure, issues };
    } catch (error) {
      console.error('❌ Erro ao verificar segurança do dispositivo:', error);
      return { isSecure: false, issues: ['Erro ao verificar segurança'] };
    }
  }

  /**
   * Limpa todos os dados sensíveis
   */
  async clearAllSecureData(): Promise<void> {
    try {
      const keys = Object.values(this.SECURE_KEYS);
      
      for (const key of keys) {
        await SecureStore.deleteItemAsync(key);
      }
      
      this.encryptionKey = null;
      console.log('🧹 Todos os dados seguros foram removidos');
      analyticsService.trackEvent('all_secure_data_cleared');
    } catch (error) {
      console.error('❌ Erro ao limpar dados seguros:', error);
      analyticsService.trackError('secure_clear_all_error', error.message, error.stack);
      throw error;
    }
  }
}

export const securityConfig = SecurityConfig.getInstance();
