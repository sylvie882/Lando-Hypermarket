import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Leaf } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Authentication - Lando Ranch',
  description: 'Login or create an account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Leaf className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-3">
              <h2 className="text-2xl font-bold text-gray-900">Lando Ranch</h2>
              <p className="text-sm text-gray-600">Fresh Produce Delivery</p>
            </div>
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}