
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-2xl font-bold text-white hover:text-blue-400 transition-colors duration-200"
          >
            PM-AJAY
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
            >
              Dashboard
            </Link>
            <Link 
              href="/admin" 
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
            >
              States
            </Link>
            <Link 
              href="/agencies" 
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
            >
              Agencies
            </Link>
            <Link 
              href="/projects" 
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
            >
              Projects
            </Link>
            <Link 
              href="/funds" 
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
            >
              Funds
            </Link>
            <Link 
              href="/workflow" 
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 bg-blue-600/20 px-3 py-1 rounded-lg"
            >
              🔄 Workflow
            </Link>
            
            <div className="flex items-center space-x-4 ml-8 pl-8 border-l border-gray-600">
              {session && (
                <NotificationCenter agencyId="60f3e9a9b8e6d4c0a8b4f8e7" />
              )}
              
              {session ? (
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                >
                  Sign Out
                </button>
              ) : (
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white transition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/admin" 
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                States
              </Link>
              <Link 
                href="/agencies" 
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Agencies
              </Link>
              <Link 
                href="/projects" 
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Projects
              </Link>
              <Link 
                href="/funds" 
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Funds
              </Link>
              <Link 
                href="/workflow" 
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                🔄 Workflow
              </Link>
              
              <div className="pt-4 border-t border-gray-700">
                {session ? (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      signOut({ callbackUrl: '/login' });
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link 
                    href="/login" 
                    className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
