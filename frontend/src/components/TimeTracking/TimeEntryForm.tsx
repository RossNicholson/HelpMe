import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Tooltip, QuestionMarkIcon } from '../../components/ui/tooltip';

interface TimeEntryFormProps {
  ticketId: string;
  onTimeEntryAdded: () => void;
  onCancel: () => void;
  editEntry?: any;
}

interface TimeEntryData {
  description: string;
  start_time: string;
  end_time: string;
  billable_rate: number;
  is_billable: boolean;
  activity_type: 'work' | 'research' | 'meeting' | 'travel' | 'other';
}

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  ticketId,
  onTimeEntryAdded,
  onCancel,
  editEntry
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingRates, setBillingRates] = useState<any[]>([]);
  const [formData, setFormData] = useState<TimeEntryData>({
    description: '',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date().toISOString().slice(0, 16),
    billable_rate: 0,
    is_billable: true,
    activity_type: 'work'
  });

  useEffect(() => {
    loadBillingRates();
    if (editEntry) {
      setFormData({
        description: editEntry.description,
        start_time: new Date(editEntry.start_time).toISOString().slice(0, 16),
        end_time: new Date(editEntry.end_time).toISOString().slice(0, 16),
        billable_rate: editEntry.billable_rate,
        is_billable: editEntry.is_billable,
        activity_type: editEntry.activity_type
      });
    }
  }, [editEntry]);

  const loadBillingRates = async () => {
    try {
      const response = await api.get('/time-tracking/billing-rates');
      setBillingRates(response.data.data);
      
      // Set default billing rate
      const defaultRate = response.data.data.find((rate: any) => rate.rate_type === 'default');
      if (defaultRate && !editEntry) {
        setFormData(prev => ({ ...prev, billable_rate: defaultRate.hourly_rate }));
      }
    } catch (error) {
      console.error('Error loading billing rates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editEntry) {
        await api.put(`/time-tracking/time-entries/${editEntry.id}`, formData);
      } else {
        await api.post('/time-tracking/time-entries', {
          ...formData,
          ticket_id: ticketId
        });
      }
      
      onTimeEntryAdded();
    } catch (error) {
      console.error('Error saving time entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    const start = new Date(formData.start_time);
    const end = new Date(formData.end_time);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours}h ${minutes}m`;
  };

  const calculateAmount = () => {
    const start = new Date(formData.start_time);
    const end = new Date(formData.end_time);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return (diffHours * formData.billable_rate).toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">
        {editEntry ? 'Edit Time Entry' : 'Add Time Entry'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <Tooltip content="Provide a detailed description of the work performed. This helps with billing, reporting, and future reference.">
              <QuestionMarkIcon />
            </Tooltip>
          </div>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe the work performed..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <Tooltip content="The exact time when you started working on this task. Use the datetime picker for accurate tracking.">
                <QuestionMarkIcon />
              </Tooltip>
            </div>
            <input
              type="datetime-local"
              required
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <Tooltip content="The exact time when you finished working on this task. Duration is automatically calculated.">
                <QuestionMarkIcon />
              </Tooltip>
            </div>
            <input
              type="datetime-local"
              required
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Type
              </label>
              <Tooltip content="Work: Direct client work. Research: Investigation and analysis. Meeting: Client or team meetings. Travel: Travel time to client sites. Other: Miscellaneous activities.">
                <QuestionMarkIcon />
              </Tooltip>
            </div>
            <select
              value={formData.activity_type}
              onChange={(e) => setFormData({ ...formData, activity_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="work">Work</option>
              <option value="research">Research</option>
              <option value="meeting">Meeting</option>
              <option value="travel">Travel</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Rate ($/hr)
              </label>
              <Tooltip content="The hourly rate that will be charged to the client for this time entry. Select from your configured billing rates.">
                <QuestionMarkIcon />
              </Tooltip>
            </div>
            <select
              value={formData.billable_rate}
              onChange={(e) => setFormData({ ...formData, billable_rate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {billingRates.map((rate) => (
                <option key={rate.id} value={rate.hourly_rate}>
                  ${rate.hourly_rate} - {rate.rate_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_billable}
                  onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Billable</span>
              </label>
              <Tooltip content="Check this box if this time should be billed to the client. Uncheck for internal work or non-billable activities.">
                <QuestionMarkIcon />
              </Tooltip>
            </div>
          </div>
        </div>

        {formData.start_time && formData.end_time && (
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Duration:</span>
                <span className="ml-2 text-gray-900">{calculateDuration()}</span>
              </div>
              {formData.is_billable && (
                <div>
                  <span className="font-medium text-gray-700">Amount:</span>
                  <span className="ml-2 text-gray-900">${calculateAmount()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (editEntry ? 'Update Entry' : 'Add Entry')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimeEntryForm; 