import React from 'react';
import ClientLogin from '../../components/ClientPortal/ClientLogin';

interface ClientPortalLoginPageProps {
  onLogin: (sessionToken: string, client: any) => void;
}

const ClientPortalLoginPage: React.FC<ClientPortalLoginPageProps> = ({ onLogin }) => {
  return <ClientLogin onLogin={onLogin} />;
};

export default ClientPortalLoginPage; 