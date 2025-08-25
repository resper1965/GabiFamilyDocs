import { supabase } from '../lib/supabase'

export class StorageService {
  // Upload de arquivo para bucket específico
  async uploadFile(bucket: string, path: string, file: File | Blob, options?: any) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          ...options
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro no upload de arquivo:', error)
      throw error
    }
  }

  // Download de arquivo
  async downloadFile(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro no download de arquivo:', error)
      throw error
    }
  }

  // Obter URL pública
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  }

  // Obter URL assinada (para arquivos privados)
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) throw error
      return data.signedUrl
    } catch (error) {
      console.error('Erro ao gerar URL assinada:', error)
      throw error
    }
  }

  // Listar arquivos em um bucket
  async listFiles(bucket: string, path?: string, options?: any) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path || '', options)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao listar arquivos:', error)
      throw error
    }
  }

  // Deletar arquivo
  async deleteFile(bucket: string, path: string) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      throw error
    }
  }

  // Deletar múltiplos arquivos
  async deleteFiles(bucket: string, paths: string[]) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar arquivos:', error)
      throw error
    }
  }

  // Mover arquivo
  async moveFile(bucket: string, fromPath: string, toPath: string) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao mover arquivo:', error)
      throw error
    }
  }

  // Copiar arquivo
  async copyFile(bucket: string, fromPath: string, toPath: string) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .copy(fromPath, toPath)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao copiar arquivo:', error)
      throw error
    }
  }

  // Obter informações do arquivo
  async getFileInfo(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        })

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Erro ao obter informações do arquivo:', error)
      throw error
    }
  }

  // Upload de imagem com redimensionamento
  async uploadImage(bucket: string, path: string, file: File, options?: any) {
    try {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem')
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          ...options
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro no upload de imagem:', error)
      throw error
    }
  }

  // Upload de documento
  async uploadDocument(bucket: string, path: string, file: File, options?: any) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          ...options
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro no upload de documento:', error)
      throw error
    }
  }

  // Criar bucket
  async createBucket(name: string, options?: any) {
    try {
      const { data, error } = await supabase.storage
        .createBucket(name, {
          public: false,
          allowedMimeTypes: null,
          fileSizeLimit: null,
          ...options
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar bucket:', error)
      throw error
    }
  }

  // Deletar bucket
  async deleteBucket(name: string) {
    try {
      const { error } = await supabase.storage
        .deleteBucket(name)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar bucket:', error)
      throw error
    }
  }

  // Listar buckets
  async listBuckets() {
    try {
      const { data, error } = await supabase.storage
        .listBuckets()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao listar buckets:', error)
      throw error
    }
  }

  // Obter estatísticas do bucket
  async getBucketStats(bucket: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 })

      if (error) throw error

      const stats = {
        totalFiles: data.length,
        totalSize: data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0),
        fileTypes: data.reduce((acc, file) => {
          const type = file.metadata?.mimetype || 'unknown'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      return stats
    } catch (error) {
      console.error('Erro ao obter estatísticas do bucket:', error)
      throw error
    }
  }

  // Verificar se arquivo existe
  async fileExists(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        })

      if (error) throw error
      return data.length > 0
    } catch (error) {
      console.error('Erro ao verificar existência do arquivo:', error)
      return false
    }
  }

  // Obter tamanho do arquivo
  async getFileSize(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        })

      if (error) throw error
      return data[0]?.metadata?.size || 0
    } catch (error) {
      console.error('Erro ao obter tamanho do arquivo:', error)
      throw error
    }
  }

  // Limpar arquivos antigos
  async cleanupOldFiles(bucket: string, daysOld: number = 30) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 })

      if (error) throw error

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const oldFiles = data.filter(file => {
        const createdAt = new Date(file.created_at)
        return createdAt < cutoffDate
      })

      if (oldFiles.length > 0) {
        const paths = oldFiles.map(file => file.name)
        await this.deleteFiles(bucket, paths)
      }

      return { deleted: oldFiles.length }
    } catch (error) {
      console.error('Erro ao limpar arquivos antigos:', error)
      throw error
    }
  }
}

export const storageService = new StorageService()
