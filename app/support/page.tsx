// app/support/page.tsx
'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock, 
  MapPin, 
  HelpCircle,
  CheckCircle,
  Send,
  ArrowRight,
  Shield,
  Headphones,
  AlertCircle,
  User,
  Mail as MailIcon,
  FileText,
  AlertTriangle,
  Tag,
  Package,
  Truck,
  CreditCard,
  UserCircle,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';

const SupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general',
    order_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketInfo, setTicketInfo] = useState<{
    ticket_number: string;
    name: string;
    email: string;
    subject: string;
    priority: string;
    category: string;
    status: string;
    created_at: string;
    estimated_response_time: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Send support request to your public endpoint
      const response = await fetch('http://localhost:8000/api/support/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(data.message || 'Failed to submit support ticket');
      }

      if (data.success) {
        setSubmitSuccess(true);
        setTicketInfo(data.data);
        setFormData({ 
          name: '', 
          email: '', 
          subject: '', 
          description: '', 
          priority: 'medium',
          category: 'general',
          order_id: ''
        });
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (error: any) {
      console.error('Failed to submit form:', error);
      setError(error.message || 'Failed to submit support request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'order': return <ShoppingBag size={16} className="text-orange-500" />;
      case 'delivery': return <Truck size={16} className="text-blue-500" />;
      case 'product': return <Package size={16} className="text-green-500" />;
      case 'payment': return <CreditCard size={16} className="text-purple-500" />;
      case 'account': return <UserCircle size={16} className="text-red-500" />;
      default: return <HelpCircle size={16} className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Browse products, add to cart, and checkout. You can also call us for phone orders.'
    },
    {
      question: 'What are your delivery hours?',
      answer: 'We deliver daily from 7 AM to 8 PM. Same-day delivery for orders placed before 2 PM.'
    },
    {
      question: 'How do I track my order?',
      answer: 'After placing your order, you\'ll receive a tracking link via email and SMS.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We accept returns within 24 hours for quality issues. Contact support for assistance.'
    },
    {
      question: 'Do you offer bulk discounts?',
      answer: 'Yes! Contact our sales team for custom quotes on large orders.'
    },
    {
      question: 'Are your products organic?',
      answer: 'All our products are 100% organic and sourced directly from local farms.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6">
              <Headphones size={18} />
              <span className="text-sm font-semibold">24/7 Support</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              We're Here to <span className="text-yellow-300">Help</span>
            </h1>
            
            <p className="text-xl text-white/95 mb-8 max-w-2xl">
              Get assistance with orders, deliveries, products, or anything else you need.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Phone Support */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <Phone size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Call Us</h3>
              <p className="text-gray-600 mb-4">
                Speak directly with our support team
              </p>
              <div className="space-y-2">
                <a 
                  href="tel:+254712345678" 
                  className="block text-2xl font-bold text-gray-900 hover:text-green-600 transition-colors"
                >
                  +254 712 345 678
                </a>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <span className="text-sm">Mon-Sun: 7 AM - 8 PM</span>
                </div>
              </div>
            </div>

            {/* Email Support */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <Mail size={28} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Email Us</h3>
              <p className="text-gray-600 mb-4">
                Get a response within 2 hours
              </p>
              <div className="space-y-2">
                <a 
                  href="mailto:support@landoranch.com" 
                  className="block text-lg font-medium text-gray-900 hover:text-green-600 transition-colors truncate"
                >
                  support@landoranch.com
                </a>
                <a 
                  href="mailto:orders@landoranch.com" 
                  className="block text-lg font-medium text-gray-900 hover:text-green-600 transition-colors truncate"
                >
                  orders@landoranch.com
                </a>
              </div>
            </div>

            {/* Visit Us */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-6">
                <MapPin size={28} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Visit Us</h3>
              <p className="text-gray-600 mb-4">
                Our farm and office location
              </p>
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">
                  Lando Ranch Main Office
                </p>
                <p className="text-gray-600 text-sm">
                  Kiambu Road, Nairobi<br />
                  Open: Mon-Fri 8 AM - 5 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form & FAQs */}
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare size={24} className="text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
              </div>
              
              {submitSuccess && ticketInfo ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                    <h3 className="text-xl font-bold text-gray-900">Support Ticket Created!</h3>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 mb-6 border border-green-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Ticket ID</p>
                        <p className="font-bold text-lg text-gray-900 flex items-center gap-2">
                          <Tag size={16} />
                          {ticketInfo.ticket_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Priority</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticketInfo.priority)}`}>
                          {ticketInfo.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-700">{ticketInfo.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MailIcon size={16} className="text-gray-400" />
                        <span className="text-gray-700">{ticketInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(ticketInfo.category)}
                        <span className="text-gray-700 capitalize">{ticketInfo.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-gray-700">{ticketInfo.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-gray-700">
                          Estimated response: {ticketInfo.estimated_response_time}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    We've sent a confirmation email to <strong>{ticketInfo.email}</strong>. 
                    Our team will contact you within {ticketInfo.estimated_response_time}.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Submit Another Request
                    </button>
                    <Link
                      href="/"
                      className="px-6 py-3 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:border-gray-400 transition-colors inline-flex items-center justify-center"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle size={20} className="text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Error</p>
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order ID (Optional)
                    </label>
                    <input
                      type="text"
                      name="order_id"
                      value={formData.order_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="ORD-123456"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Include your order ID for faster resolution of order-related issues
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="order">Order Issue</option>
                        <option value="delivery">Delivery Question</option>
                        <option value="product">Product Inquiry</option>
                        <option value="payment">Payment Issue</option>
                        <option value="account">Account Help</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority *
                      </label>
                      <select
                        name="priority"
                        required
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={5}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Please describe your issue in detail..."
                      minLength={10}
                      maxLength={2000}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Minimum 10 characters, maximum 2000 characters
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        <span>Create Support Ticket</span>
                      </>
                    )}
                  </button>
                  
                  <p className="text-sm text-gray-500 text-center">
                    By submitting, you agree to our terms and privacy policy. 
                    We typically respond within 2 hours.
                  </p>
                </form>
              )}
            </div>

            {/* FAQs */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle size={24} className="text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
              </div>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-green-300 transition-colors">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 ml-9">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Quick Links */}
              <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <Link href="/orders" className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors group">
                    <span className="font-medium text-gray-900 group-hover:text-green-600">Track Your Order</span>
                    <ArrowRight size={18} className="text-gray-400 group-hover:text-green-600" />
                  </Link>
                  <Link href="/products" className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors group">
                    <span className="font-medium text-gray-900 group-hover:text-green-600">Browse Products</span>
                    <ArrowRight size={18} className="text-gray-400 group-hover:text-green-600" />
                  </Link>
                  <Link href="/account" className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors group">
                    <span className="font-medium text-gray-900 group-hover:text-green-600">Account Settings</span>
                    <ArrowRight size={18} className="text-gray-400 group-hover:text-green-600" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guarantee Section */}
      <div className="py-12 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
              <Shield size={18} />
              <span className="text-sm font-semibold">Our Support Guarantee</span>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Why Choose Lando Ranch Support?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle size={28} className="text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Ticket Tracking</h3>
                <p className="text-gray-600">
                  Every request gets a unique ticket ID for easy tracking and follow-up
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <Headphones size={28} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Multi-Channel</h3>
                <p className="text-gray-600">
                  Contact us via phone, email, or form - we respond on all channels
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
                  <AlertTriangle size={28} className="text-orange-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Priority Handling</h3>
                <p className="text-gray-600">
                  Urgent issues are escalated immediately to ensure quick resolution
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;