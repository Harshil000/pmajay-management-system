'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface AdminPanelProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface FormField {
  name: string;
  value: string;
  isValid: boolean;
  error?: string;
}

interface FormState {
  [key: string]: FormField;
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
  const [editingItem, setEditingItem] = useState<any>(null);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState<FormState>({});
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

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
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateField = (name: string, value: string, formData: FormState): { isValid: boolean; error?: string } => {
    switch (name) {
      case 'name':
        if (!value.trim()) return { isValid: false, error: 'Name is required' };
        if (value.length < 2) return { isValid: false, error: 'Name must be at least 2 characters' };
        return { isValid: true };
      
      case 'code':
      case 'stateCode':
        if (!value.trim()) return { isValid: false, error: 'Code is required' };
        if (value.length !== 2) return { isValid: false, error: 'Code must be exactly 2 characters' };
        if (!/^[A-Z]{2}$/.test(value)) return { isValid: false, error: 'Code must be 2 uppercase letters' };
        return { isValid: true };
      
      case 'population':
        if (!value) return { isValid: true }; // Optional field
        const popValue = parseInt(value);
        if (isNaN(popValue) || popValue < 0) return { isValid: false, error: 'Population must be a positive number' };
        return { isValid: true };
      
      case 'contactEmail':
        if (!value.trim()) return { isValid: false, error: 'Email is required' };
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return { isValid: false, error: 'Please enter a valid email address' };
        return { isValid: true };
      
      case 'contactPhone':
        if (!value.trim()) return { isValid: false, error: 'Phone number is required' };
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) return { isValid: false, error: 'Please enter a valid phone number' };
        return { isValid: true };
      
      case 'fundsAllocated':
      case 'amount':
        if (!value) return { isValid: false, error: 'Amount is required' };
        const amountValue = parseFloat(value);
        if (isNaN(amountValue) || amountValue <= 0) return { isValid: false, error: 'Amount must be a positive number' };
        return { isValid: true };
      
      case 'state':
        if (activeTab === 'agencies' && !value.trim()) {
          return { isValid: false, error: 'State is required for agencies' };
        }
        return { isValid: true };
      
      case 'stateId':
        if (activeTab === 'projects' && !value.trim()) {
          return { isValid: false, error: 'State selection is required for projects' };
        }
        return { isValid: true };
      
      case 'agencyId':
        if (activeTab === 'projects' && !value.trim()) {
          return { isValid: false, error: 'Agency selection is required for projects' };
        }
        return { isValid: true };
      
      case 'projectId':
        if (activeTab === 'funds' && !value.trim()) {
          return { isValid: false, error: 'Project selection is required for fund flows' };
        }
        return { isValid: true };
      
      case 'component':
        if (activeTab === 'funds' && !value.trim()) {
          return { isValid: false, error: 'Component selection is required for fund flows' };
        }
        return { isValid: true };
      
      case 'purpose':
        if (activeTab === 'funds' && !value.trim()) {
          return { isValid: false, error: 'Purpose is required for fund flows' };
        }
        return { isValid: true };
      
      case 'fromAgency':
        if (activeTab === 'funds' && !value.trim()) {
          return { isValid: false, error: 'From Agency selection is required for fund flows' };
        }
        return { isValid: true };
      
      case 'toAgency':
        if (activeTab === 'funds' && !value.trim()) {
          return { isValid: false, error: 'To Agency selection is required for fund flows' };
        }
        return { isValid: true };
      
      default:
        return { isValid: true };
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    const validation = validateField(name, value, formState);
    
    setFormState(prev => ({
      ...prev,
      [name]: {
        name,
        value,
        isValid: validation.isValid,
        error: validation.error
      }
    }));

    setValidationErrors(prev => ({
      ...prev,
      [name]: validation.error || ''
    }));

    // Auto-generate stateCode when state is selected
    if (name === 'state' && activeTab === 'agencies') {
      const selectedState = data.states?.find((state: any) => state.name === value);
      if (selectedState) {
        const stateCodeValidation = validateField('stateCode', selectedState.code, formState);
        setFormState(prev => ({
          ...prev,
          stateCode: {
            name: 'stateCode',
            value: selectedState.code,
            isValid: stateCodeValidation.isValid,
            error: stateCodeValidation.error
          }
        }));
      }
    }

    // Auto-generate stateCode when stateId is selected for projects
    if (name === 'stateId' && activeTab === 'projects') {
      const selectedState = data.states?.find((state: any) => state._id === value);
      if (selectedState) {
        const stateCodeValidation = validateField('stateCode', selectedState.code, formState);
        setFormState(prev => ({
          ...prev,
          stateCode: {
            name: 'stateCode',
            value: selectedState.code,
            isValid: stateCodeValidation.isValid,
            error: stateCodeValidation.error
          }
        }));
      }
    }
  };

