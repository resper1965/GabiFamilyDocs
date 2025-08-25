# Development Setup - Gabi Family Docs

## BMad Framework - Greenfield Fullstack

### CONTEXT7_QUERY
```yaml
CONTEXT7_QUERY:
  activity: development_setup
  scope: gabi_family_docs
  complexity: alta
  priority: crítica
  library_ids: [bmad-framework-001, bmad-core-001, bmad-agents-001]
  constraints: [mobile-first, security, performance, context7-integration]
  output_range: 3000-6000
  agent: developer
  timestamp: 2025-01-21 17:30:00
  
  QUERY_TEXT: |
    Setup de desenvolvimento para Gabi Family Docs:
    - Configuração de ambiente baseada em Context7
    - Estrutura de projeto com bibliotecas recomendadas
    - Setup de ferramentas de desenvolvimento
    - Configuração de banco de dados
    - Implementação inicial do código
```

## 1. Bibliotecas Context7 Identificadas

### Frontend (React Native)
- **React Native**: `/discord/react-native` (Trust Score: 9.2)
- **React Navigation**: `/wix/react-native-navigation` (Trust Score: 9.1)
- **React Native Firebase**: `/invertase/react-native-firebase` (Trust Score: 10)
- **React Native Reusables**: `/founded-labs/react-native-reusables` (Trust Score: 6.4)

### Backend (Node.js/Express)
- **Express.js**: `/expressjs/express` (Trust Score: 9.0)
- **Express Validator**: `/express-validator/express-validator` (Trust Score: 7.1)
- **Express Session**: `/expressjs/session` (Trust Score: 9.0)
- **Express CORS**: `/expressjs/cors` (Trust Score: 9.0)

### Database (PostgreSQL)
- **Node-Postgres**: `/brianc/node-postgres` (Trust Score: 9.5)
- **PostgreSQL**: `/postgres/postgres` (Trust Score: 8.4)
- **PostgreSQL Documentation**: `/websites/www_postgresql_org-docs` (Trust Score: 7.5)

## 2. Estrutura do Projeto

### Estrutura de Diretórios
```
gabi-family-docs/
├── mobile/                          # React Native App
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   ├── android/
│   ├── ios/
│   ├── package.json
│   └── metro.config.js
├── backend/                         # Express.js API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── config/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── shared/                          # Código compartilhado
│   ├── types/
│   ├── constants/
│   └── utils/
├── docs/                           # Documentação
├── scripts/                        # Scripts de automação
├── docker/                         # Configurações Docker
├── .github/                        # GitHub Actions
├── package.json
└── README.md
```

## 3. Setup do Ambiente de Desenvolvimento

### Pré-requisitos
```bash
# Node.js 20.x
node --version  # v20.x.x

# npm 9.x
npm --version   # 9.x.x

# React Native CLI
npm install -g @react-native-community/cli

# Expo CLI (opcional)
npm install -g @expo/cli

# PostgreSQL 15
psql --version  # 15.x

# Docker (opcional)
docker --version

# Git
git --version
```

### Configuração Inicial
```bash
# Clone do repositório
git clone https://github.com/resper1965/GabiFamilyDocs.git
cd GabiFamilyDocs

# Instalação de dependências
npm install

# Setup do backend
cd backend
npm install

# Setup do mobile
cd ../mobile
npm install

# Setup do banco de dados
cd ../backend
npm run db:setup
```

## 4. Configuração do Backend (Express.js)

### package.json (Backend)
```json
{
  "name": "gabi-family-docs-backend",
  "version": "1.0.0",
  "description": "Backend API para Gabi Family Docs",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "knex migrate:latest",
    "db:seed": "knex seed:run",
    "db:setup": "npm run db:migrate && npm run db:seed"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "express-session": "^1.17.3",
    "cors": "^2.8.5",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "helmet": "^7.1.0",
    "rate-limiter-flexible": "^3.0.8",
    "redis": "^4.6.10",
    "aws-sdk": "^2.1490.0",
    "nodemailer": "^6.9.7",
    "crypto": "^1.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/cors": "^2.8.17",
    "@types/express-session": "^1.17.10",
    "typescript": "^5.3.3",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.1",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.16",
    "knex": "^3.0.1",
    "sqlite3": "^5.1.6"
  }
}
```

### Configuração do Express (src/index.ts)
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import { rateLimit } from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import familyRoutes from './routes/family';
import alertRoutes from './routes/alerts';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = config.port || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

### Configuração do Banco de Dados (src/config/database.ts)
```typescript
import { Pool, PoolConfig } from 'pg';
import { config } from './index';

const dbConfig: PoolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
  ssl: config.isProduction ? { rejectUnauthorized: false } : false
};

export const pool = new Pool(dbConfig);

// Handle pool events
pool.on('connect', (client) => {
  logger.info('New client connected to database');
});

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = () => {
  return pool.connect();
};
```

## 5. Configuração do Mobile (React Native)

