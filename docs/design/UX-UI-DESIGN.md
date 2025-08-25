# 🎨 **BMAD UX/UI DESIGNER - DESIGN SYSTEM E WIREFRAMES**

## 🎯 **RESPONSABILIDADE**
Design de interface, experiência do usuário e design system.

---

## 🎨 **DESIGN SYSTEM**

### **1. PALETA DE CORES**

#### **Cores Primárias**
```css
/* Azul Principal - n.secops */
--primary-blue: #00ade8;
--primary-blue-light: #33beee;
--primary-blue-dark: #0088b8;

/* Cinza Escuro - Elegante */
--dark-gray: #2c3e50;
--medium-gray: #34495e;
--light-gray: #ecf0f1;
```

#### **Cores Secundárias**
```css
/* Verde - Sucesso */
--success: #27ae60;
--success-light: #2ecc71;

/* Vermelho - Erro */
--error: #e74c3c;
--error-light: #ff6b6b;

/* Amarelo - Aviso */
--warning: #f39c12;
--warning-light: #f1c40f;

/* Branco e Preto */
--white: #ffffff;
--black: #000000;
```

#### **Cores de Fundo**
```css
/* Fundos */
--background-primary: #f8f9fa;
--background-secondary: #ffffff;
--background-dark: #2c3e50;

/* Superfícies */
--surface-primary: #ffffff;
--surface-secondary: #f8f9fa;
--surface-elevated: #ffffff;
```

### **2. TIPOGRAFIA**

#### **Fonte Principal**
```css
/* Montserrat - Elegante e moderna */
font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
```

#### **Hierarquia de Texto**
```css
/* Títulos */
--h1-size: 32px;
--h1-weight: 700;
--h1-line-height: 1.2;

--h2-size: 24px;
--h2-weight: 600;
--h2-line-height: 1.3;

--h3-size: 20px;
--h3-weight: 600;
--h3-line-height: 1.4;

/* Corpo de texto */
--body-large: 18px;
--body-medium: 16px;
--body-small: 14px;
--body-tiny: 12px;

/* Pesos */
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### **3. ESPAÇAMENTO**

#### **Sistema de Grid**
```css
/* Base de 8px */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;
--spacing-xxxl: 64px;
```

#### **Margens e Padding**
```css
/* Margens */
--margin-xs: 4px;
--margin-sm: 8px;
--margin-md: 16px;
--margin-lg: 24px;
--margin-xl: 32px;

/* Padding */
--padding-xs: 4px;
--padding-sm: 8px;
--padding-md: 16px;
--padding-lg: 24px;
--padding-xl: 32px;
```

### **4. COMPONENTES**

#### **Botões**
```css
/* Botão Primário */
.btn-primary {
  background: var(--primary-blue);
  color: var(--white);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-blue-dark);
  transform: translateY(-1px);
}

/* Botão Secundário */
.btn-secondary {
  background: transparent;
  color: var(--primary-blue);
  border: 2px solid var(--primary-blue);
  border-radius: 8px;
  padding: 10px 22px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--primary-blue);
  color: var(--white);
}
```

#### **Inputs**
```css
/* Campo de Texto */
.input-field {
  border: 2px solid var(--light-gray);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  transition: border-color 0.2s ease;
  background: var(--white);
}

.input-field:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 173, 232, 0.1);
}

/* Campo de Busca */
.search-input {
  border: 2px solid var(--light-gray);
  border-radius: 24px;
  padding: 12px 20px;
  padding-left: 48px;
  font-size: 16px;
  background: var(--white) url('search-icon.svg') no-repeat 16px center;
}
```

#### **Cards**
```css
/* Card de Documento */
.document-card {
  background: var(--white);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  border: 1px solid var(--light-gray);
}

.document-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* Card de Categoria */
.category-card {
  background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-light));
  color: var(--white);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.2s ease;
}

.category-card:hover {
  transform: scale(1.05);
}
```

### **5. ÍCONES**

#### **Heroicons - Elegantes e Minimalistas**
```css
/* Ícones principais */
.icon-size-sm: 16px;
.icon-size-md: 24px;
.icon-size-lg: 32px;
.icon-size-xl: 48px;

