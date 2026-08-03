import React from 'react';
import Link from 'next/link';
import { 
  Shield, 
  ChevronRight, 
  Clock, 
  Lock, 
  Eye, 
  Database, 
  Mail, 
  Phone,
  FileText
} from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12 md:py-16">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-lg text-green-50 mb-4">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <div className="flex items-center text-sm text-green-100">
            <Clock size={16} className="mr-2" />
            <span>Last Updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-3">
          <div className="flex items-center text-sm">
            <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
              Home
            </Link>
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            <span className="text-gray-900 font-medium">Privacy Policy</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="px-4 sm:px-6 md:px-8 lg:px-12 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 lg:p-10">
          
          {/* Introduction */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment to Privacy</h2>
            <p className="text-gray-700 mb-4">
              At Lando Hypermarket, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make purchases from our store.
            </p>
            <p className="text-gray-700">
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </div>

          {/* Information We Collect */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Database size={20} className="mr-2 text-green-600" />
              Information We Collect
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
                <p className="text-gray-700 mb-2">
                  We may collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Register for an account</li>
                  <li>Make a purchase</li>
                  <li>Sign up for our newsletter</li>
                  <li>Contact our customer service</li>
                  <li>Participate in promotions or surveys</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  This information may include your name, email address, phone number, shipping address, billing address, and payment information.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Automatically Collected Information</h4>
                <p className="text-gray-700 mb-2">
                  When you visit our website, we may automatically collect certain information about your device and usage, including:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Pages you visit and time spent</li>
                  <li>Referring website addresses</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Continue with the rest of your content sections... */}
          {/* Make sure to remove any max-w-4xl mx-auto containers */}

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h3>
            <p className="text-gray-700 mb-4">
              If you have questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-green-600" />
                <a href="mailto:privacy@landohypermarket.com" className="text-gray-700 hover:text-green-600 transition-colors">
                  privacy@landohypermarket.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-green-600" />
                <a href="tel:+254716354589" className="text-gray-700 hover:text-green-600 transition-colors">
                  +254 716 354 589
                </a>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-green-600 mt-1" />
                <address className="text-gray-700 not-italic">
                  Lando Hypermarket<br />
                  Nairobi, Kenya
                </address>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}