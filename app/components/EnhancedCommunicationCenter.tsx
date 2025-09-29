'use client';

import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  CalendarDaysIcon,
  BellIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface Communication {
  _id: string;
  subject: string;
  message: string;
  type: 'Query' | 'Update' | 'Approval Request' | 'Fund Request' | 'Issue Report' | 'Coordination' | 'Directive';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  fromAgency: { _id: string; name: string; type: string };
  toAgency: { _id: string; name: string; type: string };
  ccAgencies: { _id: string; name: string; type: string }[];
  status: 'Draft' | 'Sent' | 'Read' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  attachments: string[];
  responses: {
    _id: string;
    message: string;
    fromAgency: { name: string };
    createdAt: string;
  }[];
  relatedProject?: { _id: string; name: string; component: string };
  escalationLevel: number;
  dueDate?: string;
}

interface Agency {
  _id: string;
  name: string;
  type: string;
  level: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
}

export default function EnhancedCommunicationCenter() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // New message form state
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
    type: 'Query' as Communication['type'],
    priority: 'Medium' as Communication['priority'],
    fromAgency: '',
    toAgency: '',
    ccAgencies: [] as string[],
    relatedProject: '',
    dueDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [commRes, agenciesRes, projectsRes] = await Promise.all([
        fetch('/api/communications'),
        fetch('/api/agencies'),
        fetch('/api/projects')
      ]);

      if (commRes.ok) {
        const commData = await commRes.json();
        setCommunications(commData.success ? commData.data : []);
      }

      if (agenciesRes.ok) {
        const agenciesData = await agenciesRes.json();
        setAgencies(agenciesData.success ? agenciesData.data : []);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.success ? projectsData.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage)
      });

      if (response.ok) {
        setShowNewMessageModal(false);
        setNewMessage({
          subject: '',
          message: '',
          type: 'Query',
          priority: 'Medium',
          fromAgency: '',
          toAgency: '',
          ccAgencies: [],
          relatedProject: '',
          dueDate: ''
        });
        fetchData(); // Refresh the communications list
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Query': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      case 'Update': return <DocumentTextIcon className="w-4 h-4" />;
      case 'Approval Request': return <CheckCircleIcon className="w-4 h-4" />;
      case 'Fund Request': return <ClockIcon className="w-4 h-4" />;
      case 'Issue Report': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'Coordination': return <UserGroupIcon className="w-4 h-4" />;
      default: return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Sent': return 'bg-purple-100 text-purple-800';
      case 'Read': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesType = filterType === 'all' || comm.type === filterType;
    const matchesStatus = filterStatus === 'all' || comm.status === filterStatus;
    const matchesSearch = !searchTerm || 
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.fromAgency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.toAgency.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const urgentCommunications = communications.filter(comm => 
    comm.priority === 'Critical' || comm.priority === 'High'
  ).slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Communication Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <ChatBubbleLeftRightIcon className="w-8 h-8 mr-3 text-blue-300" />
                PM-AJAY Communication Center
              </h1>
              <p className="text-blue-200">Seamless coordination between implementing agencies</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowNewMessageModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                New Message
              </Button>
              <Button
                onClick={fetchData}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500/20">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-blue-200">Total Messages</p>
                <p className="text-2xl font-bold text-white">{communications.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-500/20">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-red-200">Urgent</p>
                <p className="text-2xl font-bold text-white">{urgentCommunications.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <ClockIcon className="w-6 h-6 text-yellow-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-yellow-200">Pending</p>
                <p className="text-2xl font-bold text-white">
                  {communications.filter(c => c.status === 'Sent' || c.status === 'In Progress').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircleIcon className="w-6 h-6 text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-green-200">Resolved</p>
                <p className="text-2xl font-bold text-white">
                  {communications.filter(c => c.status === 'Resolved').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Communications List */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex items-center gap-2 flex-1">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search communications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all">All Types</option>
                    <option value="Query">Query</option>
                    <option value="Update">Update</option>
                    <option value="Approval Request">Approval Request</option>
                    <option value="Fund Request">Fund Request</option>
                    <option value="Issue Report">Issue Report</option>
                    <option value="Coordination">Coordination</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Read">Read</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Communications List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredCommunications.map((comm) => (
                  <div
                    key={comm._id}
                    onClick={() => setSelectedCommunication(comm)}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          {getTypeIcon(comm.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium truncate">{comm.subject}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(comm.priority)}`}>
                              {comm.priority}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm truncate mb-2">{comm.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <BuildingOffice2Icon className="w-3 h-3 mr-1" />
                              {comm.fromAgency.name}
                            </span>
                            <span>→</span>
                            <span className="flex items-center">
                              <BuildingOffice2Icon className="w-3 h-3 mr-1" />
                              {comm.toAgency.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comm.status)} mb-1`}>
                          {comm.status}
                        </span>
                        <p className="text-xs text-gray-500">{formatDate(comm.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Urgent Communications */}
            <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BellIcon className="w-5 h-5 mr-2 text-red-400" />
                Urgent Communications
              </h3>
              <div className="space-y-3">
                {urgentCommunications.map((comm) => (
                  <div
                    key={comm._id}
                    className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-all"
                    onClick={() => setSelectedCommunication(comm)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-red-300 text-sm font-medium">{comm.type}</span>
                      <span className="text-xs text-red-400">{formatDate(comm.createdAt)}</span>
                    </div>
                    <p className="text-white text-sm truncate">{comm.subject}</p>
                    <p className="text-red-200 text-xs truncate">{comm.fromAgency.name} → {comm.toAgency.name}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Communication Statistics */}
            <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Communication Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Response Rate</span>
                  <span className="text-white font-semibold">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Avg Response Time</span>
                  <span className="text-white font-semibold">4.2 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Active Threads</span>
                  <span className="text-white font-semibold">{communications.filter(c => c.status === 'In Progress').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">This Week</span>
                  <span className="text-white font-semibold">{communications.filter(c => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(c.createdAt) > weekAgo;
                  }).length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Communication Detail Modal */}
        {selectedCommunication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedCommunication.subject}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedCommunication.priority)}`}>
                      {selectedCommunication.priority} Priority
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCommunication.status)}`}>
                      {selectedCommunication.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCommunication(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">From:</span>
                      <p className="text-gray-800">{selectedCommunication.fromAgency.name}</p>
                      <p className="text-gray-600 text-xs">{selectedCommunication.fromAgency.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">To:</span>
                      <p className="text-gray-800">{selectedCommunication.toAgency.name}</p>
                      <p className="text-gray-600 text-xs">{selectedCommunication.toAgency.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Type:</span>
                      <p className="text-gray-800">{selectedCommunication.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Date:</span>
                      <p className="text-gray-800">{formatDate(selectedCommunication.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Message:</h3>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedCommunication.message}</p>
                  </div>
                </div>

                {selectedCommunication.responses && selectedCommunication.responses.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Responses ({selectedCommunication.responses.length}):</h3>
                    <div className="space-y-3">
                      {selectedCommunication.responses.map((response) => (
                        <div key={response._id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-blue-800">{response.fromAgency.name}</span>
                            <span className="text-sm text-blue-600">{formatDate(response.createdAt)}</span>
                          </div>
                          <p className="text-gray-700">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Reply
                  </Button>
                  <Button variant="outline">
                    Forward
                  </Button>
                  <Button variant="outline">
                    Mark as Resolved
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* New Message Modal */}
        {showNewMessageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">New Message</h2>
                <button
                  onClick={() => setShowNewMessageModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Agency</label>
                    <select
                      value={newMessage.fromAgency}
                      onChange={(e) => setNewMessage({...newMessage, fromAgency: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select agency...</option>
                      {agencies.map(agency => (
                        <option key={agency._id} value={agency._id}>{agency.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Agency</label>
                    <select
                      value={newMessage.toAgency}
                      onChange={(e) => setNewMessage({...newMessage, toAgency: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select agency...</option>
                      {agencies.map(agency => (
                        <option key={agency._id} value={agency._id}>{agency.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newMessage.type}
                      onChange={(e) => setNewMessage({...newMessage, type: e.target.value as Communication['type']})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="Query">Query</option>
                      <option value="Update">Update</option>
                      <option value="Approval Request">Approval Request</option>
                      <option value="Fund Request">Fund Request</option>
                      <option value="Issue Report">Issue Report</option>
                      <option value="Coordination">Coordination</option>
                      <option value="Directive">Directive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newMessage.priority}
                      onChange={(e) => setNewMessage({...newMessage, priority: e.target.value as Communication['priority']})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter message subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={newMessage.message}
                    onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                    required
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your message..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Related Project (Optional)</label>
                  <select
                    value={newMessage.relatedProject}
                    onChange={(e) => setNewMessage({...newMessage, relatedProject: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Select project...</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>{project.name} ({project.component})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewMessageModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}