/* Cores dos ícones */
.icon-primary: var(--primary-blue);
.icon-secondary: var(--medium-gray);
.icon-success: var(--success);
.icon-error: var(--error);
.icon-warning: var(--warning);
```

---

## 📱 **WIREFRAMES E PROTÓTIPOS**

### **1. TELA DE LOGIN**

```
┌─────────────────────────────────────┐
│                                     │
│            📱 Gabi Family Docs      │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │                                 │ │
│  │        🔐 Entrar                │ │
│  │                                 │ │
│  │  📧 Email                       │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │                             │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                 │ │
│  │  🔒 Senha                       │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │                             │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                 │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │        ENTRAR               │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                 │ │
│  │  Esqueceu a senha?              │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### **2. DASHBOARD PRINCIPAL**

```
┌─────────────────────────────────────┐
│ 🔍 [Buscar documentos...]     👤 ⚙️ │
├─────────────────────────────────────┤
│                                     │
│  📊 Resumo                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ 📄 24   │ │ ⏰ 3    │ │ ✅ 21   │ │
│  │ Docs    │ │ Vencem  │ │ Ativos  │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│                                     │
│  📁 Categorias                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ 🆔 RG   │ │ 🛂 Pass │ │ 📋 Cont │ │
│  │   8     │ │   5     │ │   11    │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│                                     │
│  ⏰ Vencendo em Breve                │
│  ┌─────────────────────────────────┐ │
│  │ 📄 RG da Sabrina - 15 dias     │ │
│  │ 📄 Passaporte Louise - 7 dias  │ │
│  │ 📋 Contrato Casa - 30 dias     │ │
│  └─────────────────────────────────┘ │
│                                     │
│  📱 [🏠] [📁] [🔔] [👤]            │
└─────────────────────────────────────┘
```

### **3. LISTA DE DOCUMENTOS**

```
┌─────────────────────────────────────┐
│ ← Voltar    📁 Documentos      🔍 ⚙️ │
├─────────────────────────────────────┤
│                                     │
│  Filtros: [Todos] [RG] [Pass] [Cont]│
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 📄 RG da Sabrina               │ │
│  │ 📅 Vence em 15 dias            │ │
│  │ 🏷️ RG • 📍 Pessoal             │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 🛂 Passaporte Louise            │ │
│  │ 📅 Vence em 7 dias             │ │
│  │ 🏷️ Passaporte • 📍 Pessoal     │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 📋 Contrato Casa                │ │
│  │ 📅 Vence em 30 dias            │ │
│  │ 🏷️ Contrato • 📍 Imóvel        │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 📄 RG da Giovanna               │ │
│  │ ✅ Válido até 2026              │ │
│  │ 🏷️ RG • 📍 Pessoal             │ │
│  └─────────────────────────────────┘ │
│                                     │
│  📱 [🏠] [📁] [🔔] [👤]            │
└─────────────────────────────────────┘
```

### **4. VISUALIZADOR DE DOCUMENTO**

```
┌─────────────────────────────────────┐
│ ← Voltar    📄 RG da Sabrina   ⚙️ ⋮ │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐ │
│  │                                 │ │
│  │        [DOCUMENTO PDF]          │ │
│  │                                 │ │
│  │                                 │ │
│  │                                 │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                     │
│  📊 Informações                     │
│  ┌─────────────────────────────────┐ │
│  │ 📅 Vencimento: 15/02/2025      │ │
│  │ 🏷️ Categoria: RG               │ │
│  │ 📍 Local: Pessoal               │ │
│  │ 👤 Proprietário: Sabrina       │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ 📤 Comp │ │ 📱 Comp │ │ ⚠️ Aler │ │
│  │ artilhar│ │ artilhar│ │ tar     │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│                                     │
│  📱 [🏠] [📁] [🔔] [👤]            │
└─────────────────────────────────────┘
```

