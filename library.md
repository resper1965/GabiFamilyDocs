# Context7 Library IDs - Gabi Family Docs

## Core Libraries

### Supabase
- **ID**: `/supabase/supabase`
- **Description**: Postgres development platform with authentication, auto-generated APIs, functions, and file storage
- **Trust Score**: 10
- **Code Snippets**: 4759
- **Latest Features**: 
  - Row Level Security (RLS) policies
  - Realtime subscriptions with authorization
  - Edge Functions with S3 storage
  - Storage with signed URLs
  - Authentication with PKCE flow
  - Database functions and views

### Ollama
- **ID**: `/ollama/ollama`
- **Description**: Tool to run and manage large language models locally
- **Trust Score**: 7.5
- **Code Snippets**: 386
- **Latest Features**:
  - Chat completions with OpenAI compatibility
  - Multimodal support (text + images)
  - Structured output parsing
  - Embeddings generation
  - Model management (create, list, delete)
  - Streaming responses

### React Native
- **ID**: `/discord/react-native`
- **Description**: Build mobile apps with React using native UI controls
- **Trust Score**: 9.2
- **Code Snippets**: 269
- **Latest Features**:
  - Fabric rendering system
  - New architecture components
  - Platform testing framework
  - Hermes JavaScript engine
  - Native module development

### Expo
- **ID**: `/expo/expo`
- **Description**: Open-source framework for making universal native apps with React
- **Trust Score**: 10
- **Code Snippets**: 4682
- **Latest Features**:
  - Expo Router for navigation
  - Development builds
  - EAS Build for production
  - Expo SDK 50+
  - Universal native apps

### Paperless-ngx
- **ID**: `/paperless-ngx/paperless-ngx`
- **Description**: Community-supported supercharged version of paperless for scanning, indexing and archiving documents
- **Trust Score**: 7.7
- **Code Snippets**: 443
- **Latest Features**:
  - OCR processing
  - Document tagging
  - Search capabilities
  - API integration
  - Docker deployment

## Additional Libraries

### Supabase UI
- **ID**: `/supabase/ui`
- **Description**: React UI library with pre-built components for Supabase
- **Trust Score**: 9.5
- **Code Snippets**: 15

### Supabase JS
- **ID**: `/supabase/supabase-js`
- **Description**: Isomorphic JavaScript client for Supabase
- **Trust Score**: 9.5
- **Code Snippets**: 151

### Ollama Python
- **ID**: `/ollama/ollama-python`
- **Description**: Python library for Ollama integration
- **Trust Score**: 7.5
- **Code Snippets**: 35

### Ollama JS
- **ID**: `/ollama/ollama-js`
- **Description**: JavaScript library for Ollama integration
- **Trust Score**: 7.5
- **Code Snippets**: 14

## Integration Architecture

### Gabi Family Docs Stack
```
📱 React Native + Expo (Frontend)
    ↓
🔗 Supabase (Backend + Auth + Storage + Realtime)
    ↓
🤖 Ollama (Local AI Chatbot)
    ↓
📄 Paperless-ngx (GED Integration)
```

### Key Features Implemented
- **Mobile-First**: React Native with Expo Router
- **Backend as a Service**: Supabase for all backend needs
- **Local AI**: Ollama for privacy-focused document analysis
- **Document Management**: Paperless-ngx as GED system
- **Realtime**: Live updates and notifications
- **Storage**: File management with RLS policies
- **Authentication**: Multi-factor and social login
- **Context7 Integration**: All libraries compatible with Context7 framework

## Supabase Features Used

### Authentication
- Email/Password authentication
- Social login providers
- Multi-factor authentication (MFA)
- Row Level Security (RLS)
- Session management
- Password reset flows

### Database
- PostgreSQL with full-text search
- Database functions and views
- Real-time subscriptions
- Row Level Security policies
- Foreign key relationships
- JSONB data types

### Storage
- File upload/download
- Public and private buckets
- Signed URLs for secure access
- Image processing
- File metadata management
- Automatic cleanup

### Realtime
- Live database changes
- Broadcast messages
- Presence tracking
- Chat functionality
- Notifications
- Channel management

### Edge Functions
- Serverless functions
- S3-compatible storage
- Background tasks
- WebSocket support
- Custom API endpoints

## Ollama Features Used

### Chat Completions
- OpenAI-compatible API
- Streaming responses
- Context management
- Temperature control
- Token limits

### Document Analysis
- Text extraction
- Content summarization
- Intent classification
- Information extraction
- Document generation

### Multimodal Support
- Image analysis
- Text + image processing
- Document understanding
- Visual content extraction

## React Native Features Used

### Components
- Fabric rendering system
- Native UI components
- Platform-specific code
- Performance optimization
- Accessibility support

### Navigation
- Expo Router
- Deep linking
- Tab navigation
- Stack navigation
- Modal presentations

### Development
- Hot reloading
- Debug tools
- Performance monitoring
- Platform testing
- Build optimization

## Usage Notes
- All libraries are compatible with Context7 framework
- Trust scores indicate reliability and community adoption
- Code snippets provide practical implementation examples
- Integration designed for family document management
- Real-time features for collaborative editing
- Privacy-focused AI processing with local models
- Scalable architecture for SaaS multitenancy

## Security Considerations
- Row Level Security (RLS) for data isolation
- JWT token management
- Secure file storage
- API rate limiting
- Input validation
- SQL injection prevention
- XSS protection

