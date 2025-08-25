import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ollamaService } from './ollama'
import * as FileSystem from 'expo-file-system'
import * as ImageManipulator from 'expo-image-manipulator'

interface OCRConfig {
  enabled: boolean
  paperless_url: string
  paperless_token: string
  auto_ocr: boolean
  language: string
  confidence_threshold: number
  extract_metadata: boolean
  classify_documents: boolean
}

interface OCRResult {
  id: string
  document_id: string
  text: string
  confidence: number
  language: string
  metadata: Record<string, any>
  classification: string
  tags: string[]
  created_at: string
}

interface DocumentClassification {
  id: string
  name: string
  confidence: number
  category: string
  description: string
}

export class OCRService {
  private config: OCRConfig = {
    enabled: false,
    paperless_url: '',
    paperless_token: '',
    auto_ocr: true,
    language: 'por',
    confidence_threshold: 0.7,
    extract_metadata: true,
    classify_documents: true,
  }

  constructor() {
    this.initializeOCR()
  }

  private async initializeOCR() {
    await this.loadConfig()
  }

  private async loadConfig() {
    try {
      const config = await AsyncStorage.getItem('ocr_config')
      if (config) {
        this.config = { ...this.config, ...JSON.parse(config) }
      }
    } catch (error) {
      console.error('Error loading OCR config:', error)
    }
  }

  private async saveConfig() {
    try {
      await AsyncStorage.setItem('ocr_config', JSON.stringify(this.config))
    } catch (error) {
      console.error('Error saving OCR config:', error)
    }
  }

  async updateConfig(newConfig: Partial<OCRConfig>) {
    this.config = { ...this.config, ...newConfig }
    await this.saveConfig()
  }

  async getConfig(): Promise<OCRConfig> {
    return this.config
  }

  // Process document with OCR
  async processDocument(
    documentId: string,
    filePath: string,
    documentType?: string
  ): Promise<OCRResult> {
    if (!this.config.enabled) {
      throw new Error('OCR is not enabled')
    }

    try {
      // Preprocess image for better OCR
      const processedImage = await this.preprocessImage(filePath)

      // Upload to Paperless-ngx
      const uploadResult = await this.uploadToPaperless(processedImage, documentType)

      // Process OCR
      const ocrResult = await this.performOCR(uploadResult.document_id)

      // Extract metadata
      if (this.config.extract_metadata) {
        ocrResult.metadata = await this.extractMetadata(ocrResult.text)
      }

      // Classify document
      if (this.config.classify_documents) {
        const classification = await this.classifyDocument(ocrResult.text, documentType)
        ocrResult.classification = classification.name
        ocrResult.tags = classification.tags || []
      }

      // Save result to database
      await this.saveOCRResult(ocrResult)

      return ocrResult
    } catch (error) {
      console.error('Error processing document with OCR:', error)
      throw error
    }
  }

  private async preprocessImage(filePath: string): Promise<string> {
    try {
      // Enhance image for better OCR
      const processedImage = await ImageManipulator.manipulateAsync(
        filePath,
        [
          { resize: { width: 2000 } }, // Resize for optimal OCR
          { brightness: 1.1 }, // Slightly increase brightness
          { contrast: 1.2 }, // Increase contrast
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )

      return processedImage.uri
    } catch (error) {
      console.error('Error preprocessing image:', error)
      return filePath // Return original if preprocessing fails
    }
  }

  private async uploadToPaperless(filePath: string, documentType?: string): Promise<{ document_id: string }> {
    try {
      const formData = new FormData()
      formData.append('document', {
        uri: filePath,
        type: 'image/jpeg',
        name: `document_${Date.now()}.jpg`,
      } as any)

      if (documentType) {
        formData.append('document_type', documentType)
      }

      const response = await fetch(`${this.config.paperless_url}/api/documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.paperless_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Paperless upload failed: ${response.status}`)
      }

      const result = await response.json()
      return { document_id: result.id }
    } catch (error) {
      console.error('Error uploading to Paperless:', error)
      throw error
    }
  }

