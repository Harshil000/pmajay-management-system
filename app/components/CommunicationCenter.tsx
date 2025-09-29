'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  PlusIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface Communication {
  _id: string;
  type: 'notification' | 'request' | 'update' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  message: string;
  fromAgency: {
    _id: string;
    name: string;
    type: string;
  };
  toAgencies: Array<{
    _id: string;
    name: string;
    type: string;
  }>;
  status: 'draft' | 'sent' | 'read' | 'responded';
  responses: Array<any>;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

const CommunicationCenter = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCommunication, setShowNewCommunication] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [newComm, setNewComm] = useState({
    type: 'notification',
    priority: 'medium',
    subject: '',
    message: '',
    toAgencies: [],
    fromAgency: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [commRes, agenciesRes] = await Promise.all([
        fetch('/api/communications'),
        fetch('/api/agencies')
      ]);

      const [commData, agenciesData] = await Promise.all([
        commRes.json(),
        agenciesRes.json()
      ]);

      if (commData.success) setCommunications(commData.data);
      if (agenciesData.success) setAgencies(agenciesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComm)
      });

      const data = await response.json();
      
      if (data.success) {
        setCommunications([data.data, ...communications]);
        setNewComm({
          type: 'notification',
          priority: 'medium',
          subject: '',
          message: '',
          toAgencies: [],
          fromAgency: ''
        });
        setShowNewCommunication(false);
      }
    } catch (error) {
      console.error('Error sending communication:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <PaperAirplaneIcon className="w-4 h-4" />;
      case 'read': return <CheckCircleIcon className="w-4 h-4" />;
      case 'responded': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      case 'draft': return <ClockIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <ExclamationCircleIcon className="w-5 h-5 text-red-600" />;
      case 'request': return <UserGroupIcon className="w-5 h-5 text-blue-600" />;
      case 'update': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      default: return <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const filteredCommunications = communications.filter(comm => {
    if (selectedFilter === 'all') return true;
    return comm.status === selectedFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading Communications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
              <p className="text-sm text-gray-600">Inter-agency Coordination & Messaging</p>
            </div>
            <Button 
              onClick={() => setShowNewCommunication(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Communication
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'sent', 'read', 'responded', 'draft'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                selectedFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {filter === 'all' ? 'All Communications' : filter}
              {filter !== 'all' && (
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {communications.filter(c => c.status === filter).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Communications List */}
        <div className="space-y-4">
          {filteredCommunications.length === 0 ? (
            <Card className="p-8 text-center">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Communications Found</h3>
              <p className="text-gray-600 mb-4">
                {selectedFilter === 'all' 
                  ? 'Start coordinating with agencies by sending your first communication.'
                  : `No communications with status "${selectedFilter}" found.`
                }
              </p>
              <Button onClick={() => setShowNewCommunication(true)}>
                Send First Communication
              </Button>
            </Card>
          ) : (
            filteredCommunications.map((comm) => (
              <Card key={comm._id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(comm.type)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{comm.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(comm.priority)}`}>
                          {comm.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{comm.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>From: {comm.fromAgency?.name || 'System'}</span>
                        <span>•</span>
                        <span>To: {comm.toAgencies?.length || 0} agencies</span>
                        <span>•</span>
                        <span>{formatDate(comm.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      comm.status === 'sent' ? 'text-blue-600 bg-blue-100' :
                      comm.status === 'read' ? 'text-green-600 bg-green-100' :
                      comm.status === 'responded' ? 'text-purple-600 bg-purple-100' :
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {getStatusIcon(comm.status)}
                      <span className="capitalize">{comm.status}</span>
                    </div>
                  </div>
                </div>
                
                {comm.responses && comm.responses.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">
                      {comm.responses.length} response{comm.responses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* New Communication Modal */}
      {showNewCommunication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSendCommunication} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">New Communication</h2>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewCommunication(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newComm.type}
                      onChange={(e) => setNewComm({ ...newComm, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="notification">Notification</option>
                      <option value="request">Request</option>
                      <option value="update">Update</option>
                      <option value="alert">Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={newComm.priority}
                      onChange={(e) => setNewComm({ ...newComm, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={newComm.subject}
                    onChange={(e) => setNewComm({ ...newComm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Communication subject..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={newComm.message}
                    onChange={(e) => setNewComm({ ...newComm, message: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your message..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Agency</label>
                  <select
                    value={newComm.fromAgency}
                    onChange={(e) => setNewComm({ ...newComm, fromAgency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select sending agency...</option>
                    {agencies.map((agency: any) => (
                      <option key={agency._id} value={agency._id}>
                        {agency.name} ({agency.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCommunication(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                  Send Communication
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationCenter;