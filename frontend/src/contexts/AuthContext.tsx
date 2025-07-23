import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Keycloak from 'keycloak-js';

interface UserInfo {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  familyId?: number;
}

interface AuthContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  user: UserInfo | null;
  loading: boolean;
  token: string | null;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: 'gabifamilydocs',
  clientId: 'gabifamilydocs-client',
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const keycloakInstance = new Keycloak(keycloakConfig);
        
        const authenticated = await keycloakInstance.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          checkLoginIframe: false,
        });

        setKeycloak(keycloakInstance);
        setAuthenticated(authenticated);

        if (authenticated && keycloakInstance.token) {
          setToken(keycloakInstance.token);
          
          // Carregar informações do usuário
          const userInfo = await keycloakInstance.loadUserInfo();
          const tokenParsed = keycloakInstance.tokenParsed;
          
          setUser({
            id: keycloakInstance.subject || '',
            username: tokenParsed?.preferred_username || '',
            email: tokenParsed?.email || '',
            firstName: tokenParsed?.given_name,
            lastName: tokenParsed?.family_name,
            roles: tokenParsed?.realm_access?.roles || [],
          });
        }

        // Configurar refresh automático do token
        keycloakInstance.onTokenExpired = () => {
          keycloakInstance.updateToken(70).then((refreshed) => {
            if (refreshed) {
              setToken(keycloakInstance.token);
            }
          }).catch(() => {
            keycloakInstance.login();
          });
        };

      } catch (error) {
        console.error('Erro ao inicializar Keycloak:', error);
      } finally {
        setLoading(false);
      }
    };

    initKeycloak();
  }, []);

  const login = () => {
    if (keycloak) {
      keycloak.login();
    }
  };

  const logout = () => {
    if (keycloak) {
      keycloak.logout();
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const value: AuthContextType = {
    keycloak,
    authenticated,
    user,
    loading,
    token,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