  private async performOCR(documentId: string): Promise<Partial<OCRResult>> {
    try {
      // Get OCR result from Paperless-ngx
      const response = await fetch(
        `${this.config.paperless_url}/api/documents/${documentId}/`,
        {
          headers: {
            'Authorization': `Token ${this.config.paperless_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get OCR result: ${response.status}`)
      }

      const document = await response.json()

      return {
        document_id: documentId,
        text: document.content || '',
        confidence: document.ocr_confidence || 0,
        language: document.ocr_language || this.config.language,
        metadata: {},
        classification: '',
        tags: [],
        created_at: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error performing OCR:', error)
      throw error
    }
  }

  private async extractMetadata(text: string): Promise<Record<string, any>> {
    try {
      const metadata: Record<string, any> = {}

      // Extract CPF
      const cpfMatch = text.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/)
      if (cpfMatch) {
        metadata.cpf = cpfMatch[0]
      }

      // Extract RG
      const rgMatch = text.match(/RG[:\s]*([A-Z0-9\s]+)/i)
      if (rgMatch) {
        metadata.rg = rgMatch[1].trim()
      }

      // Extract dates
      const dateMatches = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/g)
      if (dateMatches) {
        metadata.dates = dateMatches
      }

      // Extract names (simple pattern)
      const nameMatches = text.match(/(?:Nome|Nome Completo)[:\s]*([A-ZÀ-Ú\s]+)/gi)
      if (nameMatches) {
        metadata.names = nameMatches.map(match => match.replace(/^(?:Nome|Nome Completo)[:\s]*/i, '').trim())
      }

      // Extract addresses
      const addressMatches = text.match(/(?:Endereço|Residente)[:\s]*([^.\n]+)/gi)
      if (addressMatches) {
        metadata.addresses = addressMatches.map(match => match.replace(/^(?:Endereço|Residente)[:\s]*/i, '').trim())
      }

      // Use AI to extract additional metadata
      if (this.config.extract_metadata) {
        const aiMetadata = await this.extractMetadataWithAI(text)
        Object.assign(metadata, aiMetadata)
      }

      return metadata
    } catch (error) {
      console.error('Error extracting metadata:', error)
      return {}
    }
  }

  private async extractMetadataWithAI(text: string): Promise<Record<string, any>> {
    try {
      const prompt = `Extraia informações estruturadas do seguinte texto de documento:

${text}

Por favor, extraia e retorne apenas um JSON com as seguintes informações:
- nome_completo: Nome completo da pessoa
- cpf: CPF se encontrado
- rg: RG se encontrado
- data_nascimento: Data de nascimento se encontrada
- endereco: Endereço completo se encontrado
- telefone: Telefone se encontrado
- email: Email se encontrado
- documento_tipo: Tipo de documento (RG, CPF, Certidão, etc.)
- validade: Data de validade se encontrada

Retorne apenas o JSON, sem texto adicional.`

      const response = await ollamaService.chatWithFamilyData(prompt, {
        context: 'metadata_extraction',
        format: 'json',
      })

      try {
        return JSON.parse(response)
      } catch (parseError) {
        console.error('Error parsing AI metadata:', parseError)
        return {}
      }
    } catch (error) {
      console.error('Error extracting metadata with AI:', error)
      return {}
    }
  }

  private async classifyDocument(text: string, documentType?: string): Promise<DocumentClassification> {
    try {
      // Use AI for document classification
      const prompt = `Classifique o seguinte documento baseado no seu conteúdo:

${text.substring(0, 500)}...

Tipo de documento fornecido: ${documentType || 'Não especificado'}

Por favor, classifique em uma das seguintes categorias:
- identidade (RG, CPF, CNH)
- certidao (nascimento, casamento, óbito)
- contrato (contratos, acordos)
- procuração (procurações, representações)
- declaração (declarações, atestados)
- outros (outros tipos)

Retorne apenas o nome da categoria mais apropriada.`

      const classification = await ollamaService.chatWithFamilyData(prompt, {
        context: 'document_classification',
      })

      return {
        id: `classification_${Date.now()}`,
        name: classification.trim().toLowerCase(),
        confidence: 0.85, // AI confidence
        category: this.getCategoryFromClassification(classification),
        description: `Documento classificado como ${classification}`,
      }
    } catch (error) {
      console.error('Error classifying document:', error)
      return {
        id: `classification_${Date.now()}`,
        name: 'outros',
        confidence: 0.5,
        category: 'outros',
        description: 'Classificação padrão',
      }
    }
  }

  private getCategoryFromClassification(classification: string): string {
    const categoryMap: Record<string, string> = {
      'identidade': 'documentos_pessoais',
      'certidao': 'certidões',
      'contrato': 'contratos',
      'procuração': 'procurações',
      'declaração': 'declarações',
      'outros': 'outros',
    }

    return categoryMap[classification.toLowerCase()] || 'outros'
  }

