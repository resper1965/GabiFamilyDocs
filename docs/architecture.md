# System Architecture Document
# Gabi Family Docs

## 1. Architecture Overview

### 1.1 System Architecture Pattern
- **Pattern**: MVVM (Model-View-ViewModel)
- **Style**: Clean Architecture with layered approach
- **Platform**: Cross-platform mobile (iOS/Android)

### 1.2 High-Level Architecture
```
┌─────────────────────────────────────┐
│           Mobile App                │
│  ┌─────────────┐ ┌─────────────┐   │
│  │   UI Layer  │ │  ViewModel  │   │
│  │  (React)    │ │   (Hooks)   │   │
│  └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│         Service Layer               │
│  ┌─────────────┐ ┌─────────────┐   │
│  │   API       │ │   Local     │   │
│  │  Services   │ │  Services   │   │
│  └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│         Backend (Supabase)          │
│  ┌─────────────┐ ┌─────────────┐   │
│  │  Database   │ │   Storage   │   │
│  │ (PostgreSQL)│ │   (Files)   │   │
│  └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```

## 2. Technology Stack

### 2.1 Frontend Technologies
- **Framework**: React Native 0.72+
- **Language**: TypeScript 5.0+
- **Development Platform**: Expo SDK 49+
- **Navigation**: Expo Router
- **UI Library**: React Native Paper
- **State Management**: Context API + useReducer
- **Animations**: React Native Reanimated
- **Icons**: Heroicons

### 2.2 Backend Technologies
- **Platform**: Supabase
- **Database**: PostgreSQL 15+
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Edge Functions**: Supabase Edge Functions

### 2.3 Development Tools
- **Package Manager**: npm 9+
- **Testing**: Jest + React Native Testing Library
- **Performance**: @shopify/react-native-performance
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **CI/CD**: GitHub Actions

### 2.4 External Services
- **OCR**: Paperless-ngx API
- **AI**: Ollama (local) + OpenAI API
- **Notifications**: Expo Notifications
- **WhatsApp**: WhatsApp Business API
- **Monitoring**: Sentry

## 3. System Components

### 3.1 Core Components

#### 3.1.1 Authentication Module
```typescript
// Authentication Service
interface AuthService {
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
  enableMFA(): Promise<void>
  resetPassword(email: string): Promise<void>
}
```

#### 3.1.2 Document Management Module
```typescript
// Document Service
interface DocumentService {
  upload(file: File, metadata: DocumentMetadata): Promise<Document>
  download(id: string): Promise<File>
  search(query: string, filters: SearchFilters): Promise<Document[]>
  categorize(id: string, category: string): Promise<void>
}
```

#### 3.1.3 Notification Module
```typescript
// Notification Service
interface NotificationService {
  scheduleExpiryAlert(documentId: string, expiryDate: Date): Promise<void>
  sendPushNotification(userId: string, message: string): Promise<void>
  sendEmailNotification(userId: string, template: string): Promise<void>
}
```

#### 3.1.4 OCR Module
```typescript
// OCR Service
interface OCRService {
  extractText(image: File): Promise<string>
  processDocument(documentId: string): Promise<ProcessedDocument>
  searchContent(query: string): Promise<SearchResult[]>
}
```

### 3.2 Data Models

#### 3.2.1 User Model
```typescript
interface User {
  id: string
  email: string
  name: string
  familyId: string
  role: 'admin' | 'member'
  mfaEnabled: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### 3.2.2 Document Model
```typescript
interface Document {
  id: string
  name: string
  type: 'pdf' | 'image' | 'other'
  category: string
  familyId: string
  uploadedBy: string
  fileUrl: string
  fileSize: number
  expiryDate?: Date
  ocrText?: string
  metadata: DocumentMetadata
  createdAt: Date
  updatedAt: Date
}
```

#### 3.2.3 Family Model
```typescript
interface Family {
  id: string
  name: string
  members: User[]
  settings: FamilySettings
  createdAt: Date
  updatedAt: Date
}
```

## 4. Database Schema

### 4.1 Core Tables

#### 4.1.1 Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  family_id UUID REFERENCES families(id),
  role VARCHAR(20) DEFAULT 'member',
  mfa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.2 Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  category VARCHAR(100),
  family_id UUID REFERENCES families(id),
  uploaded_by UUID REFERENCES users(id),
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  expiry_date DATE,
  ocr_text TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.3 Families Table
```sql
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Security Policies

