import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import TimeEntryForm from './TimeEntryForm';

interface TimeEntryListProps {
  ticketId: string;
}

interface TimeEntry {
  id: string;
  description: string;
  start_time: string;
  end_time: string;
  minutes_spent: number;
  billable_rate: number;
  is_billable: boolean;
  activity_type: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

const TimeEntryList: React.FC<TimeEntryListProps> = ({ ticketId }) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);

  useEffect(() => {
    loadTimeEntries();
  }, [ticketId]);

  const loadTimeEntries = async () => {
    try {
      const response = await api.get(`/time-tracking/tickets/${ticketId}/time-entries`);
      setTimeEntries(response.data.data);
    } catch (error) {
      console.error('Error loading time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeEntryAdded = () => {
    setShowForm(false);
    setEditingEntry(null);
    loadTimeEntries();
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return;
    }

    setDeletingEntry(entryId);
    try {
      await api.delete(`/time-tracking/time-entries/${entryId}`);
      loadTimeEntries();
    } catch (error) {
      console.error('Error deleting time entry:', error);
    } finally {
      setDeletingEntry(null);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateTotalTime = () => {
    return timeEntries.reduce((total, entry) => total + entry.minutes_spent, 0);
  };

  const calculateTotalBillable = () => {
    return timeEntries
      .filter(entry => entry.is_billable)
      .reduce((total, entry) => total + (entry.minutes_spent * entry.billable_rate / 60), 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Time Tracking</h3>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Time Entry
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm font-medium text-gray-500">Total Time</div>
            <div className="text-2xl font-bold text-gray-900">{formatDuration(calculateTotalTime())}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm font-medium text-gray-500">Billable Amount</div>
            <div className="text-2xl font-bold text-green-600">${calculateTotalBillable().toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm font-medium text-gray-500">Entries</div>
            <div className="text-2xl font-bold text-gray-900">{timeEntries.length}</div>
          </div>
        </div>
      </div>

      {/* Time Entry Form */}
      {showForm && (
        <TimeEntryForm
          ticketId={ticketId}
          onTimeEntryAdded={handleTimeEntryAdded}
          onCancel={() => {
            setShowForm(false);
            setEditingEntry(null);
          }}
          editEntry={editingEntry}
        />
      )}

      {/* Time Entries List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Time Entries</h4>
        </div>

        {timeEntries.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No time entries found. Add your first time entry to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {timeEntries.map((entry) => (
              <div key={entry.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.first_name} {entry.last_name}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {entry.activity_type}
                      </span>
                      {entry.is_billable && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Billable
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{entry.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Start: {formatDateTime(entry.start_time)}</span>
                      <span>End: {formatDateTime(entry.end_time)}</span>
                      <span>Duration: {formatDuration(entry.minutes_spent)}</span>
                      {entry.is_billable && (
                        <span>Rate: ${entry.billable_rate}/hr</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingEntry === entry.id}
                      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {deletingEntry === entry.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeEntryList; 