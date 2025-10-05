'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      console.error(result.error);
      setError('Invalid email or password');
    } else {
      const session = await getSession();
      
      if ((session?.user as any)?.role === 'Super Admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
    setIsLoading(false);
  };

  const quickLogin = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full flex gap-8">
        <div className="flex-1 max-w-md">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-gray-300">Sign in to PM-AJAY Dashboard</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:bg-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:bg-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
                  <p className="text-sm text-red-300 text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="flex-1 max-w-lg">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2"> Demo Credentials</h3>
              <p className="text-gray-400 text-sm">Click any credential to auto-fill login form</p>
            </div>

            <div className="space-y-3">
              <div 
                onClick={() => quickLogin('super.admin@pmjay.gov.in', 'Super@123')}
                className="flex justify-between items-center p-3 rounded-lg bg-purple-900/30 border border-purple-500/30 hover:bg-purple-900/50 cursor-pointer transition-all duration-200"
              >
                <div>
                  <div className="text-sm font-medium text-purple-300"> Super Admin</div>
                  <div className="text-xs text-gray-400">Complete system control</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-purple-200">super.admin@pmjay.gov.in</div>
                  <div className="text-xs font-mono text-purple-200">Super@123</div>
                </div>
              </div>

              <div 
                onClick={() => quickLogin('central.admin@pmjay.gov.in', 'Central@123')}
                className="flex justify-between items-center p-3 rounded-lg bg-blue-900/30 border border-blue-500/30 hover:bg-blue-900/50 cursor-pointer transition-all duration-200"
              >
                <div>
                  <div className="text-sm font-medium text-blue-300"> Central Admin</div>
                  <div className="text-xs text-gray-400">National level access</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-blue-200">central.admin@pmjay.gov.in</div>
                  <div className="text-xs font-mono text-blue-200">Central@123</div>
                </div>
              </div>

              <div 
                onClick={() => quickLogin('state.admin@pmjay.gov.in', 'State@123')}
                className="flex justify-between items-center p-3 rounded-lg bg-green-900/30 border border-green-500/30 hover:bg-green-900/50 cursor-pointer transition-all duration-200"
              >
                <div>
                  <div className="text-sm font-medium text-green-300"> State Admin</div>
                  <div className="text-xs text-gray-400">Maharashtra state access</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-green-200">state.admin@pmjay.gov.in</div>
                  <div className="text-xs font-mono text-green-200">State@123</div>
                </div>
              </div>

              <div 
                onClick={() => quickLogin('local.admin@pmjay.gov.in', 'Local@123')}
                className="flex justify-between items-center p-3 rounded-lg bg-yellow-900/30 border border-yellow-500/30 hover:bg-yellow-900/50 cursor-pointer transition-all duration-200"
              >
                <div>
                  <div className="text-sm font-medium text-yellow-300"> Local Admin</div>
                  <div className="text-xs text-gray-400">Agency level access</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-yellow-200">local.admin@pmjay.gov.in</div>
                  <div className="text-xs font-mono text-yellow-200">Local@123</div>
                </div>
              </div>

              <div 
                onClick={() => quickLogin('viewer@pmjay.gov.in', 'Viewer@123')}
                className="flex justify-between items-center p-3 rounded-lg bg-gray-700/30 border border-gray-500/30 hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
              >
                <div>
                  <div className="text-sm font-medium text-gray-300"> Viewer</div>
                  <div className="text-xs text-gray-400">Read-only access</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-gray-200">viewer@pmjay.gov.in</div>
                  <div className="text-xs font-mono text-gray-200">Viewer@123</div>
                </div>
              </div>

              <div 
                onClick={() => quickLogin('admin@pmjay.gov.in', 'Admin@2024')}
                className="flex justify-between items-center p-3 rounded-lg bg-orange-900/30 border border-orange-500/30 hover:bg-orange-900/50 cursor-pointer transition-all duration-200"
              >
                <div>
                  <div className="text-sm font-medium text-orange-300"> Current Admin</div>
                  <div className="text-xs text-gray-400">Working credential</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-orange-200">admin@pmjay.gov.in</div>
                  <div className="text-xs font-mono text-orange-200">Admin@2024</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-blue-300 font-medium mb-1"> First Time Setup</p>
                <p className="text-xs text-gray-400 mb-2">Demo accounts need activation:</p>
                <a 
                  href="/seed-test.html" 
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors duration-200"
                >
                   Activate Demo Accounts
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
