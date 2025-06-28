import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

interface SMSSettings {
  id?: number;
  provider: 'twilio' | 'aws_sns';
  account_sid?: string;
  auth_token?: string;
  from_number?: string;
  access_key_id?: string;
  secret_access_key?: string;
  region?: string;
  enabled: boolean;
  provider_config?: any;
}

interface SMSTemplate {
  id?: number;
  name: string;
  type: string;
  template: string;
  active: boolean;
  variables: string[];
}

const SMSSettings: React.FC = () => {
  const [settings, setSettings] = useState<SMSSettings>({
    provider: 'twilio',
    enabled: false
  });
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const [testing, setTesting] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/sms/settings');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load SMS settings:', error);
      toast.error('Failed to load SMS settings');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/sms/templates');
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load SMS templates:', error);
      toast.error('Failed to load SMS templates');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await api.put('/sms/settings', settings);
      if (response.data.success) {
        toast.success('SMS settings saved successfully');
        setSettings(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to save SMS settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save SMS settings');
    } finally {
      setSaving(false);
    }
  };

  const testSettings = async () => {
    if (!testNumber) {
      toast.error('Please enter a test phone number');
      return;
    }

    setTesting(true);
    try {
      const response = await api.post('/sms/settings/test', { test_number: testNumber });
      if (response.data.success) {
        toast.success('Test SMS sent successfully!');
      } else {
        toast.error('Failed to send test SMS');
      }
    } catch (error: any) {
      console.error('Failed to send test SMS:', error);
      toast.error(error.response?.data?.message || 'Failed to send test SMS');
    } finally {
      setTesting(false);
    }
  };

  const saveTemplate = async (template: SMSTemplate) => {
    try {
      const response = await api.post('/sms/templates', template);
      if (response.data.success) {
        toast.success('SMS template saved successfully');
        setEditingTemplate(null);
        loadTemplates();
      }
    } catch (error: any) {
      console.error('Failed to save SMS template:', error);
      toast.error(error.response?.data?.message || 'Failed to save SMS template');
    }
  };

  const deleteTemplate = async (templateId: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const response = await api.delete(`/sms/templates/${templateId}`);
        if (response.data.success) {
          toast.success('SMS template deleted successfully');
          loadTemplates();
        }
      } catch (error: any) {
        console.error('Failed to delete SMS template:', error);
        toast.error(error.response?.data?.message || 'Failed to delete SMS template');
      }
    }
  };

  const renderProviderFields = () => {
    if (settings.provider === 'twilio') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account SID
              </label>
              <input
                type="text"
                value={settings.account_sid || ''}
                onChange={(e) => setSettings({ ...settings, account_sid: e.target.value })}
                placeholder="Enter Twilio Account SID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auth Token
              </label>
              <input
                type="password"
                value={settings.auth_token || ''}
                onChange={(e) => setSettings({ ...settings, auth_token: e.target.value })}
                placeholder="Enter Twilio Auth Token"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Number
            </label>
            <input
              type="text"
              value={settings.from_number || ''}
              onChange={(e) => setSettings({ ...settings, from_number: e.target.value })}
              placeholder="Enter Twilio phone number (e.g., +1234567890)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      );
    } else if (settings.provider === 'aws_sns') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Key ID
              </label>
              <input
                type="text"
                value={settings.access_key_id || ''}
                onChange={(e) => setSettings({ ...settings, access_key_id: e.target.value })}
                placeholder="Enter AWS Access Key ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Access Key
              </label>
              <input
                type="password"
                value={settings.secret_access_key || ''}
                onChange={(e) => setSettings({ ...settings, secret_access_key: e.target.value })}
                placeholder="Enter AWS Secret Access Key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <input
                type="text"
                value={settings.region || 'us-east-1'}
                onChange={(e) => setSettings({ ...settings, region: e.target.value })}
                placeholder="Enter AWS region"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Number
              </label>
              <input
                type="text"
                value={settings.from_number || ''}
                onChange={(e) => setSettings({ ...settings, from_number: e.target.value })}
                placeholder="Enter AWS SNS phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SMS Provider Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">SMS Provider Configuration</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMS Provider
              </label>
              <select
                value={settings.provider}
                onChange={(e) => setSettings({ ...settings, provider: e.target.value as 'twilio' | 'aws_sns' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="twilio">Twilio</option>
                <option value="aws_sns">AWS SNS</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                Enable SMS Notifications
              </label>
            </div>
          </div>

          {renderProviderFields()}

          <div className="flex items-center space-x-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="Test phone number"
                className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={testSettings}
                disabled={testing || !settings.enabled}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? 'Sending...' : 'Test SMS'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Templates */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">SMS Templates</h2>
            <button
              onClick={() => setEditingTemplate({ name: '', type: '', template: '', active: true, variables: [] })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Template
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{template.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {template.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => template.id && deleteTemplate(template.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{template.template}</p>
                {template.variables && template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <span key={variable} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        {variable}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Template Editor Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingTemplate.id ? 'Edit Template' : 'Add Template'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="Enter template name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Type
                </label>
                <select
                  value={editingTemplate.type}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="ticket_created">Ticket Created</option>
                  <option value="ticket_updated">Ticket Updated</option>
                  <option value="sla_breach_warning">SLA Breach Warning</option>
                  <option value="sla_breached">SLA Breached</option>
                  <option value="escalation">Escalation</option>
                  <option value="client_ticket_update">Client Ticket Update</option>
                  <option value="time_entry_reminder">Time Entry Reminder</option>
                  <option value="invoice_ready">Invoice Ready</option>
                  <option value="payment_reminder">Payment Reminder</option>
                  <option value="system_alert">System Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Content
                </label>
                <textarea
                  className="w-full h-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingTemplate.template}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, template: e.target.value })}
                  placeholder="Enter template content. Use {{variable}} for dynamic values."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editingTemplate.active}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveTemplate(editingTemplate)}
                  disabled={!editingTemplate.name || !editingTemplate.type || !editingTemplate.template}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSSettings; 