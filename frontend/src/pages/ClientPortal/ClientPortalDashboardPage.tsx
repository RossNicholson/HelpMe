import React from 'react';
import ClientPortalLayout from '../../components/ClientPortal/ClientPortalLayout';
import ClientDashboard from '../../components/ClientPortal/ClientDashboard';

interface ClientPortalDashboardPageProps {
  sessionToken: string;
  client: any;
  onLogout: () => void;
}

const ClientPortalDashboardPage: React.FC<ClientPortalDashboardPageProps> = ({
  sessionToken,
  client,
  onLogout
}) => {
  return (
    <ClientPortalLayout
      sessionToken={sessionToken}
      client={client}
      onLogout={onLogout}
    >
      <ClientDashboard sessionToken={sessionToken} client={client} />
    </ClientPortalLayout>
  );
};

export default ClientPortalDashboardPage; 