
'use client';

import { useState, useEffect } from 'react';
import { INDIAN_STATES_DATA, getStateByName, formatPopulation, type IndianStateData } from '@/lib/indianStatesData';

interface State {
  _id?: string;
  name: string;
  code?: string;
  population?: number;
}

export default function StateForm({
  onSave,
  initialData,
  onCancel,
}: { onSave: () => void; initialData?: State | null; onCancel?: () => void }) {
  const [inputMode, setInputMode] = useState<'dropdown' | 'manual'>('dropdown');
  const [selectedStateData, setSelectedStateData] = useState<IndianStateData | null>(null);
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [population, setPopulation] = useState(initialData?.population || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code || '');
      setPopulation(initialData.population || 0);
      
      // Check if it matches any predefined state
      const stateData = getStateByName(initialData.name);
      if (stateData) {
        setSelectedStateData(stateData);
        setInputMode('dropdown');
      } else {
        setInputMode('manual');
      }
    } else {
      setName('');
      setCode('');
      setPopulation(0);
      setSelectedStateData(null);
      setInputMode('dropdown');
    }
  }, [initialData]);

  const handleStateSelection = (stateName: string) => {
    if (stateName === 'manual') {
      setInputMode('manual');
      setSelectedStateData(null);
      setName('');
      setCode('');
      setPopulation(0);
    } else if (stateName === '') {
      setSelectedStateData(null);
      setName('');
      setCode('');
      setPopulation(0);
    } else {
      const stateData = getStateByName(stateName);
      if (stateData) {
        setSelectedStateData(stateData);
        setName(stateData.name);
        setCode(stateData.code);
        setPopulation(stateData.population * 100000); // Convert lakhs to actual population
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const method = initialData?._id ? 'PUT' : 'POST';
    const url = initialData?._id ? `/api/states/${initialData._id}` : '/api/states';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name,
          code,
          population 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Clear form after successful save
      setName('');
      setCode('');
      setPopulation(0);
      setSelectedStateData(null);
      setInputMode('dropdown');
      onSave(); // Notify parent component to refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              {initialData?._id ? 'Edit State' : 'Add New State'}
            </h2>
            <p className="text-gray-400">
              {initialData?._id ? 'Update state information' : 'Add a new state or union territory to the system'}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors duration-300 p-2 hover:bg-gray-700/50 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      
        <form onSubmit={handleSubmit} className="space-y-8">
        {/* Always show input mode selection for new states */}
        {!initialData?._id && (
          <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-600/50">
            <label className="block text-lg font-semibold text-gray-200 mb-4">
              Input Method
            </label>
            <div className="flex space-x-8">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="inputMode"
                  value="dropdown"
                  checked={inputMode === 'dropdown'}
                  onChange={() => {
                    setInputMode('dropdown');
                    setName('');
                    setCode('');
                    setPopulation(0);
                    setSelectedStateData(null);
                  }}
                  className="mr-3 text-blue-500 focus:ring-blue-500 focus:ring-2"
                />
                <div className="group-hover:text-white transition-colors duration-300">
                  <span className="text-gray-300 font-medium block">Select from Indian States</span>
                  <span className="text-gray-500 text-sm">Choose from predefined list</span>
                </div>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="inputMode"
                  value="manual"
                  checked={inputMode === 'manual'}
                  onChange={() => {
                    setInputMode('manual');
                    setName('');
                    setCode('');
                    setPopulation(0);
                    setSelectedStateData(null);
                  }}
                  className="mr-3 text-blue-500 focus:ring-blue-500 focus:ring-2"
                />
                <div className="group-hover:text-white transition-colors duration-300">
                  <span className="text-gray-300 font-medium block">Enter Manually</span>
                  <span className="text-gray-500 text-sm">Custom state entry</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Dropdown Mode */}
        {inputMode === 'dropdown' && (
          <div>
            <label htmlFor="stateDropdown" className="block text-lg font-semibold text-gray-200 mb-3">
              Select Indian State or Union Territory
            </label>
            <select
              id="stateDropdown"
              value={selectedStateData?.name || ''}
              onChange={(e) => handleStateSelection(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            >
              <option value="" className="bg-gray-800 text-gray-400">-- Choose a State or Union Territory --</option>
              <optgroup label="States" className="bg-gray-800 text-white">
                {INDIAN_STATES_DATA.filter(state => state.type === 'state').map((state) => (
                  <option key={state.code} value={state.name} className="bg-gray-800 text-white">
                    {state.name} ({state.code})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Union Territories" className="bg-gray-800 text-white">
                {INDIAN_STATES_DATA.filter(state => state.type === 'ut').map((state) => (
                  <option key={state.code} value={state.name} className="bg-gray-800 text-white">
                    {state.name} ({state.code})
                  </option>
                ))}
              </optgroup>
            </select>
            
            {/* Show selected state info */}
            {selectedStateData && (
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl backdrop-blur-sm">
                <h4 className="text-lg font-bold text-blue-300 mb-4">Selected State Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="block text-sm font-medium text-gray-400 mb-1">State Name</span>
                    <p className="text-base font-bold text-white">{selectedStateData.name}</p>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="block text-sm font-medium text-gray-400 mb-1">State Code</span>
                    <p className="text-base font-bold text-blue-400">{selectedStateData.code}</p>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600/30">
                    <span className="block text-sm font-medium text-gray-400 mb-1">Population (2024)</span>
                    <p className="text-base font-bold text-green-400">{formatPopulation(selectedStateData.population)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Mode */}
        {inputMode === 'manual' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-lg font-semibold text-gray-200 mb-3">
                State Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="e.g., Special Economic Zone"
              />
            </div>
            
            <div>
              <label htmlFor="code" className="block text-lg font-semibold text-gray-200 mb-3">
                State Code (2 letters)
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().substring(0, 2))}
                maxLength={2}
                required
                className="mt-1 block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="e.g., SE"
              />
            </div>
            
            <div>
              <label htmlFor="population" className="block text-lg font-semibold text-gray-200 mb-3">
                Population
              </label>
              <input
                type="number"
                id="population"
                value={population || ''}
                onChange={(e) => setPopulation(parseInt(e.target.value) || 0)}
                min="0"
                className="mt-1 block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="e.g., 5000000"
              />
              <p className="mt-2 text-sm text-gray-400">Enter the total population count (optional)</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 font-medium">Error: {error}</p>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-gray-700/50">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg bg-gray-700/50 border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-600/50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || (!name.trim())}
            className={`${onCancel ? 'flex-1' : 'w-full'} py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg transform hover:scale-105 ${
              loading || (!name.trim())
                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-blue-500/25'
            }`}
          >
            {loading ? 'Saving...' : initialData?._id ? 'Update State' : 'Add State'}
          </button>
        </div>
      </form>
    </div>
  </div>
  );
}
