import React from 'react';
import Layout from '../../components/Layout/Layout';
import BillingDashboard from '../../components/Billing/BillingDashboard';

const BillingPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <BillingDashboard />
      </div>
    </Layout>
  );
};

export default BillingPage; 