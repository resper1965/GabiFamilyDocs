# Technical Preferences - Gabi Family Docs

## Technology Stack Preferences

### Frontend Framework
- **Primary**: React Native with Expo
- **Language**: TypeScript (strict mode)
- **State Management**: Context API + useReducer
- **Navigation**: Expo Router
- **UI Library**: React Native Paper
- **Icons**: Heroicons (thin stroke, monochromatic)

### Backend & Database
- **Backend**: Supabase (BaaS)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth + MFA
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### Development Tools
- **Package Manager**: npm
- **Testing**: Jest + React Native Testing Library
- **Performance**: @shopify/react-native-performance
- **Animations**: react-native-reanimated
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict

### Security Preferences
- **Encryption**: AES-256 for sensitive data
- **Storage**: Expo SecureStore for secrets
- **Authentication**: JWT + MFA
- **Input Validation**: Strict validation on all inputs
- **HTTPS**: Always required

### Performance Preferences
- **Bundle Size**: Optimize for mobile
- **Loading**: Lazy loading for components
- **Caching**: LRU cache strategy
- **Images**: Automatic optimization
- **Memory**: Efficient memory management

### Code Quality Preferences
- **Architecture**: MVVM pattern
- **Design Patterns**: Singleton, Factory, Observer, Repository
- **Error Handling**: Comprehensive error boundaries
- **Logging**: Structured logging with levels
- **Documentation**: JSDoc for all functions

### Testing Preferences
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths
- **E2E Tests**: User journeys
- **Test Data**: Factory pattern
- **Mocks**: Comprehensive mocking

### UI/UX Preferences
- **Design System**: Montserrat font family
- **Colors**: n.secops blue (#00ade8) + grays
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive**: Mobile-first design
- **Animations**: Smooth 60fps animations

### Deployment Preferences
- **CI/CD**: GitHub Actions
- **Environment**: Docker containers
- **Monitoring**: Performance + error tracking
- **Backup**: Automated daily backups
- **Rollback**: Quick rollback capability

### Documentation Preferences
- **Format**: Markdown
- **Language**: Portuguese (pt-BR)
- **Structure**: Clear hierarchy
- **Examples**: Code examples for all APIs
- **Diagrams**: Mermaid diagrams

### Project Structure Preferences
- **Organization**: Feature-based folders
- **Naming**: Clear, descriptive names
- **Separation**: Clear separation of concerns
- **Reusability**: Component composition
- **Scalability**: Easy to extend

### Quality Gates Preferences
- **Risk Threshold**: 6 (medium risk)
- **NFR Threshold**: 7 (high quality)
- **Test Coverage**: 80% minimum
- **Performance**: < 3s response time
- **Security**: 0 critical vulnerabilities

### Context7 Integration Preferences
- **Libraries**: Always use Context7 recommendations
- **Documentation**: Fetch latest docs
- **Examples**: Use official examples
- **Best Practices**: Follow library guidelines
- **Updates**: Stay current with versions
