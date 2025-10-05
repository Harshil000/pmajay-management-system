'use client';

import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function SeedDemoUsersPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seed/demo-users', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to seed users' });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Seed Demo Users</h1>
          <p className="text-gray-600 mb-6">
            Click the button below to seed demo users for testing all roles.
          </p>
          
          <Button 
            onClick={handleSeed} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Seeding...' : 'Seed Demo Users'}
          </Button>

          {result && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Result:</h2>
              <div className={`p-4 rounded ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <p className="font-medium">{result.message || result.error}</p>
                
                {result.results && (
                  <div className="mt-3">
                    <h3 className="font-medium">Details:</h3>
                    <ul className="mt-1 space-y-1">
                      {result.results.map((item: string, index: number) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.credentials && (
                  <div className="mt-3">
                    <h3 className="font-medium">Available Credentials:</h3>
                    <ul className="mt-1 space-y-1">
                      {result.credentials.map((cred: string, index: number) => (
                        <li key={index} className="text-sm font-mono bg-gray-100 p-1 rounded">
                          {cred}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}