### **5. CONFIGURAÇÕES**

```
┌─────────────────────────────────────┐
│ ← Voltar    ⚙️ Configurações        │
├─────────────────────────────────────┤
│                                     │
│  👤 Perfil                          │
│  ┌─────────────────────────────────┐ │
│  │ 👤 Louise Silva                 │ │
│  │ 📧 louise@gabifamily.com        │ │
│  │ 📱 +55 11 99999-9999            │ │
│  └─────────────────────────────────┘ │
│                                     │
│  🔔 Notificações                    │
│  ┌─────────────────────────────────┐ │
│  │ 🔔 Push: ✅ Ativado             │ │
│  │ 📧 Email: ✅ Ativado            │ │
│  │ ⏰ Frequência: 7, 15, 30 dias   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  🔒 Segurança                       │
│  ┌─────────────────────────────────┐ │
│  │ 🔐 MFA: ✅ Ativado              │ │
│  │ 🔑 Alterar senha                │ │
│  │ 📱 Dispositivos conectados      │ │
│  └─────────────────────────────────┘ │
│                                     │
│  💾 Backup                          │
│  ┌─────────────────────────────────┐ │
│  │ 💾 Último backup: Hoje 14:30   │ │
│  │ 📊 Espaço usado: 2.4 GB        │ │
│  │ 🔄 Sincronização: ✅ Ativa      │ │
│  └─────────────────────────────────┘ │
│                                     │
│  📱 [🏠] [📁] [🔔] [👤]            │
└─────────────────────────────────────┘
```

---

## 🎯 **PRINCÍPIOS DE UX**

### **1. Simplicidade**
- Interface limpa e minimalista
- Foco no conteúdo principal
- Redução de distrações visuais

### **2. Consistência**
- Padrões visuais uniformes
- Comportamento previsível
- Navegação intuitiva

### **3. Acessibilidade**
- Contraste adequado (WCAG 2.1)
- Tamanhos de toque mínimos (44px)
- Suporte a leitores de tela

### **4. Responsividade**
- Adaptação a diferentes telas
- Orientação portrait e landscape
- Gestos nativos (swipe, pinch)

### **5. Performance Visual**
- Animações suaves (60fps)
- Carregamento progressivo
- Estados de loading claros

---

## 📱 **PADRÕES DE INTERAÇÃO**

### **1. Navegação**
- Tab bar inferior para seções principais
- Breadcrumbs para navegação hierárquica
- Gestos de swipe para navegação

### **2. Busca**
- Busca global acessível de qualquer tela
- Filtros rápidos por categoria
- Histórico de buscas

### **3. Upload**
- Drag & drop para arquivos
- Progresso visual do upload
- Validação em tempo real

### **4. Notificações**
- Toast messages para feedback
- Badges para contadores
- Pull-to-refresh para atualização

---

## 🎨 **ESTADOS VISUAIS**

### **1. Estados de Loading**
```css
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### **2. Estados de Erro**
```css
.error-state {
  background: var(--error-light);
  border: 1px solid var(--error);
  border-radius: 8px;
  padding: 16px;
  color: var(--error);
}
```

### **3. Estados de Sucesso**
```css
.success-state {
  background: var(--success-light);
  border: 1px solid var(--success);
  border-radius: 8px;
  padding: 16px;
  color: var(--success);
}
```

---

## 📊 **TESTES DE USABILIDADE**

### **1. Métricas de UX**
- **Tempo de Tarefa**: < 30 segundos para upload
- **Taxa de Erro**: < 5% em tarefas críticas
- **Satisfação**: NPS > 8
- **Eficiência**: < 3 cliques para acessar documento

### **2. Testes Planejados**
- Teste de usabilidade com família Gabi
- Teste de acessibilidade com usuários especiais
- Teste de performance em dispositivos antigos
- Teste de navegação por gestos

---

**Responsável**: BMad UX/UI Designer  
**Data**: 2025-01-21  
**Versão**: 1.0.0  
**Status**: ✅ **DESIGN SYSTEM CRIADO**