### package.json (Mobile)
```json
{
  "name": "gabi-family-docs-mobile",
  "version": "1.0.0",
  "description": "Mobile app para Gabi Family Docs",
  "main": "index.js",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.7",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/stack": "^6.3.20",
    "react-native-screens": "^3.27.0",
    "react-native-safe-area-context": "^4.7.4",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-reanimated": "^3.6.1",
    "@react-native-async-storage/async-storage": "^1.19.5",
    "react-native-document-picker": "^9.0.1",
    "react-native-pdf": "^6.7.4",
    "react-native-fs": "^2.20.0",
    "react-native-vector-icons": "^10.0.2",
    "react-native-push-notification": "^8.1.1",
    "react-native-netinfo": "^11.2.1",
    "axios": "^1.6.2",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.48.2",
    "react-native-elements": "^3.4.3",
    "react-native-vector-icons": "^10.0.2"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/runtime": "^7.20.0",
    "@react-native/eslint-config": "^0.72.2",
    "@react-native/metro-config": "^0.72.11",
    "@tsconfig/react-native": "^3.0.0",
    "@types/react": "^18.0.24",
    "@types/react-test-renderer": "^18.0.0",
    "babel-jest": "^29.2.1",
    "eslint": "^8.19.0",
    "jest": "^29.2.1",
    "metro-react-native-babel-preset": "0.76.8",
    "prettier": "^2.4.1",
    "react-test-renderer": "18.2.0",
    "typescript": "4.8.4"
  }
}
```

### App.tsx (Mobile)
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from 'react-native-elements';

import { AuthProvider } from './src/contexts/AuthContext';
import { DocumentProvider } from './src/contexts/DocumentContext';
import { AlertProvider } from './src/contexts/AlertContext';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/main/DashboardScreen';
import DocumentsScreen from './src/screens/main/DocumentsScreen';
import AlertsScreen from './src/screens/main/AlertsScreen';
import FamilyScreen from './src/screens/main/FamilyScreen';
import SettingsScreen from './src/screens/main/SettingsScreen';

import { theme } from './src/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Documents" component={DocumentsScreen} />
    <Tab.Screen name="Alerts" component={AlertsScreen} />
    <Tab.Screen name="Family" component={FamilyScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <DocumentProvider>
              <AlertProvider>
                <NavigationContainer>
                  <Stack.Navigator initialRouteName="Login">
                    <Stack.Screen 
                      name="Login" 
                      component={LoginScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                      name="Register" 
                      component={RegisterScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                      name="Main" 
                      component={MainTabs}
                      options={{ headerShown: false }}
                    />
                  </Stack.Navigator>
                </NavigationContainer>
              </AlertProvider>
            </DocumentProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
```

## 6. Configuração do Banco de Dados

### Schema SQL (database/schema.sql)
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Families table
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'document',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    expiration_date DATE,
    is_encrypted BOOLEAN DEFAULT true,
    encryption_key_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document permissions table
CREATE TABLE document_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permissions VARCHAR(50)[] DEFAULT ARRAY['read'],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, user_id)
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Family invitations table
CREATE TABLE family_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_documents_family_id ON documents(family_id);
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_expiration_date ON documents(expiration_date);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_document_id ON alerts(document_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_audit_logs_family_id ON audit_logs(family_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## 7. Scripts de Automação

### package.json (Root)
```json
{
  "name": "gabi-family-docs",
  "version": "1.0.0",
  "description": "Sistema de gestão de documentos familiares",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:mobile\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:mobile": "cd mobile && npm start",
    "build": "npm run build:backend && npm run build:mobile",
    "build:backend": "cd backend && npm run build",
    "build:mobile": "cd mobile && npm run build",
    "test": "npm run test:backend && npm run test:mobile",
    "test:backend": "cd backend && npm test",
    "test:mobile": "cd mobile && npm test",
    "lint": "npm run lint:backend && npm run lint:mobile",
    "lint:backend": "cd backend && npm run lint",
    "lint:mobile": "cd mobile && npm run lint",
    "db:setup": "cd backend && npm run db:setup",
    "db:migrate": "cd backend && npm run db:migrate",
    "db:seed": "cd backend && npm run db:seed",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:build": "docker-compose build"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  }
}
```

### Docker Compose (docker-compose.yml)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: gabi_family_docs
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/gabi_family_docs
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

## 8. Próximos Passos

### Imediatos (Esta Semana)
1. **Setup do ambiente de desenvolvimento**
2. **Configuração do banco de dados**
3. **Implementação da autenticação básica**
4. **Criação da estrutura de componentes**

### Curto Prazo (Próximas 2 Semanas)
1. **Implementação do CRUD de documentos**
2. **Sistema de upload de arquivos**
3. **Interface mobile básica**
4. **Sistema de alertas simples**

### Médio Prazo (Próximos 2 Meses)
1. **MVP completo**
2. **Testes de integração**
3. **Deploy de produção**
4. **Monitoramento e otimizações**

---

**Responsável**: BMad Developer + Context7
**Data**: 2025-01-21
**Versão**: 1.0.0
