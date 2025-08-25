import { supabase } from '../lib/supabase'
import { storageService } from './storage'

export class DocumentService {
  // Buscar documentos da família
  async getFamilyDocuments(familyId: string) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar documentos:', error)
      throw error
    }
  }

  // Buscar documentos com detalhes (usando view)
  async getDocumentsWithDetails(familyId: string) {
    try {
      const { data, error } = await supabase
        .from('documents_with_details')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar documentos com detalhes:', error)
      throw error
    }
  }

  // Buscar documentos por tipo
  async getDocumentsByType(familyId: string, documentType: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_documents_by_type', {
          doc_type: documentType,
          member_id: familyId
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar documentos por tipo:', error)
      throw error
    }
  }

  // Buscar documentos por texto (usando função)
  async searchDocuments(familyId: string, searchQuery: string) {
    try {
      const { data, error } = await supabase
        .rpc('search_documents', {
          search_query: searchQuery,
          member_id: familyId
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro na busca de documentos:', error)
      throw error
    }
  }

  // Upload de documento
  async uploadDocument(file: any, familyId: string, metadata: any) {
    try {
      // 1. Upload do arquivo para storage
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `${familyId}/${fileName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 2. Obter URL pública
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // 3. Inserir registro no banco
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          family_id: familyId,
          title: metadata.title || file.name,
          description: metadata.description,
          document_type: metadata.documentType || 'other',
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          content: metadata.content,
          tags: metadata.tags,
          metadata: metadata
        })
        .select()
        .single()

      if (dbError) throw dbError

      return {
        ...documentData,
        public_url: urlData.publicUrl
      }
    } catch (error) {
      console.error('Erro no upload de documento:', error)
      throw error
    }
  }

  // Atualizar documento
  async updateDocument(documentId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar documento:', error)
      throw error
    }
  }

  // Deletar documento
  async deleteDocument(documentId: string) {
    try {
      // 1. Buscar documento para obter file_path
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single()

      if (fetchError) throw fetchError

      // 2. Deletar arquivo do storage
      if (document.file_path) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([document.file_path])

        if (storageError) {
          console.warn('Erro ao deletar arquivo do storage:', storageError)
        }
      }

      // 3. Deletar registro do banco
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (dbError) throw dbError

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar documento:', error)
      throw error
    }
  }

  // Arquivar documento
  async archiveDocument(documentId: string) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          is_archived: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao arquivar documento:', error)
      throw error
    }
  }

  // Buscar categorias
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('name')

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      throw error
    }
  }

  // Adicionar tags ao documento
  async addTagsToDocument(documentId: string, tags: string[]) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          tags: tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao adicionar tags:', error)
      throw error
    }
  }

  // Buscar documentos por tags
  async getDocumentsByTags(familyId: string, tags: string[]) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_archived', false)
        .overlaps('tags', tags)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar documentos por tags:', error)
      throw error
    }
  }

  // Realtime subscription para documentos
  subscribeToDocuments(familyId: string, callback: (payload: any) => void) {
    return supabase
      .channel('documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `family_id=eq.${familyId}`
        },
        callback
      )
      .subscribe()
  }
}

export const documentService = new DocumentService()
