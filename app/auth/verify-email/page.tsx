'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, XCircle, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  
  const email = searchParams.get('email') || user?.email || '';
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Start countdown for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    try {
      // In real app, call: await api.auth.resendVerificationEmail({ email });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Verification email sent!');
      setCountdown(60); // 60 seconds cooldown
    } catch (error) {
      toast.error('Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      await refreshUser();
      
      // FIXED: Check if email_verified_at exists and has a value
      const isVerified = user && 'email_verified_at' in user && user.email_verified_at;
      
      if (isVerified) {
        toast.success('Email verified successfully!');
        router.push('/');
      } else {
        toast.info('Email not verified yet. Please check your inbox.');
      }
    } catch (error) {
      toast.error('Failed to check verification status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We've sent a verification link to{' '}
          <span className="font-medium text-gray-900">{email}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="text-left bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">What to do:</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Check your email inbox for a message from Lando Ranch</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Click the verification link in the email</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Return to this page or click the button below to confirm</span>
                  </li>
                </ul>
              </div>

              <div className="text-left bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Didn't receive the email?</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li className="flex items-start">
                    <XCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Check your spam or junk folder</span>
                  </li>
                  <li className="flex items-start">
                    <XCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Make sure you entered the correct email address</span>
                  </li>
                  <li className="flex items-start">
                    <XCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Wait a few minutes and try again</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button
                onClick={handleCheckVerification}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                I've Verified My Email
              </button>

              <button
                onClick={handleResendVerification}
                disabled={isResending || countdown > 0}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {isResending ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Send className="h-5 w-5 mr-2" />
                )}
                {countdown > 0
                  ? `Resend in ${countdown}s`
                  : 'Resend Verification Email'}
              </button>

              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  ← Return to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}