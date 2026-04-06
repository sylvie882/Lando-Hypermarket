'use client';

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

export const GoogleLoginButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // For Google OAuth, you would typically:
      // 1. Redirect to your backend's Google auth endpoint
      // 2. Handle the callback
      // 3. Exchange code for token
      
      // Example flow:
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/social/google`;
      
      // In a real implementation, you might use a popup or redirect flow
      // Here's a simplified version:
      
      // const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/social/google`;
      // const popup = window.open(googleAuthUrl, 'Google Login', 'width=600,height=600');
      
      // Then handle the popup callback
      
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to login with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 className="animate-spin h-5 w-5 mr-2" />
      ) : (
        <FcGoogle className="h-5 w-5 mr-2" />
      )}
      Continue with Google
    </button>
  );
};