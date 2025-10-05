'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  fromAgency: { _id: string; name: string; type: string; level: string; state: string };
  toAgency: { _id: string; name: string; type: string; level: string; state: string };
  ccAgencies: { _id: string; name: string; type: string; level: string; state: string }[];
  status: 'Sent' | 'Delivered' | 'Read' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  attachments: string[];
  projectId?: { _id: string; name: string; component: string };
  
  // Thread management
  threadId?: string;
  parentMessageId?: string;
  isReply: boolean;
  replyCount: number;
  latestReplies?: Communication[];
  
  // Read tracking
  readBy: { agency: string; readAt: string }[];
  
  // Response management
  responseRequired: boolean;
  responseDeadline?: string;
  escalationLevel: number;
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [threadDetails, setThreadDetails] = useState<{ rootMessage: Communication; replies: Communication[] } | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'inbox' | 'sent' | 'urgent' | 'resolved' | 'replies'>('all');
  const [allCommunications, setAllCommunications] = useState<Communication[]>([]); // Store all communications for counting
  const [currentAgency, setCurrentAgency] = useState<string>(''); // Current user's agency ID
  const [userRole, setUserRole] = useState<string>(''); // Current user's role
  const [accessError, setAccessError] = useState<string>(''); // Access control errors

  // New message form state
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
    type: 'Query' as Communication['type'],
    priority: 'Medium' as Communication['priority'],
    fromAgency: '',
    toAgency: '',
    ccAgencies: [] as string[],
    projectId: '',
    responseRequired: false,
    responseDeadline: ''
  });

  // Reply form state
  const [replyMessage, setReplyMessage] = useState({
    message: '',
    fromAgency: ''
  });

  // Forward form state
  const [forwardMessage, setForwardMessage] = useState({
    toAgency: '',
    ccAgencies: [] as string[],
    message: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Session and role verification
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      setAccessError('Please login to access communications');
      router.push('/login');
      return;
    }

    const role = (session.user as any)?.role || 'Viewer';
    setUserRole(role);
    
    // Set appropriate access controls based on role
    if (role === 'Viewer') {
      setAccessError('You have read-only access to communications');
    }
  }, [session, status, router]);

  // Authority checking functions
  const canResolveMessage = (communication: Communication): boolean => {
    if (!session || userRole === 'Viewer') return false;
    
    // Super Admin can resolve any message
    if (userRole === 'Super Admin') return true;
    
    // Central Admin can resolve messages for any agency
    if (userRole === 'Agency Admin' && (session.user as any)?.email?.includes('central')) return true;
    
    // State Admin can resolve messages within their state
    if (userRole === 'State Admin') {
      const userStateAccess = (session.user as any)?.stateAccess || [];
      return userStateAccess.includes(communication.toAgency.state);
    }
    
    // Agency Admin can resolve messages for their agency
    if (userRole === 'Agency Admin') {
      return communication.toAgency._id === currentAgency;
    }
    
    return false;
  };

  const canCreateMessage = (): boolean => {
    return !!session && userRole !== 'Viewer';
  };

  const canEditMessage = (communication: Communication): boolean => {
    if (!session || userRole === 'Viewer') return false;
    
    // Super Admin can edit any message
    if (userRole === 'Super Admin') return true;
    
    // Users can only edit their own messages that haven't been resolved
    return communication.fromAgency._id === currentAgency && communication.status !== 'Resolved';
  };

  const showAccessError = (action: string) => {
    const errorMessages = {
      'resolve': `Access Denied: Only ${userRole === 'Viewer' ? 'authorized users' : 'message recipients or higher authorities'} can resolve messages`,
      'create': 'Access Denied: Viewers cannot create messages',
      'edit': 'Access Denied: You can only edit your own unresolved messages',
      'reply': 'Access Denied: Viewers cannot reply to messages'
    };
    
    setAccessError(errorMessages[action as keyof typeof errorMessages] || 'Access Denied');
    setTimeout(() => setAccessError(''), 5000);
  };

  useEffect(() => {
    if (currentAgency) {
      fetchCommunications();
      fetchAllCommunications(); // Also fetch all for counting
    }
  }, [currentAgency, activeTab, filterStatus, filterType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch agencies and projects
      const [agenciesRes, projectsRes] = await Promise.all([
        fetch('/api/agencies'),
        fetch('/api/projects')
      ]);

      if (agenciesRes.ok) {
        const agenciesData = await agenciesRes.json();
        setAgencies(agenciesData.success ? agenciesData.data : []);
        
        // Set current agency if not set (for demo, use first agency)
        if (!currentAgency && agenciesData.success && agenciesData.data.length > 0) {
          setCurrentAgency(agenciesData.data[0]._id);
        }
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

  const fetchAllCommunications = async () => {
    try {
      if (!currentAgency) return;
      
      // Fetch all communications for accurate tab counts
      const response = await fetch(`/api/communications?agencyId=${currentAgency}&threadOnly=true`);
      if (response.ok) {
        const data = await response.json();
        setAllCommunications(data.success ? data.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch all communications for counting:', error);
    }
  };

  const fetchCommunications = async () => {
    try {
      if (!currentAgency) return;
      
      let url = '/api/communications?threadOnly=true'; // Only get root messages
      
      switch (activeTab) {
        case 'inbox':
          url += `&toAgency=${currentAgency}`;
          // Exclude resolved messages from inbox
          break;
        case 'sent':
          url += `&fromAgency=${currentAgency}`;
          // Exclude resolved messages from sent
          break;
        case 'urgent':
          url += `&agencyId=${currentAgency}`;
          // Will filter by priority on frontend and exclude resolved
          break;
        case 'resolved':
          url += `&agencyId=${currentAgency}&status=Resolved`;
          // Only show resolved messages
          break;
        case 'replies':
          // Get communications where there are replies
          url = '/api/communications?threadOnly=false'; // Get all messages including replies
          url += `&agencyId=${currentAgency}`;
          // Exclude resolved messages from replies tab
          break;
        case 'all':
        default:
          url += `&agencyId=${currentAgency}`;
          // Exclude resolved messages from all tab
          break;
      }
      
      // For all tabs except 'resolved', exclude resolved messages
      if (activeTab !== 'resolved') {
        // We'll filter resolved messages on the frontend since we can't exclude them via URL params easily
      }
      
      if (filterStatus !== 'all' && activeTab !== 'resolved') {
        url += `&status=${filterStatus}`;
      }
      
      if (filterType !== 'all') {
        url += `&type=${filterType}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        let communications = data.success ? data.data : [];
        
        // IMPORTANT: Exclude resolved messages from ALL tabs except 'resolved' tab
        if (activeTab !== 'resolved') {
          communications = communications.filter((comm: Communication) => 
            comm.status !== 'Resolved'
          );
        }
        
        // Apply additional client-side filtering for specific tabs
        if (activeTab === 'urgent') {
          communications = communications.filter((comm: Communication) => 
            comm.priority === 'Critical' || comm.priority === 'High'
          );
        } else if (activeTab === 'replies') {
          communications = communications.filter((comm: Communication) => 
            comm.isReply || comm.replyCount > 0
          );
        }
        
        setCommunications(communications);
      }
    } catch (error) {
      console.error('Failed to fetch communications:', error);
      setCommunications([]);
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
          projectId: '',
          responseRequired: false,
          responseDeadline: ''
        });
        fetchCommunications(); // Refresh the communications list
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const fetchThreadDetails = async (communicationId: string) => {
    try {
      const response = await fetch(`/api/communications/thread/${communicationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setThreadDetails(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch thread details:', error);
    }
  };

  const handleCommunicationSelect = async (communication: Communication) => {
    setSelectedCommunication(communication);
    
    // Mark as read if this agency is the recipient and hasn't read it yet
    if (communication.toAgency._id === currentAgency && 
        !communication.readBy.some(r => r.agency === currentAgency)) {
      await markAsRead(communication._id);
    }
    
    // Fetch thread details if this communication has replies
    if (!communication.isReply && communication.replyCount > 0) {
      await fetchThreadDetails(communication._id);
    }
  };

  const markAsRead = async (communicationId: string) => {
    try {
      await fetch(`/api/communications/read/${communicationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId: currentAgency })
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommunication) return;

    try {
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Re: ${selectedCommunication.subject}`,
          message: replyMessage.message,
          type: 'Update',
          priority: selectedCommunication.priority,
          fromAgency: replyMessage.fromAgency,
          toAgency: selectedCommunication.fromAgency._id,
          parentMessageId: selectedCommunication._id,
          projectId: selectedCommunication.projectId?._id || ''
        })
      });

      if (response.ok) {
        setShowReplyModal(false);
        setReplyMessage({ message: '', fromAgency: '' });
        fetchCommunications(); // Refresh communications
        
        // If thread details are open, refresh them too
        if (threadDetails) {
          fetchThreadDetails(selectedCommunication._id);
        }
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommunication) return;

    try {
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Fwd: ${selectedCommunication.subject}`,
          message: forwardMessage.message + '\n\n--- Forwarded Message ---\n' + selectedCommunication.message,
          type: selectedCommunication.type,
          priority: selectedCommunication.priority,
          fromAgency: selectedCommunication.toAgency._id,
          toAgency: forwardMessage.toAgency,
          ccAgencies: forwardMessage.ccAgencies,
          projectId: selectedCommunication.projectId?._id || ''
        })
      });

      if (response.ok) {
        setShowForwardModal(false);
        setForwardMessage({ toAgency: '', ccAgencies: [], message: '' });
        fetchCommunications();
        setSelectedCommunication(null);
      }
    } catch (error) {
      console.error('Failed to forward message:', error);
    }
  };

  const handleMarkAsResolved = async () => {
    if (!selectedCommunication) return;

    // Check if user has authority to resolve this message
    if (!canResolveMessage(selectedCommunication)) {
      showAccessError('resolve');
      return;
    }

    try {
      const response = await fetch(`/api/communications/${selectedCommunication._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Resolved',
          resolvedBy: session?.user?.email,
          resolvedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Close the modal first
        setSelectedCommunication(null);
        
        // Refresh current tab to remove the resolved message
        fetchCommunications();
        fetchAllCommunications();
        
        // Show success message
        setAccessError('✅ Message resolved successfully');
        setTimeout(() => setAccessError(''), 3000);
      } else {
        throw new Error('Failed to resolve message');
      }
    } catch (error) {
      console.error('Failed to mark as resolved:', error);
      setAccessError('❌ Failed to resolve message. Please try again.');
      setTimeout(() => setAccessError(''), 5000);
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
      case 'Critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-300 border-green-500/30';
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
      case 'Resolved': return 'bg-green-500/20 text-green-300';
      case 'In Progress': return 'bg-blue-500/20 text-blue-300';
      case 'Sent': return 'bg-purple-500/20 text-purple-300';
      case 'Read': return 'bg-gray-500/20 text-gray-300';
      default: return 'bg-yellow-500/20 text-yellow-300';
    }
  };

  // Helper functions to identify message types and their visual styling
  const isReplyMessage = (comm: Communication) => {
    return comm.isReply || comm.subject.startsWith('Re:');
  };

  const isForwardedMessage = (comm: Communication) => {
    return comm.subject.startsWith('Fwd:') || comm.message.includes('--- Forwarded Message ---');
  };

  const isResolvedMessage = (comm: Communication) => {
    return comm.status === 'Resolved';
  };

  const getMessageTypeIndicator = (comm: Communication) => {
    if (isResolvedMessage(comm)) {
      return {
        icon: <CheckCircleIcon className="w-4 h-4" />,
        label: 'Resolved',
        bgColor: 'bg-emerald-500/20',
        textColor: 'text-emerald-300',
        borderColor: 'border-emerald-500/30'
      };
    } else if (isReplyMessage(comm)) {
      return {
        icon: <ArrowPathIcon className="w-4 h-4" />,
        label: 'Reply',
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-300',
        borderColor: 'border-blue-500/30'
      };
    } else if (isForwardedMessage(comm)) {
      return {
        icon: <PaperAirplaneIcon className="w-4 h-4" />,
        label: 'Forwarded',
        bgColor: 'bg-purple-500/20',
        textColor: 'text-purple-300',
        borderColor: 'border-purple-500/30'
      };
    }
    return null;
  };

  const getCardBackgroundStyle = (comm: Communication) => {
    const isUnread = comm.toAgency._id === currentAgency && !comm.readBy.some(r => r.agency === currentAgency);
    const isUrgent = comm.priority === 'Critical' || comm.priority === 'High';

    if (isResolvedMessage(comm)) {
      return 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20';
    } else if (isReplyMessage(comm)) {
      return 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20';
    } else if (isForwardedMessage(comm)) {
      return 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20';
    } else if (isUnread) {
      return 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20';
    } else if (isUrgent) {
      return 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20';
    }
    return 'bg-white/5 border-white/10 hover:bg-white/10';
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
      {/* Access Error Display */}
      {accessError && (
        <div className={`mx-4 mt-4 p-4 rounded-lg border ${
          accessError.includes('✅') 
            ? 'bg-green-900/50 border-green-500 text-green-200' 
            : accessError.includes('❌') 
            ? 'bg-red-900/50 border-red-500 text-red-200'
            : 'bg-yellow-900/50 border-yellow-500 text-yellow-200'
        }`}>
          <div className="flex items-center">
            {accessError.includes('✅') && <span className="mr-2">✅</span>}
            {accessError.includes('❌') && <span className="mr-2">❌</span>}
            {!accessError.includes('✅') && !accessError.includes('❌') && <span className="mr-2">⚠️</span>}
            <span className="font-medium">{accessError}</span>
          </div>
        </div>
      )}
      
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
                onClick={() => {
                  if (canCreateMessage()) {
                    setShowNewMessageModal(true);
                  } else {
                    showAccessError('create');
                  }
                }}
                className={`${canCreateMessage() 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!canCreateMessage()}
              >
                <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                New Message
              </Button>
              <Button
                onClick={fetchCommunications}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {[
              { id: 'all', name: 'All Messages', icon: ChatBubbleLeftRightIcon, color: 'blue' },
              { id: 'inbox', name: 'Inbox', icon: DocumentTextIcon, color: 'green' },
              { id: 'sent', name: 'Sent', icon: PaperAirplaneIcon, color: 'purple' },
              { id: 'urgent', name: 'Urgent', icon: ExclamationTriangleIcon, color: 'red' },
              { id: 'resolved', name: 'Resolved', icon: CheckCircleIcon, color: 'emerald' },
              { id: 'replies', name: 'With Replies', icon: ChatBubbleLeftRightIcon, color: 'orange' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const getTabColor = (color: string, isActive: boolean) => {
                if (isActive) {
                  switch (color) {
                    case 'red': return 'border-red-400 text-red-400';
                    case 'green': return 'border-green-400 text-green-400';
                    case 'purple': return 'border-purple-400 text-purple-400';
                    case 'emerald': return 'border-emerald-400 text-emerald-400';
                    case 'orange': return 'border-orange-400 text-orange-400';
                    default: return 'border-blue-400 text-blue-400';
                  }
                }
                return 'border-transparent text-gray-300 hover:text-white hover:border-gray-300';
              };

              const getCount = () => {
                switch (tab.id) {
                  case 'inbox':
                    return allCommunications.filter(c => 
                      c.toAgency._id === currentAgency && 
                      !c.readBy.some(r => r.agency === currentAgency) &&
                      c.status !== 'Resolved' // Exclude resolved messages from inbox count
                    ).length;
                  case 'urgent':
                    return allCommunications.filter(c => 
                      (c.priority === 'Critical' || c.priority === 'High') &&
                      c.status !== 'Resolved' // Exclude resolved messages from urgent count
                    ).length;
                  case 'resolved':
                    return allCommunications.filter(c => c.status === 'Resolved').length;
                  case 'replies':
                    return allCommunications.filter(c => 
                      c.replyCount > 0 &&
                      c.status !== 'Resolved' // Exclude resolved messages from replies count
                    ).length;
                  default:
                    return allCommunications.filter(c => c.status !== 'Resolved').length; // Show count of non-resolved messages for all
                }
              };

              const count = getCount();

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`${getTabColor(tab.color, isActive)} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                  {count !== null && count > 0 && (
                    <span className={`ml-2 text-white text-xs px-2 py-1 rounded-full ${
                      tab.color === 'red' ? 'bg-red-500' :
                      tab.color === 'green' ? 'bg-green-500' :
                      tab.color === 'purple' ? 'bg-purple-500' :
                      tab.color === 'emerald' ? 'bg-emerald-500' :
                      tab.color === 'orange' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

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
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  onClick={() => setActiveTab('urgent')}
                  variant="outline"
                  className={`text-xs ${activeTab === 'urgent' ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'border-white/20 text-white hover:bg-white/10'}`}
                >
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  View Urgent ({communications.filter(c => c.priority === 'Critical' || c.priority === 'High').length})
                </Button>
                <Button
                  onClick={() => setActiveTab('replies')}
                  variant="outline"
                  className={`text-xs ${activeTab === 'replies' ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'border-white/20 text-white hover:bg-white/10'}`}
                >
                  <ChatBubbleLeftRightIcon className="w-3 h-3 mr-1" />
                  With Replies ({communications.filter(c => c.replyCount > 0).length})
                </Button>
                <Button
                  onClick={() => setActiveTab('resolved')}
                  variant="outline"
                  className={`text-xs ${activeTab === 'resolved' ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'border-white/20 text-white hover:bg-white/10'}`}
                >
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Resolved ({communications.filter(c => c.status === 'Resolved').length})
                </Button>
              </div>

              {/* Current Tab Summary */}
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium capitalize">
                      {activeTab === 'all' ? 'All Messages' : 
                       activeTab === 'inbox' ? 'Inbox' :
                       activeTab === 'sent' ? 'Sent Messages' :
                       activeTab === 'urgent' ? 'Urgent Communications' :
                       activeTab === 'resolved' ? 'Resolved Communications' :
                       'Messages with Replies'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {filteredCommunications.length} 
                      {activeTab === 'urgent' ? ' urgent' : 
                       activeTab === 'resolved' ? ' resolved' :
                       activeTab === 'replies' ? ' with replies' : ''} messages
                      {activeTab === 'inbox' && ` (${communications.filter(c => 
                        c.toAgency._id === currentAgency && 
                        !c.readBy.some(r => r.agency === currentAgency)
                      ).length} unread)`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Last updated</div>
                    <div className="text-sm text-white">{new Date().toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>

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
                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-700 transition-colors"
                    style={{ 
                      colorScheme: 'dark',
                      backgroundColor: '#1f2937',
                      color: '#ffffff'
                    }}
                  >
                    <option value="all" className="bg-gray-800 text-white">All Types</option>
                    <option value="Query" className="bg-gray-800 text-white">Query</option>
                    <option value="Update" className="bg-gray-800 text-white">Update</option>
                    <option value="Approval Request" className="bg-gray-800 text-white">Approval Request</option>
                    <option value="Fund Request" className="bg-gray-800 text-white">Fund Request</option>
                    <option value="Issue Report" className="bg-gray-800 text-white">Issue Report</option>
                    <option value="Coordination" className="bg-gray-800 text-white">Coordination</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-700 transition-colors"
                    style={{ 
                      colorScheme: 'dark',
                      backgroundColor: '#1f2937',
                      color: '#ffffff'
                    }}
                  >
                    <option value="all" className="bg-gray-800 text-white">All Status</option>
                    <option value="Draft" className="bg-gray-800 text-white">Draft</option>
                    <option value="Sent" className="bg-gray-800 text-white">Sent</option>
                    <option value="Read" className="bg-gray-800 text-white">Read</option>
                    <option value="In Progress" className="bg-gray-800 text-white">In Progress</option>
                    <option value="Resolved" className="bg-gray-800 text-white">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Communications List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredCommunications.map((comm) => {
                  const messageTypeIndicator = getMessageTypeIndicator(comm);
                  const cardStyle = getCardBackgroundStyle(comm);
                  const isUnread = comm.toAgency._id === currentAgency && !comm.readBy.some(r => r.agency === currentAgency);
                  const hasReplies = comm.replyCount > 0;

                  return (
                    <div
                      key={comm._id}
                      onClick={() => handleCommunicationSelect(comm)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all relative ${cardStyle}`}
                    >
                      {/* Message type indicator strip */}
                      {messageTypeIndicator && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${messageTypeIndicator.bgColor.replace('/20', '')}`}></div>
                      )}

                      {/* Unread indicator */}
                      {isUnread && !messageTypeIndicator && (
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-cyan-500 rounded-full"></div>
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 ml-2">
                          {/* Icon with message type styling */}
                          <div className={`p-2 rounded-lg ${messageTypeIndicator ? messageTypeIndicator.bgColor : 'bg-gray-500/20'}`}>
                            {messageTypeIndicator ? messageTypeIndicator.icon : getTypeIcon(comm.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className={`font-medium truncate ${isUnread ? 'text-cyan-200' : 'text-white'}`}>
                                {comm.subject}
                              </h4>
                              
                              {/* Message type badge */}
                              {messageTypeIndicator && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${messageTypeIndicator.bgColor} ${messageTypeIndicator.textColor} ${messageTypeIndicator.borderColor}`}>
                                  {messageTypeIndicator.label}
                                </span>
                              )}
                              
                              {/* Priority badge */}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(comm.priority)}`}>
                                {comm.priority}
                              </span>
                              
                              {/* Reply count badge */}
                              {hasReplies && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                  💬 {comm.replyCount} replies
                                </span>
                              )}
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
                );
                })}
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
                    onClick={() => handleCommunicationSelect(comm)}
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

            {/* Message Type Legend */}
            <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-400" />
                Message Types
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircleIcon className="w-3 h-3" />
                    <span className="text-xs">Resolved</span>
                  </div>
                  <span className="text-gray-400 text-sm">Completed communications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <ArrowPathIcon className="w-3 h-3" />
                    <span className="text-xs">Reply</span>
                  </div>
                  <span className="text-gray-400 text-sm">Response to another message</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <PaperAirplaneIcon className="w-3 h-3" />
                    <span className="text-xs">Forwarded</span>
                  </div>
                  <span className="text-gray-400 text-sm">Forwarded from another agency</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <span className="text-xs">Unread</span>
                  </div>
                  <span className="text-gray-400 text-sm">New unread messages</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    <span className="text-xs">Urgent</span>
                  </div>
                  <span className="text-gray-400 text-sm">High/Critical priority</span>
                </div>
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
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Message type indicator */}
                    {(() => {
                      const typeIndicator = getMessageTypeIndicator(selectedCommunication);
                      if (typeIndicator) {
                        return (
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${typeIndicator.bgColor} ${typeIndicator.textColor} ${typeIndicator.borderColor}`}>
                            {typeIndicator.icon}
                            <span className="text-sm font-medium">{typeIndicator.label}</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">
                          {getTypeIcon(selectedCommunication.type)}
                          <span className="text-sm font-medium">Original</span>
                        </div>
                      );
                    })()}
                    
                    <h2 className="text-xl font-bold text-white">{selectedCommunication.subject}</h2>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedCommunication.priority)}`}>
                      {selectedCommunication.priority} Priority
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCommunication.status)}`}>
                      {selectedCommunication.status}
                    </span>
                    {selectedCommunication.replyCount > 0 && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        💬 {selectedCommunication.replyCount} replies
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCommunication(null)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-300">From:</span>
                      <p className="text-white">{selectedCommunication.fromAgency.name}</p>
                      <p className="text-gray-400 text-xs">{selectedCommunication.fromAgency.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-300">To:</span>
                      <p className="text-white">{selectedCommunication.toAgency.name}</p>
                      <p className="text-gray-400 text-xs">{selectedCommunication.toAgency.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-300">Type:</span>
                      <p className="text-white">{selectedCommunication.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-300">Date:</span>
                      <p className="text-white">{formatDate(selectedCommunication.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">Message:</h3>
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                    <p className="text-gray-200 whitespace-pre-wrap">{selectedCommunication.message}</p>
                  </div>
                </div>

                {!selectedCommunication.isReply && selectedCommunication.replyCount > 0 && (
                  <div>
                    <h3 className="font-medium text-white mb-2 flex items-center">
                      <ArrowPathIcon className="w-4 h-4 mr-2 text-blue-400" />
                      Replies ({selectedCommunication.replyCount}):
                    </h3>
                    <div className="space-y-3">
                      {selectedCommunication.latestReplies?.slice(0, 3).map((reply, index) => (
                        <div key={reply._id} className="relative">
                          {/* Reply connector line */}
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-500/30"></div>
                          
                          <div className="bg-blue-900/50 border border-blue-700/50 rounded-lg p-4 ml-8 relative">
                            {/* Reply indicator */}
                            <div className="absolute -left-8 top-4 w-3 h-3 bg-blue-500 rounded-full border-2 border-gray-800"></div>
                            
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <ArrowPathIcon className="w-3 h-3 text-blue-400" />
                                <span className="font-medium text-blue-200">{reply.fromAgency.name}</span>
                                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">Reply {index + 1}</span>
                              </div>
                              <span className="text-sm text-blue-300">{formatDate(reply.createdAt)}</span>
                            </div>
                            <p className="text-gray-200">{reply.message}</p>
                          </div>
                        </div>
                      ))}
                      
                      {selectedCommunication.replyCount > 3 && (
                        <button
                          onClick={() => fetchThreadDetails(selectedCommunication._id)}
                          className="w-full text-blue-400 hover:text-blue-300 text-sm py-2 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          View all {selectedCommunication.replyCount} replies...
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-600">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    onClick={() => setShowReplyModal(true)}
                    disabled={selectedCommunication.status === 'Resolved'}
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Reply
                    <span className="text-xs opacity-75">(Creates reply thread)</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setShowForwardModal(true)}
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Forward
                    <span className="text-xs opacity-75">(Send to another agency)</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className={`flex items-center gap-2 ${
                      selectedCommunication.status === 'Resolved' 
                        ? 'bg-green-500/20 border-green-500/50 text-green-300' 
                        : canResolveMessage(selectedCommunication)
                        ? 'border-green-500/50 text-green-300 hover:bg-green-500/20'
                        : 'border-gray-500/50 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (canResolveMessage(selectedCommunication)) {
                        handleMarkAsResolved();
                      } else {
                        showAccessError('resolve');
                      }
                    }}
                    disabled={selectedCommunication.status === 'Resolved' || !canResolveMessage(selectedCommunication)}
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    {selectedCommunication.status === 'Resolved' 
                      ? 'Resolved ✓' 
                      : canResolveMessage(selectedCommunication)
                      ? 'Mark as Resolved'
                      : '🔒 No Authority'
                    }
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* New Message Modal */}
        {showNewMessageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl bg-gray-800 p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">New Message</h2>
                <button
                  onClick={() => setShowNewMessageModal(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">From Agency</label>
                    <select
                      value={newMessage.fromAgency}
                      onChange={(e) => setNewMessage({...newMessage, fromAgency: e.target.value})}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-600 transition-colors"
                      style={{ 
                        colorScheme: 'dark',
                        backgroundColor: '#374151',
                        color: '#ffffff'
                      }}
                    >
                      <option value="" className="bg-gray-700 text-white">Select agency...</option>
                      {agencies.map(agency => (
                        <option key={agency._id} value={agency._id} className="bg-gray-700 text-white">{agency.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">To Agency</label>
                    <select
                      value={newMessage.toAgency}
                      onChange={(e) => setNewMessage({...newMessage, toAgency: e.target.value})}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-600 transition-colors"
                      style={{ 
                        colorScheme: 'dark',
                        backgroundColor: '#374151',
                        color: '#ffffff'
                      }}
                    >
                      <option value="" className="bg-gray-700 text-white">Select agency...</option>
                      {agencies.map(agency => (
                        <option key={agency._id} value={agency._id} className="bg-gray-700 text-white">{agency.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Type</label>
                    <select
                      value={newMessage.type}
                      onChange={(e) => setNewMessage({...newMessage, type: e.target.value as Communication['type']})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-600 transition-colors"
                      style={{ 
                        colorScheme: 'dark',
                        backgroundColor: '#374151',
                        color: '#ffffff'
                      }}
                    >
                      <option value="Query" className="bg-gray-700 text-white">Query</option>
                      <option value="Update" className="bg-gray-700 text-white">Update</option>
                      <option value="Approval Request" className="bg-gray-700 text-white">Approval Request</option>
                      <option value="Fund Request" className="bg-gray-700 text-white">Fund Request</option>
                      <option value="Issue Report" className="bg-gray-700 text-white">Issue Report</option>
                      <option value="Coordination" className="bg-gray-700 text-white">Coordination</option>
                      <option value="Directive" className="bg-gray-700 text-white">Directive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Priority</label>
                    <select
                      value={newMessage.priority}
                      onChange={(e) => setNewMessage({...newMessage, priority: e.target.value as Communication['priority']})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-600 transition-colors"
                      style={{ 
                        colorScheme: 'dark',
                        backgroundColor: '#374151',
                        color: '#ffffff'
                      }}
                    >
                      <option value="Low" className="bg-gray-700 text-white">Low</option>
                      <option value="Medium" className="bg-gray-700 text-white">Medium</option>
                      <option value="High" className="bg-gray-700 text-white">High</option>
                      <option value="Critical" className="bg-gray-700 text-white">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Subject</label>
                  <input
                    type="text"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter message subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Message</label>
                  <textarea
                    value={newMessage.message}
                    onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                    required
                    rows={6}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your message..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Related Project (Optional)</label>
                  <select
                    value={newMessage.projectId}
                    onChange={(e) => setNewMessage({...newMessage, projectId: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-600 transition-colors"
                    style={{ 
                      colorScheme: 'dark',
                      backgroundColor: '#374151',
                      color: '#ffffff'
                    }}
                  >
                    <option value="" className="bg-gray-700 text-white">Select project...</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id} className="bg-gray-700 text-white">{project.name} ({project.component})</option>
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

        {/* Reply Modal */}
        {showReplyModal && selectedCommunication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl bg-gray-800 p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Reply to: {selectedCommunication.subject}</h2>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">From Agency</label>
                  <select
                    value={replyMessage.fromAgency}
                    onChange={(e) => setReplyMessage({...replyMessage, fromAgency: e.target.value})}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-600 transition-colors"
                    style={{ 
                      colorScheme: 'dark',
                      backgroundColor: '#374151',
                      color: '#ffffff'
                    }}
                  >
                    <option value="" className="bg-gray-700 text-white">Select agency...</option>
                    {agencies.map(agency => (
                      <option key={agency._id} value={agency._id} className="bg-gray-700 text-white">{agency.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Reply Message</label>
                  <textarea
                    value={replyMessage.message}
                    onChange={(e) => setReplyMessage({...replyMessage, message: e.target.value})}
                    required
                    rows={6}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Type your reply..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    Send Reply
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReplyModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Forward Modal */}
        {showForwardModal && selectedCommunication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl bg-gray-800 p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Forward: {selectedCommunication.subject}</h2>
                <button
                  onClick={() => setShowForwardModal(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleForward} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">To Agency</label>
                  <select
                    value={forwardMessage.toAgency}
                    onChange={(e) => setForwardMessage({...forwardMessage, toAgency: e.target.value})}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-600 transition-colors"
                    style={{ 
                      colorScheme: 'dark',
                      backgroundColor: '#374151',
                      color: '#ffffff'
                    }}
                  >
                    <option value="" className="bg-gray-700 text-white">Select agency...</option>
                    {agencies.map(agency => (
                      <option key={agency._id} value={agency._id} className="bg-gray-700 text-white">{agency.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">CC Agencies (Optional)</label>
                  <select
                    multiple
                    value={forwardMessage.ccAgencies}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setForwardMessage({...forwardMessage, ccAgencies: selectedOptions});
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-600 transition-colors"
                    style={{ 
                      colorScheme: 'dark',
                      backgroundColor: '#374151',
                      color: '#ffffff'
                    }}
                    size={4}
                  >
                    {agencies.map(agency => (
                      <option key={agency._id} value={agency._id} className="bg-gray-700 text-white">{agency.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Additional Message (Optional)</label>
                  <textarea
                    value={forwardMessage.message}
                    onChange={(e) => setForwardMessage({...forwardMessage, message: e.target.value})}
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Add a message with the forwarded communication..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    Forward Message
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForwardModal(false)}
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