#### 4.2.1 Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Users can only access their family's data
CREATE POLICY "Users can view family members" ON users
  FOR SELECT USING (family_id = auth.jwt() ->> 'family_id');

-- Documents are family-scoped
CREATE POLICY "Family documents access" ON documents
  FOR ALL USING (family_id = auth.jwt() ->> 'family_id');
```

## 5. API Design

### 5.1 RESTful Endpoints

#### 5.1.1 Authentication
```
POST   /auth/login
POST   /auth/logout
POST   /auth/mfa/enable
POST   /auth/password/reset
```

#### 5.1.2 Documents
```
GET    /documents
POST   /documents
GET    /documents/:id
PUT    /documents/:id
DELETE /documents/:id
GET    /documents/search
```

#### 5.1.3 Notifications
```
GET    /notifications
POST   /notifications/schedule
PUT    /notifications/:id
DELETE /notifications/:id
```

### 5.2 Real-time Subscriptions
```typescript
// Document updates
supabase
  .channel('documents')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'documents' },
    (payload) => handleDocumentChange(payload)
  )
  .subscribe();
```

## 6. Security Architecture

### 6.1 Authentication & Authorization
- **JWT Tokens**: Short-lived access tokens
- **Refresh Tokens**: Long-lived refresh tokens
- **MFA**: TOTP-based multi-factor authentication
- **Session Management**: Secure session handling

### 6.2 Data Protection
- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Secure Storage**: Expo SecureStore for local secrets
- **Input Validation**: Strict validation on all inputs

### 6.3 Privacy & Compliance
- **Data Minimization**: Only collect necessary data
- **User Consent**: Explicit consent for data processing
- **Data Retention**: Configurable retention policies
- **Audit Logging**: Comprehensive access logs

## 7. Performance Architecture

### 7.1 Caching Strategy
- **Client Cache**: React Query for API responses
- **Image Cache**: Expo Image cache for document thumbnails
- **OCR Cache**: Redis for processed OCR results
- **CDN**: Supabase CDN for static assets

### 7.2 Optimization Techniques
- **Lazy Loading**: Components and images
- **Code Splitting**: Route-based splitting
- **Bundle Optimization**: Tree shaking and minification
- **Memory Management**: Efficient memory usage

### 7.3 Monitoring & Analytics
- **Performance Monitoring**: @shopify/react-native-performance
- **Error Tracking**: Sentry integration
- **User Analytics**: Privacy-compliant analytics
- **Health Checks**: Automated health monitoring

## 8. Deployment Architecture

### 8.1 Development Environment
- **Local Development**: Expo CLI + Supabase local
- **Testing**: Jest + Detox for E2E
- **Code Quality**: ESLint + Prettier + Husky

### 8.2 Production Environment
- **Mobile Apps**: App Store + Google Play
- **Backend**: Supabase production
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + Supabase monitoring

### 8.3 Infrastructure
- **Database**: Supabase PostgreSQL (managed)
- **Storage**: Supabase Storage (S3-compatible)
- **CDN**: Supabase CDN
- **Edge Functions**: Supabase Edge Functions

## 9. Scalability Considerations

### 9.1 Horizontal Scaling
- **Database**: Read replicas for heavy queries
- **Storage**: Multi-region storage
- **API**: Edge functions for global access

### 9.2 Vertical Scaling
- **Database**: Upgrade instance sizes
- **Storage**: Increase storage capacity
- **Processing**: Scale OCR processing

### 9.3 Multi-tenancy
- **Data Isolation**: Family-based data separation
- **Resource Limits**: Per-family quotas
- **Billing**: Usage-based billing model

## 10. Disaster Recovery

### 10.1 Backup Strategy
- **Database**: Daily automated backups
- **Storage**: Versioned object storage
- **Configuration**: Infrastructure as Code

### 10.2 Recovery Procedures
- **RTO**: 4 hours maximum
- **RPO**: 24 hours maximum
- **Testing**: Monthly recovery drills

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-01-21  
**Status**: ✅ **ARQUITETURA APROVADA**