  const isFormValid = (): boolean => {
    const requiredFields = getRequiredFields();
    return requiredFields.every(field => {
      const fieldState = formState[field];
      return fieldState && fieldState.isValid && fieldState.value.trim() !== '';
    });
  };

  const getRequiredFields = (): string[] => {
    switch (activeTab) {
      case 'states':
        return ['name', 'code'];
      case 'agencies':
        return ['name', 'type', 'state', 'stateCode', 'contactEmail', 'contactPhone'];
      case 'projects':
        return ['name', 'component', 'stateId', 'agencyId', 'fundsAllocated'];
      case 'funds':
        return ['projectId', 'amount', 'component', 'purpose', 'fromAgency', 'toAgency'];
      default:
        return [];
    }
  };

  const initializeFormState = (item?: any) => {
    const fields = getFormFieldsConfig();
    const initialState: FormState = {};
    
    fields.forEach(field => {
      const defaultValue = (field as any).defaultValue || '';
      const value = item?.[field.name] || defaultValue || '';
      const validation = validateField(field.name, value, {});
      
      initialState[field.name] = {
        name: field.name,
        value: String(value),
        isValid: validation.isValid,
        error: validation.error
      };
    });
    
    setFormState(initialState);
    setValidationErrors({});
  };

  const getFormFieldsConfig = () => {
    switch (activeTab) {
      case 'states':
        return [
          { name: 'name', type: 'text', label: 'State Name', required: true },
          { name: 'code', type: 'text', label: 'State Code', required: true, maxLength: 2 },
          { name: 'population', type: 'number', label: 'Population', required: false }
        ];
      case 'agencies':
        return [
          { name: 'name', type: 'text', label: 'Agency Name', required: true },
          { name: 'code', type: 'text', label: 'Agency Code', required: true, maxLength: 10 },
          { name: 'type', type: 'select', label: 'Agency Type', required: true, options: [
            { value: 'Implementing Agency', label: 'Implementing Agency' },
            { value: 'Executing Agency', label: 'Executing Agency' },
            { value: 'Nodal Agency', label: 'Nodal Agency' },
            { value: 'Monitoring Agency', label: 'Monitoring Agency' }
          ]},
          { name: 'level', type: 'select', label: 'Administrative Level', required: true, options: [
            { value: 'Central', label: 'Central' },
            { value: 'State', label: 'State' },
            { value: 'District', label: 'District' },
            { value: 'Block', label: 'Block' },
            { value: 'Local', label: 'Local' }
          ]},
          { name: 'state', type: 'select', label: 'State', required: true, 
            options: data.states?.map((state: any) => ({ value: state.name, label: state.name })) || []
          },
          { name: 'stateCode', type: 'text', label: 'State Code', required: true, maxLength: 2, 
            dependsOn: 'state', auto: true },
          { name: 'contactEmail', type: 'email', label: 'Contact Email', required: true },
          { name: 'contactPhone', type: 'tel', label: 'Contact Phone', required: true }
        ];
      case 'projects':
        return [
          { name: 'name', type: 'text', label: 'Project Name', required: true },
          { name: 'component', type: 'select', label: 'Component', required: true, options: [
            { value: 'Adarsh Gram', label: 'Adarsh Gram' },
            { value: 'GIA', label: 'GIA' },
            { value: 'Hostel', label: 'Hostel' }
          ]},
          { name: 'stateId', type: 'select', label: 'State', required: true,
            options: data.states?.map((state: any) => ({ value: state._id, label: state.name })) || []
          },
          { name: 'stateCode', type: 'text', label: 'State Code', required: false, 
            dependsOn: 'stateId', auto: true },
          { name: 'agencyId', type: 'select', label: 'Implementing Agency', required: true,
            dependsOn: 'stateId',
            options: data.agencies?.map((agency: any) => ({ value: agency._id, label: agency.name })) || []
          },
          { name: 'fundsAllocated', type: 'number', label: 'Total Budget (Funds Allocated)', required: true },
          { name: 'startDate', type: 'date', label: 'Start Date', required: false,
            defaultValue: new Date().toISOString().split('T')[0] },
          { name: 'expectedEndDate', type: 'date', label: 'Expected End Date', required: false,
            defaultValue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { name: 'description', type: 'textarea', label: 'Description', required: false }
        ];
      case 'funds':
        return [
          { name: 'projectId', type: 'select', label: 'Project', required: true,
            options: data.projects?.map((project: any) => ({ value: project._id, label: project.name })) || []
          },
          { name: 'component', type: 'select', label: 'Component', required: true, options: [
            { value: 'Adarsh Gram', label: 'Adarsh Gram' },
            { value: 'GIA', label: 'GIA' },
            { value: 'Hostel', label: 'Hostel' }
          ]},
          { name: 'purpose', type: 'text', label: 'Purpose', required: true },
          { name: 'fromAgency', type: 'select', label: 'From Agency', required: true,
            options: data.agencies?.map((agency: any) => ({ value: agency._id, label: agency.name })) || []
          },
          { name: 'toAgency', type: 'select', label: 'To Agency', required: true,
            options: data.agencies?.map((agency: any) => ({ value: agency._id, label: agency.name })) || []
          },
          { name: 'amount', type: 'number', label: 'Amount', required: true },
          { name: 'releaseDate', type: 'date', label: 'Release Date', required: true, 
            defaultValue: new Date().toISOString().split('T')[0] },
          { name: 'status', type: 'select', label: 'Status', required: true, options: [
            { value: 'Proposed', label: 'Proposed' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Released', label: 'Released' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Under Review', label: 'Under Review' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'On Hold', label: 'On Hold' }
          ]},
          { name: 'transactionId', type: 'text', label: 'Transaction ID', required: false },
          { name: 'remarks', type: 'textarea', label: 'Remarks', required: false }
        ];
      default:
        return [];
    }
  };

  const getFilteredOptions = (field: any): any[] => {
    if (!field.dependsOn || !field.options) return field.options;
    
    const dependentValue = formState[field.dependsOn]?.value;
    if (!dependentValue) return [];
    
    // Custom filtering logic based on dependencies
    if (field.name === 'agencyId' && field.dependsOn === 'stateId') {
      const selectedState = data.states?.find((s: any) => s._id === dependentValue);
      if (!selectedState) return [];
      
      // Filter agencies by state name or state code, handle case variations
      const filteredAgencies = data.agencies?.filter((agency: any) => {
        if (!agency) return false;
        
        const agencyState = (agency.state || '').toLowerCase().trim();
        const agencyStateCode = (agency.stateCode || '').toLowerCase().trim();
        const selectedStateName = (selectedState.name || '').toLowerCase().trim();
        const selectedStateCode = (selectedState.code || '').toLowerCase().trim();
        
        return agencyState === selectedStateName || 
               agencyStateCode === selectedStateCode ||
               agencyState === selectedStateCode ||
               agencyStateCode === selectedStateName;
      }) || [];
      
      console.log('Filtering agencies for state:', selectedState, 'found:', filteredAgencies.length);
      
      return filteredAgencies.map((agency: any) => ({ value: agency._id, label: agency.name }));
    }
    
    return field.options;
  };

  const handleAdd = () => {
    setEditingItem(null);
    setError('');
    initializeFormState();
    setShowAddModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setError('');
    initializeFormState(item);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setError('Please fill in all required fields correctly');
      return;
    }

    try {
      setError('');
      const formData: any = {};
      
      Object.values(formState).forEach(field => {
        if (field.name === 'population' || field.name === 'fundsAllocated' || field.name === 'amount') {
          formData[field.name] = parseFloat(field.value) || 0;
        } else {
          formData[field.name] = field.value;
        }
      });

      // Add default values for required backend fields
      if (activeTab === 'states') {
        formData.totalProjects = editingItem?.totalProjects || 0;
        formData.totalFunding = editingItem?.totalFunding || 0;
        formData.completedProjects = editingItem?.completedProjects || 0;
        formData.ongoingProjects = editingItem?.ongoingProjects || 0;
        formData.plannedProjects = editingItem?.plannedProjects || 0;
        formData.isActive = editingItem?.isActive ?? true;
      } else if (activeTab === 'agencies') {
        formData.isActive = editingItem?.isActive ?? true;
        formData.address = editingItem?.address || '';
      } else if (activeTab === 'projects') {
        // Required fields mapping
        formData.implementingAgency = formData.agencyId; // Map agencyId to implementingAgency
        // No longer need to map totalBudget since we're using fundsAllocated directly
        formData.projectId = `PRJ-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`; // Generate unique projectId
        
        // Timeline fields (required)
        formData.startDate = editingItem?.startDate || new Date();
        formData.expectedEndDate = editingItem?.expectedEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
        
        // Status (use valid enum value)
        formData.status = editingItem?.status || 'Proposed'; // Valid enum value instead of 'Planning'
        formData.priority = editingItem?.priority || 'Medium';
        
        // Optional fields with defaults
        formData.fundsUtilized = editingItem?.fundsUtilized || 0;
        formData.fundsPending = editingItem?.fundsPending || 0;
        formData.beneficiaries = editingItem?.beneficiaries || 0;
        formData.isActive = editingItem?.isActive ?? true;
        formData.tags = editingItem?.tags || [];
        formData.milestones = editingItem?.milestones || [];
        formData.stateCode = data.states?.find((s: any) => s._id === formData.stateId)?.code || '';
      } else if (activeTab === 'funds') {
        formData.date = new Date(formData.releaseDate);
        formData.approvedBy = editingItem?.approvedBy || 'System Admin';
        formData.type = editingItem?.type || 'Project Fund';
        formData.referenceNumber = editingItem?.referenceNumber || `REF-${Date.now()}`;
      }

      const url = editingItem ? `/api/${activeTab}/${editingItem._id}` : `/api/${activeTab}`;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowAddModal(false);
        setEditingItem(null);
        setFormState({});
        fetchData(); // Refresh data
      } else {
        setError(result.error || 'An error occurred while saving');
      }
    } catch (error: any) {
      console.error(`Error saving ${activeTab}:`, error);
      setError(error.message || 'Network error occurred');
    }
  };

  const renderFormField = (field: any) => {
    const fieldState = formState[field.name] || { value: '', isValid: true };
    const hasError = validationErrors[field.name];
    const isDisabled = field.dependsOn && !formState[field.dependsOn]?.value;
    
    // Auto-fill dependent fields
    if (field.auto && field.dependsOn) {
      const dependentValue = formState[field.dependsOn]?.value;
      if (dependentValue && field.name === 'stateCode') {
        const selectedState = data.states?.find((s: any) => s.name === dependentValue);
        if (selectedState && fieldState.value !== selectedState.code) {
          handleFieldChange(field.name, selectedState.code);
        }
      }
    }

    const baseClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
      hasError 
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    } ${isDisabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 text-white'}`;           return (
      <div key={field.name} className="mb-4">
        <label className="block text-sm font-medium text-gray-200 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {isDisabled && <span className="text-gray-400 ml-2">(Select {field.dependsOn === 'stateId' ? 'state' : field.dependsOn} first)</span>}
        </label>
        
        {field.type === 'select' ? (
          <select
            value={fieldState.value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClasses}
            required={field.required}
            disabled={isDisabled}
          >
            <option value="">
              {isDisabled 
                ? `Select ${field.dependsOn === 'stateId' ? 'state' : field.dependsOn} first...` 
                : field.dependsOn && getFilteredOptions(field).length === 0 
                  ? `No ${field.label.toLowerCase()} available for selected ${field.dependsOn === 'stateId' ? 'state' : field.dependsOn}`
                  : `Select ${field.label.toLowerCase()}...`
              }
            </option>
            {getFilteredOptions(field).map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            value={fieldState.value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClasses}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            rows={3}
            required={field.required}
            disabled={isDisabled}
          />
        ) : (
          <input
            type={field.type || 'text'}
            value={fieldState.value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClasses}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            maxLength={field.maxLength}
            required={field.required}
            disabled={isDisabled}
          />
        )}
        
        {hasError && (
          <div className="flex items-center gap-1 mt-1">
            <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600">{hasError}</p>
          </div>
        )}
        
        {fieldState.isValid && fieldState.value && !hasError && (
          <div className="flex items-center gap-1 mt-1">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <p className="text-sm text-green-600">Valid</p>
          </div>
        )}
      </div>
    );
  };

  // Rest of the component remains the same (renderStates, renderAgencies, etc.)
  // ... (keeping the existing render functions for brevity)

  const renderModal = () => {
    if (!showAddModal) return null;
    
    const fields = getFormFieldsConfig();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add ${activeTab.slice(0, -1)}`}
            </h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <ExclamationCircleIcon className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {fields.map(renderFormField)}
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className={`flex-1 ${
                isFormValid() 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={handleSubmit}
              disabled={!isFormValid()}
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
          
          {!isFormValid() && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please fill in all required fields to continue
            </p>
          )}
        </div>
      </div>
    );
  };

  // Simplified render functions for brevity - using the same structure as original
  const renderContent = () => {
    switch (activeTab) {
      case 'states': return renderStates();
      case 'agencies': return renderAgencies();
      case 'projects': return renderProjects();
      case 'funds': return renderFunds();
      default: return renderStates();
    }
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

  const formatCurrency = (amount: number | null | undefined) => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(safeAmount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-IN');
  };

  const renderStates = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">States Management</h3>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add State
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {data.states.map((state: any) => (
          <Card key={state._id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-white">{state.name}</h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {state.code}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    state.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {state.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Population</p>
                    <div className="font-medium">{(state.population || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Projects</p>
                    <div className="font-medium">{state.totalProjects || 0}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Funding</p>
                    <div className="font-medium">{formatCurrency(state.totalFunding || 0)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Completed</p>
                    <div className="font-medium">{state.completedProjects || 0}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(state)}>
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(state._id)} className="text-red-600 hover:text-red-700">
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Agencies Management</h3>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Agency
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {data.agencies.map((agency: any) => (
          <Card key={agency._id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-white">{agency.name}</h4>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                    {agency.type}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    agency.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {agency.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">State</p>
                    <div className="font-medium">{agency.state} ({agency.stateCode})</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Contact Email</p>
                    <div className="font-medium text-blue-600">{agency.contactEmail}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Contact Phone</p>
                    <div className="font-medium">{agency.contactPhone}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(agency)}>
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(agency._id)} className="text-red-600 hover:text-red-700">
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Projects Management</h3>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {data.projects.map((project: any) => (
          <Card key={project._id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-white">{project.name}</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    {project.component}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">State</p>
                    <div className="font-medium">{project.stateCode || 'N/A'}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Agency</p>
                    <div className="font-medium">{project.implementingAgency?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Budget</p>
                    <div className="font-medium">{formatCurrency(project.fundsAllocated)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Progress</p>
                    <div className="font-medium">{Math.round((project.fundsUtilized / project.fundsAllocated) * 100) || 0}%</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(project)}>
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(project._id)} className="text-red-600 hover:text-red-700">
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Fund Flows Management</h3>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Fund Flow
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {data.funds.map((fund: any) => (
          <Card key={fund._id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-white">{formatCurrency(fund.amount)}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    fund.status === 'Released' ? 'bg-green-100 text-green-800' :
                    fund.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {fund.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Project</p>
                    <div className="font-medium">{fund.projectId?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Component</p>
                    <div className="font-medium">{fund.component || 'N/A'}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">From Agency</p>
                    <div className="font-medium">{fund.fromAgency?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">To Agency</p>
                    <div className="font-medium">{fund.toAgency?.name || 'N/A'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Purpose</p>
                    <div className="font-medium">{fund.purpose || 'N/A'}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Release Date</p>
                    <div className="font-medium">{formatDate(fund.releaseDate)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">Transaction ID</p>
                    <div className="font-medium">{fund.transactionId || 'N/A'}</div>
                  </div>
                  <div></div>
                </div>
                {fund.remarks && (
                  <div className="mt-2 text-sm">
                    <p className="text-gray-600">Remarks:</p>
                    <p className="text-gray-800">{fund.remarks}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(fund)}>
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(fund._id)} className="text-red-600 hover:text-red-700">
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-white">
              PM-AJAY Admin Panel - Enhanced
            </h1>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="text-red-400 hover:text-red-300 border-gray-600"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-900/30 text-blue-300 border border-blue-800'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
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