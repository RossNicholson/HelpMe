import React from 'react';
import SMSSettings from '../../components/SMS/SMSSettings';

const SMSPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SMS Notifications</h1>
        <p className="text-gray-600 mt-2">
          Configure SMS provider settings and manage notification templates
        </p>
      </div>
      
      <SMSSettings />
    </div>
  );
};

export default SMSPage; 