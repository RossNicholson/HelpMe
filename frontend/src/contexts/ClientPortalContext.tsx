import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Client {
  id: number;
  name: string;
  email: string;
  organization_id: number;
}

interface ClientPortalContextType {
  sessionToken: string | null;
  client: Client | null;
  isAuthenticated: boolean;
  login: (sessionToken: string, client: Client) => void;
  logout: () => void;
  loading: boolean;
}

const ClientPortalContext = createContext<ClientPortalContextType | undefined>(undefined);

interface ClientPortalProviderProps {
  children: ReactNode;
}

export const ClientPortalProvider: React.FC<ClientPortalProviderProps> = ({ children }) => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedSessionToken = localStorage.getItem('clientSessionToken');
    const storedClient = localStorage.getItem('clientData');

    if (storedSessionToken && storedClient) {
      try {
        const clientData = JSON.parse(storedClient);
        setSessionToken(storedSessionToken);
        setClient(clientData);
      } catch (error) {
        console.error('Error parsing stored client data:', error);
        localStorage.removeItem('clientSessionToken');
        localStorage.removeItem('clientData');
      }
    }
    
    setLoading(false);
  }, []);

  const login = (newSessionToken: string, clientData: Client) => {
    setSessionToken(newSessionToken);
    setClient(clientData);
    localStorage.setItem('clientSessionToken', newSessionToken);
    localStorage.setItem('clientData', JSON.stringify(clientData));
  };

  const logout = () => {
    setSessionToken(null);
    setClient(null);
    localStorage.removeItem('clientSessionToken');
    localStorage.removeItem('clientData');
  };

  const value: ClientPortalContextType = {
    sessionToken,
    client,
    isAuthenticated: !!sessionToken && !!client,
    login,
    logout,
    loading
  };

  return (
    <ClientPortalContext.Provider value={value}>
      {children}
    </ClientPortalContext.Provider>
  );
};

export const useClientPortal = (): ClientPortalContextType => {
  const context = useContext(ClientPortalContext);
  if (context === undefined) {
    throw new Error('useClientPortal must be used within a ClientPortalProvider');
  }
  return context;
}; 