  private async saveOCRResult(result: OCRResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('ocr_results')
        .insert([result])

      if (error) throw error
    } catch (error) {
      console.error('Error saving OCR result:', error)
      throw error
    }
  }

  // Search documents using OCR text
  async searchDocuments(query: string): Promise<OCRResult[]> {
    try {
      const { data, error } = await supabase
        .from('ocr_results')
        .select('*')
        .or(`text.ilike.%${query}%,metadata->>'nome_completo'.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching documents:', error)
      return []
    }
  }

  // Get OCR results for a document
  async getOCRResults(documentId: string): Promise<OCRResult[]> {
    try {
      const { data, error } = await supabase
        .from('ocr_results')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting OCR results:', error)
      return []
    }
  }

  // Get document classifications
  async getDocumentClassifications(): Promise<DocumentClassification[]> {
    try {
      const { data, error } = await supabase
        .from('ocr_results')
        .select('classification, confidence')
        .not('classification', 'eq', '')

      if (error) throw error

      // Group by classification
      const classifications = data?.reduce((acc, result) => {
        const existing = acc.find(c => c.name === result.classification)
        if (existing) {
          existing.confidence = Math.max(existing.confidence, result.confidence)
        } else {
          acc.push({
            id: `classification_${result.classification}`,
            name: result.classification,
            confidence: result.confidence,
            category: this.getCategoryFromClassification(result.classification),
            description: `Documentos classificados como ${result.classification}`,
          })
        }
        return acc
      }, [] as DocumentClassification[])

      return classifications || []
    } catch (error) {
      console.error('Error getting document classifications:', error)
      return []
    }
  }

  // Batch OCR processing
  async processBatch(documents: Array<{ id: string; filePath: string; type?: string }>): Promise<OCRResult[]> {
    const results: OCRResult[] = []

    for (const document of documents) {
      try {
        const result = await this.processDocument(document.id, document.filePath, document.type)
        results.push(result)
      } catch (error) {
        console.error(`Error processing document ${document.id}:`, error)
      }
    }

    return results
  }

  // OCR analytics
  async getOCRAnalytics(): Promise<{
    total_documents: number
    average_confidence: number
    language_distribution: Record<string, number>
    classification_distribution: Record<string, number>
    processing_time_average: number
  }> {
    try {
      const { data, error } = await supabase
        .from('ocr_results')
        .select('*')

      if (error) throw error

      const totalDocuments = data?.length || 0
      const averageConfidence = data?.reduce((sum, doc) => sum + doc.confidence, 0) / totalDocuments || 0

      // Language distribution
      const languageDistribution = data?.reduce((acc, doc) => {
        acc[doc.language] = (acc[doc.language] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Classification distribution
      const classificationDistribution = data?.reduce((acc, doc) => {
        acc[doc.classification] = (acc[doc.classification] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      return {
        total_documents: totalDocuments,
        average_confidence: averageConfidence,
        language_distribution: languageDistribution,
        classification_distribution: classificationDistribution,
        processing_time_average: 2.5, // Estimated average processing time in seconds
      }
    } catch (error) {
      console.error('Error getting OCR analytics:', error)
      return {
        total_documents: 0,
        average_confidence: 0,
        language_distribution: {},
        classification_distribution: {},
        processing_time_average: 0,
      }
    }
  }

  // Test OCR connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.paperless_url}/api/documents/`, {
        headers: {
          'Authorization': `Token ${this.config.paperless_token}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error('Error testing OCR connection:', error)
      return false
    }
  }

  // Get OCR status
  async getOCRStatus(): Promise<{
    enabled: boolean
    connected: boolean
    auto_ocr: boolean
    documents_processed: number
    last_processed: string | null
  }> {
    try {
      const connected = await this.testConnection()
      
      const { data } = await supabase
        .from('ocr_results')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)

      return {
        enabled: this.config.enabled,
        connected,
        auto_ocr: this.config.auto_ocr,
        documents_processed: data?.length || 0,
        last_processed: data?.[0]?.created_at || null,
      }
    } catch (error) {
      console.error('Error getting OCR status:', error)
      return {
        enabled: this.config.enabled,
        connected: false,
        auto_ocr: this.config.auto_ocr,
        documents_processed: 0,
        last_processed: null,
      }
    }
  }
}

export const ocrService = new OCRService()
