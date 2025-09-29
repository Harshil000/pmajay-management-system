// Production error handling middleware
import { NextResponse } from 'next/server';

export function withErrorHandling(handler: Function) {
  return async (request: Request, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      
      // Don't expose sensitive error details in production
      const isProduction = process.env.NODE_ENV === 'production';
      
      return NextResponse.json(
        {
          success: false,
          error: isProduction ? 'Internal server error' : (error as Error).message,
          details: isProduction ? null : error,
        },
        { status: 500 }
      );
    }
  };
}

export function validateEnvironment() {
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function corsHeaders() {
  const origin = process.env.NODE_ENV === 'production' 
    ? 'https://pmajay-management-system.vercel.app'
    : '*';
    
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}