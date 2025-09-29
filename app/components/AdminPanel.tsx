'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import StateForm from './StateForm';
import { INDIAN_STATES_DATA } from '@/lib/indianStatesData';
import {
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';interface AdminPanelProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

// Local interfaces for AdminPanel (these have custom properties for display)
interface State {
  _id: string;
  name: string;
  code: string;
  population: number;
  totalProjects: number;
  totalFunding: number;
  isActive: boolean;
}

interface Agency {
  _id: string;
  name: string;
  code: string;
  type: string;
  state: string;
  stateCode: string;
  stateId: { name: string };
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
}

interface Project {
  _id: string;
  name: string;
  projectId: string;
  component: string;
  stateCode: string;
  status: string;
  priority: string;
  fundsAllocated: number;
  fundsUtilized: number;
  progressPercentage: number;
  implementingAgency: { name: string };
  description?: string;
  startDate: string;
  expectedEndDate: string;
}

interface FundFlow {
  _id: string;
  amount: number;
  releaseDate: string;
  status: string;
  fundType: string;
  projectId: { name: string };
  fromAgency: { name: string };
  toAgency: { name: string };
  referenceNumber: string;
  purpose: string;
  component: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isAuthenticated, onLogout }) => {
  const [activeTab, setActiveTab] = useState('states');
  const [data, setData] = useState<any>({
    states: [],
    agencies: [],
    projects: [],
    funds: []
  });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStateForm, setShowStateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingState, setEditingState] = useState<any>(null);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'states', name: 'States', icon: BuildingOfficeIcon },
    { id: 'agencies', name: 'Agencies', icon: UserIcon },
    { id: 'projects', name: 'Projects', icon: BriefcaseIcon },
    { id: 'funds', name: 'Fund Flows', icon: BanknotesIcon }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${activeTab}`);
      const result = await response.json();
      
      if (result.success) {
        setData((prev: any) => ({
          ...prev,
          [activeTab]: result.data
        }));
        
        // If viewing projects, also fetch states for state name resolution
        if (activeTab === 'projects' && !data.states?.length) {
          const statesResponse = await fetch('/api/states');
          const statesResult = await statesResponse.json();
          if (statesResult.success) {
            setData((prev: any) => ({
              ...prev,
              states: statesResult.data
            }));
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (activeTab === 'states') {
      setEditingState(null);
      setShowStateForm(true);
    } else {
      setEditingItem(null);
      setError('');
      // Fetch all data needed for dropdowns
      fetchAllData();
      setShowAddModal(true);
    }
  };

  const handleEdit = (item: any) => {
    if (activeTab === 'states') {
      setEditingState(item);
      setShowStateForm(true);
    } else {
      setEditingItem(item);
      setError('');
      // Fetch all data needed for dropdowns
      fetchAllData();
      setShowAddModal(true);
    }
  };

  const fetchAllData = async () => {
    try {
      const endpoints = ['states', 'agencies', 'projects'];
      const promises = endpoints.map(endpoint => 
        fetch(`/api/${endpoint}`).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      const newData: any = {};
      
      endpoints.forEach((endpoint, index) => {
        if (results[index].success) {
          newData[endpoint] = results[index].data;
        }
      });
      
      setData((prev: any) => ({ ...prev, ...newData }));
    } catch (error) {
      console.error('Error fetching all data:', error);
    }
  };

  const handleStateSave = () => {
    setShowStateForm(false);
    setEditingState(null);
    fetchData(); // Refresh the states data
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/${activeTab}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error(`Error deleting ${activeTab}:`, error);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      setError('');
      const url = editingItem ? `/api/${activeTab}/${editingItem._id}` : `/api/${activeTab}`;
      const method = editingItem ? 'PUT' : 'POST';

      // For agencies, set stateCode from selected state (from data.states)
      if (activeTab === 'agencies' && formData.state && !formData.stateCode) {
        const selectedState = data.states.find((s: any) => s.name === formData.state);
        if (selectedState) {
          formData.stateCode = selectedState.code;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      let result = { success: false, error: '' };
      try {
        result = await response.json();
      } catch (e) {
        result.error = 'Invalid server response';
      }

      if (response.ok && result.success) {
        setShowAddModal(false);
        setEditingItem(null);
        fetchData(); // Refresh data
      } else {
        // Show detailed backend error if available
        setError(result.error || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error(`Error saving ${activeTab}:`, error);
      setError(error.message || 'Network error occurred');
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(safeAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (!isAuthenticated) {
    return null;
  }

  const renderStates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">States Management</h3>
          <p className="text-gray-400">Manage Indian states and union territories</p>
        </div>
        <Button 
          size="sm" 
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105" 
          onClick={handleAdd}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add State
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {data.states.map((state: State) => (
          <Card key={state._id} className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:border-gray-600/50 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h4 className="text-xl font-bold text-white">{state.name}</h4>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-sm rounded-full border border-blue-400/30">
                    {state.code}
                  </span>
                  <span className={`px-3 py-1 text-sm rounded-full border ${
                    state.isActive 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30' 
                      : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-400/30'
                  }`}>
                    {state.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">Population:</span>
                    <div className="text-white font-bold text-lg">{(state.population || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">Projects:</span>
                    <div className="text-blue-300 font-bold text-lg">{state.totalProjects || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">Total Funding:</span>
                    <div className="text-green-300 font-bold text-lg">{formatCurrency(state.totalFunding || 0)}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 ml-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-300"
                >
                  <EyeIcon className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(state)}
                  className="border-blue-500/50 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300" 
                  onClick={() => handleDelete(state._id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAgencies = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Agencies Management</h3>
          <p className="text-gray-400">Manage healthcare agencies and institutions</p>
        </div>
        <Button 
          size="sm" 
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25 transition-all duration-300 transform hover:scale-105" 
          onClick={handleAdd}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Agency
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {data.agencies.map((agency: Agency) => (
          <Card key={agency._id} className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-xl hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 hover:border-gray-600/50 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h4 className="text-xl font-bold text-white">{agency.name}</h4>
                  <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-sm rounded-full border border-green-400/30">
                    {agency.code}
                  </span>
                  <span className={`px-3 py-1 text-sm rounded-full border ${
                    agency.isActive 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30' 
                      : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-400/30'
                  }`}>
                    {agency.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">Type:</span>
                    <div className="text-white font-medium">{agency.type || 'N/A'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">State:</span>
                    <div className="text-blue-300 font-medium">{agency.stateId?.name || agency.state || 'N/A'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">Email:</span>
                    <div className="text-white font-medium truncate">{agency.contactEmail || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 ml-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-300"
                >
                  <EyeIcon className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(agency)}
                  className="border-green-500/50 text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-all duration-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                  onClick={() => handleDelete(agency._id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Projects Management</h3>
          <p className="text-gray-400">Manage healthcare projects and initiatives</p>
        </div>
        <Button 
          size="sm" 
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-105" 
          onClick={handleAdd}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Project
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {data.projects.map((project: Project) => (
          <Card key={project._id} className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-gray-600/50 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <h4 className="text-xl font-bold text-white">{project.name}</h4>
                  <span className="px-3 py-1 bg-gradient-to-r from-gray-600/50 to-gray-700/50 text-gray-300 text-sm rounded-full border border-gray-600/30">
                    {project.projectId}
                  </span>
                  <span className={`px-3 py-1 text-sm rounded-full border ${
                    project.status === 'Ongoing' ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-400/30' :
                    project.status === 'Completed' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30' :
                    'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-400/30'
                  }`}>
                    {project.status}
                  </span>
                  <span className={`px-3 py-1 text-sm rounded-full border ${
                    project.priority === 'High' ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-400/30' :
                    project.priority === 'Medium' ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border-orange-400/30' :
                    'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30'
                  }`}>
                    {project.priority}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">State:</span>
                    <div className="text-blue-300 font-medium">
                      {(() => {
                        const state = data.states?.find((s: any) => s.code === project.stateCode);
                        return state?.name || project.stateCode || 'N/A';
                      })()}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">Agency:</span>
                    <div className="text-purple-300 font-medium">{project.implementingAgency?.name || 'N/A'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">Budget:</span>
                    <div className="text-green-300 font-bold">{formatCurrency(project.fundsAllocated || 0)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">Progress:</span>
                    <div className="text-cyan-300 font-bold">{project.progressPercentage || 0}%</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-700/50 rounded-full h-3 border border-gray-600/30 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full shadow-lg transition-all duration-500 ease-out" 
                    style={{ width: `${project.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex gap-3 ml-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-300"
                >
                  <EyeIcon className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(project)}
                  className="border-purple-500/50 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all duration-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                  onClick={() => handleDelete(project._id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderFunds = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Fund Flows Management</h3>
          <p className="text-gray-400">Track and manage financial transactions</p>
        </div>
        <Button 
          size="sm" 
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105" 
          onClick={handleAdd}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Fund Flow
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {data.funds.map((fund: FundFlow) => (
          <Card key={fund._id} className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:border-gray-600/50 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <h4 className="text-2xl font-bold text-green-300">{formatCurrency(fund.amount)}</h4>
                  <span className="px-3 py-1 bg-gradient-to-r from-gray-600/50 to-gray-700/50 text-gray-300 text-sm rounded-full border border-gray-600/30">
                    {fund.referenceNumber}
                  </span>
                  <span className={`px-3 py-1 text-sm rounded-full border ${
                    fund.status === 'Completed' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30' :
                    fund.status === 'Pending' ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-400/30' :
                    'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-400/30'
                  }`}>
                    {fund.status}
                  </span>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 text-sm rounded-full border border-blue-400/30">
                    {fund.fundType}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">Project:</span>
                    <div className="text-purple-300 font-medium">{fund.projectId?.name || 'N/A'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">From:</span>
                    <div className="text-blue-300 font-medium">{fund.fromAgency?.name || 'N/A'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">To:</span>
                    <div className="text-cyan-300 font-medium">{fund.toAgency?.name || 'N/A'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="text-gray-400 block mb-1">Date:</span>
                    <div className="text-white font-medium">{formatDate(fund.releaseDate)}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 ml-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-300"
                >
                  <EyeIcon className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(fund)}
                  className="border-emerald-500/50 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-300"
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                  onClick={() => handleDelete(fund._id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'states': return renderStates();
      case 'agencies': return renderAgencies();
      case 'projects': return renderProjects();
      case 'funds': return renderFunds();
      default: return renderStates();
    }
  };

  const renderModal = () => {
    // Render StateForm modal when showStateForm is true
    if (showStateForm) {
      return (
        <StateForm
          initialData={editingState}
          onSave={handleStateSave}
          onCancel={() => {
            setShowStateForm(false);
            setEditingState(null);
          }}
        />
      );
    }

    if (!showAddModal) return null;

    const getFormFields = () => {
      switch (activeTab) {
        case 'states':
          // This case is now handled by StateForm above
          return null;
        case 'agencies':
          return (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Agency Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingItem?.name || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter agency name"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Agency Code</label>
                <input
                  type="text"
                  name="code"
                  defaultValue={editingItem?.code || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter unique agency code"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Agency Type</label>
                <select
                  name="type"
                  defaultValue={editingItem?.type || 'Implementing Agency'}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                >
                  <option value="Implementing Agency" className="bg-gray-800 text-white">Implementing Agency</option>
                  <option value="Executing Agency" className="bg-gray-800 text-white">Executing Agency</option>
                  <option value="Nodal Agency" className="bg-gray-800 text-white">Nodal Agency</option>
                  <option value="Monitoring Agency" className="bg-gray-800 text-white">Monitoring Agency</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Agency Level</label>
                <select
                  name="level"
                  defaultValue={editingItem?.level || 'Central'}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                >
                  <option value="Central" className="bg-gray-800 text-white">Central</option>
                  <option value="State" className="bg-gray-800 text-white">State</option>
                  <option value="District" className="bg-gray-800 text-white">District</option>
                  <option value="Block" className="bg-gray-800 text-white">Block</option>
                  <option value="Local" className="bg-gray-800 text-white">Local</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                <select
                  name="state"
                  defaultValue={editingItem?.state || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                >
                  <option value="" className="bg-gray-800 text-gray-400">Select State</option>
                  {data.states && data.states.length > 0 ? (
                    data.states.map((state: any) => (
                      <option key={state._id} value={state.name} className="bg-gray-800 text-white">
                        {state.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No states available</option>
                  )}
                </select>
                <p className="mt-2 text-sm text-gray-400">Only states added in the system are shown</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  defaultValue={editingItem?.contactEmail || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter contact email"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  defaultValue={editingItem?.contactPhone || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter contact phone (+91-XXXXXXXXXX)"
                  required
                />
              </div>
            </>
          );
        case 'projects':
          return (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingItem?.name || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Component</label>
                <select
                  name="component"
                  defaultValue={editingItem?.component || 'Adarsh Gram'}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                >
                  <option value="Adarsh Gram" className="bg-gray-800 text-white">Adarsh Gram</option>
                  <option value="GIA" className="bg-gray-800 text-white">GIA</option>
                  <option value="Hostel" className="bg-gray-800 text-white">Hostel</option>
                  <option value="Healthcare Infrastructure" className="bg-gray-800 text-white">Healthcare Infrastructure</option>
                  <option value="Telemedicine" className="bg-gray-800 text-white">Telemedicine</option>
                  <option value="Medical Equipment" className="bg-gray-800 text-white">Medical Equipment</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                <select
                  name="state"
                  defaultValue={editingItem?.state || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                >
                  <option value="" className="bg-gray-800 text-gray-400">Select State</option>
                  {data.states && data.states.length > 0 ? (
                    data.states.map((state: any) => (
                      <option key={state._id} value={state.name} className="bg-gray-800 text-white">
                        {state.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No states available</option>
                  )}
                </select>
                <p className="mt-2 text-sm text-gray-400">Only states added in the system are shown</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Agency</label>
                <select
                  name="agency"
                  defaultValue={editingItem?.agency || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                >
                  <option value="" className="bg-gray-800 text-gray-400">Select Agency</option>
                  {data.agencies && data.agencies.length > 0 ? (
                    data.agencies.map((agency: any) => (
                      <option key={agency._id} value={agency.name} className="bg-gray-800 text-white">
                        {agency.name} ({agency.type})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No agencies available</option>
                  )}
                </select>
                <p className="mt-2 text-sm text-gray-400">Only agencies added in the system are shown</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Total Budget</label>
                <input
                  type="number"
                  name="totalBudget"
                  defaultValue={editingItem?.totalBudget || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter total budget (₹)"
                />
              </div>
            </>
          );
        case 'funds':
          return (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
                <select
                  name="projectId"
                  defaultValue={editingItem?.projectId || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                >
                  <option value="" className="bg-gray-800 text-gray-400">Select Project</option>
                  {data.projects && data.projects.length > 0 ? (
                    data.projects.map((project: any) => (
                      <option key={project._id} value={project._id} className="bg-gray-800 text-white">
                        {project.name} - {project.stateId?.name || 'N/A'}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No projects available</option>
                  )}
                </select>
                <p className="mt-2 text-sm text-gray-400">Only projects added in the system are shown</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  name="amount"
                  defaultValue={editingItem?.amount || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter amount (₹)"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Fund Type</label>
                <select
                  name="type"
                  defaultValue={editingItem?.type || 'Installment'}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                >
                  <option value="Initial Allocation" className="bg-gray-800 text-white">Initial Allocation</option>
                  <option value="Installment" className="bg-gray-800 text-white">Installment</option>
                  <option value="Additional Funding" className="bg-gray-800 text-white">Additional Funding</option>
                  <option value="Emergency Fund" className="bg-gray-800 text-white">Emergency Fund</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Purpose</label>
                <input
                  type="text"
                  name="purpose"
                  defaultValue={editingItem?.purpose || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter fund purpose"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">From Agency</label>
                <select
                  name="fromAgencyId"
                  defaultValue={editingItem?.fromAgencyId || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                >
                  <option value="" className="bg-gray-800 text-gray-400">Select Source Agency</option>
                  {data.agencies && data.agencies.length > 0 ? (
                    data.agencies.map((agency: any) => (
                      <option key={agency._id} value={agency._id} className="bg-gray-800 text-white">
                        {agency.name} ({agency.type})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No agencies available</option>
                  )}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">To Agency</label>
                <select
                  name="toAgencyId"
                  defaultValue={editingItem?.toAgencyId || ''}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                >
                  <option value="" className="bg-gray-800 text-gray-400">Select Recipient Agency</option>
                  {data.agencies && data.agencies.length > 0 ? (
                    data.agencies.map((agency: any) => (
                      <option key={agency._id} value={agency._id} className="bg-gray-800 text-white">
                        {agency.name} ({agency.type})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No agencies available</option>
                  )}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Release Date</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={editingItem?.date ? new Date(editingItem.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  name="status"
                  defaultValue={editingItem?.status || 'Pending'}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                >
                  <option value="Completed" className="bg-gray-800 text-white">Completed</option>
                  <option value="Pending" className="bg-gray-800 text-white">Pending</option>
                  <option value="Failed" className="bg-gray-800 text-white">Failed</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Reference Number</label>
                <input
                  type="text"
                  name="referenceNumber"
                  defaultValue={editingItem?.referenceNumber || `REF-${Date.now()}`}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter reference number"
                  required
                />
              </div>
            </>
          );
        default:
          return null;
      }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const formDataObj: any = {};
      
      formData.forEach((value, key) => {
        if (key === 'population' || key === 'totalBudget' || key === 'amount') {
          formDataObj[key] = parseInt(value as string) || 0;
        } else {
          formDataObj[key] = value;
        }
      });

      // Add default values for required fields
      if (activeTab === 'states') {
        formDataObj.totalProjects = editingItem?.totalProjects || 0;
        formDataObj.totalFunding = editingItem?.totalFunding || 0;
        formDataObj.completedProjects = editingItem?.completedProjects || 0;
        formDataObj.ongoingProjects = editingItem?.ongoingProjects || 0;
        formDataObj.plannedProjects = editingItem?.plannedProjects || 0;
        formDataObj.isActive = editingItem?.isActive ?? true;
      } else if (activeTab === 'agencies') {
        // For agencies, ensure stateCode is set from selected state
        if (formDataObj.state && !formDataObj.stateCode && data.states) {
          const selectedState = data.states.find((s: any) => s.name === formDataObj.state);
          if (selectedState) {
            formDataObj.stateCode = selectedState.code;
          }
        }
        formDataObj.isActive = editingItem?.isActive ?? true;
        console.log('Agency data being submitted:', formDataObj);
      } else if (activeTab === 'projects') {
        // For projects, map form fields to backend expected fields
        if (formDataObj.state && data.states) {
          const selectedState = data.states.find((s: any) => s.name === formDataObj.state);
          if (selectedState) {
            formDataObj.stateCode = selectedState.code;
          }
        }
        
        // Map agency name to agency ID
        if (formDataObj.agency && data.agencies) {
          const selectedAgency = data.agencies.find((a: any) => a.name === formDataObj.agency);
          if (selectedAgency) {
            formDataObj.implementingAgency = selectedAgency._id;
          }
        }
        
        // Map totalBudget to fundsAllocated
        if (formDataObj.totalBudget) {
          formDataObj.fundsAllocated = formDataObj.totalBudget;
          delete formDataObj.totalBudget;
        }
        
        // Generate unique project ID if not editing
        if (!editingItem) {
          formDataObj.projectId = `PROJ-${Date.now()}`;
        }
        
        // Remove form-specific fields that backend doesn't need
        delete formDataObj.state;
        delete formDataObj.agency;
        
        formDataObj.status = editingItem?.status || 'Proposed';
        formDataObj.priority = editingItem?.priority || 'Medium';
        formDataObj.fundsUtilized = editingItem?.fundsUtilized || 0;
        formDataObj.fundsPending = (formDataObj.fundsAllocated || 0) - (editingItem?.fundsUtilized || 0);
        formDataObj.beneficiaries = editingItem?.beneficiaries || 0;
        formDataObj.targetBeneficiaries = editingItem?.targetBeneficiaries || 0;
        formDataObj.startDate = editingItem?.startDate || new Date();
        formDataObj.expectedEndDate = editingItem?.expectedEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        formDataObj.isActive = editingItem?.isActive ?? true;
        console.log('Project data being submitted:', formDataObj);
      } else if (activeTab === 'funds') {
        // Map form field names to backend expected names
        if (formDataObj.date) {
          formDataObj.releaseDate = new Date(formDataObj.date);
          delete formDataObj.date;
        }
        
        // Map agency IDs correctly
        if (formDataObj.fromAgencyId) {
          formDataObj.fromAgency = formDataObj.fromAgencyId;
          delete formDataObj.fromAgencyId;
        }
        
        if (formDataObj.toAgencyId) {
          formDataObj.toAgency = formDataObj.toAgencyId;
          delete formDataObj.toAgencyId;
        }
        
        // Set required fields that are missing
        if (formDataObj.projectId && data.projects) {
          const selectedProject = data.projects.find((p: any) => p._id === formDataObj.projectId);
          if (selectedProject) {
            formDataObj.component = selectedProject.component || 'Adarsh Gram';
          }
        }
        
        // Set purpose if not provided
        if (!formDataObj.purpose) {
          formDataObj.purpose = formDataObj.type || 'Fund transfer';
        }
        
        // Generate transaction ID if not provided
        if (!formDataObj.transactionId) {
          formDataObj.transactionId = `TXN-${Date.now()}`;
        }
        
        // Set default values
        formDataObj.status = editingItem?.status || 'Proposed';
        formDataObj.fundType = formDataObj.type || 'Installment';
        console.log('Fund data being submitted:', formDataObj);
      }

      handleSubmit(formDataObj);
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add ${activeTab.slice(0, -1)}`}
              </h3>
              <p className="text-gray-400 text-sm">
                {editingItem ? 'Update the information below' : 'Fill in the details to create a new entry'}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-gray-400 hover:text-white transition-colors duration-300 p-2 hover:bg-gray-700/50 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}
            
            {getFormFields()}
            
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-700/50">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-gray-700/50 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-600/50 transition-all duration-300"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              PM-AJAY Admin Panel
            </h1>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="text-red-400 border-red-400/50 hover:text-red-300 hover:border-red-300 hover:bg-red-400/10 transition-all duration-300"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Luxury Sidebar */}
          <div className="w-72 bg-gradient-to-b from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-200 mb-1">Management Hub</h2>
              <p className="text-sm text-gray-400">Select a module to manage</p>
            </div>
            <nav className="space-y-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-left rounded-xl transition-all duration-300 group ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30 shadow-lg shadow-blue-500/10'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-lg hover:shadow-gray-700/20'
                    }`}
                  >
                    <Icon className={`w-6 h-6 transition-all duration-300 ${
                      activeTab === tab.id ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">{tab.name}</div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-400">
                        Manage {tab.name.toLowerCase()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Luxury Main Content */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-80">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-600"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-400 absolute top-0"></div>
                  </div>
                  <p className="text-gray-400 mt-6 text-lg font-medium">Loading data...</p>
                </div>
              ) : (
                renderContent()
              )}
            </div>
          </div>
        </div>
      </div>
      
      {renderModal()}
    </div>
  );
};

export default AdminPanel;