import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  RotateCcw,
  Mail,
  Phone
} from 'lucide-react';

export default function TermsAndConditions() {
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12 md:py-16">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText size={28} className="text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">Terms & Conditions</h1>
            </div>
            <p className="text-lg text-green-50 mb-4">
              Please read these terms carefully before using our services.
            </p>
            <div className="flex items-center text-sm text-green-100">
              <Clock size={16} className="mr-2" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center text-sm">
              <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
                Home
              </Link>
              <ChevronRight size={16} className="mx-2 text-gray-400" />
              <span className="text-gray-900 font-medium">Terms & Conditions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="px-4 sm:px-6 md:px-8 lg:px-12 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 lg:p-10">
            
            {/* Introduction */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                These Terms and Conditions ("Terms") govern your use of the Lando Hypermarket website and services. By accessing or using our website, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access our services.
              </p>
            </div>

            {/* Account Registration */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ShoppingBag size={20} className="mr-2 text-green-600" />
                Account Registration
              </h3>
              <p className="text-gray-700 mb-3">
                When you create an account with us, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information promptly</li>
                <li>Keep your password confidential</li>
                <li>Notify us immediately of any unauthorized account use</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
              <p className="text-gray-700 mt-3">
                We reserve the right to refuse service, terminate accounts, or cancel orders at our discretion.
              </p>
            </div>

            {/* Products and Pricing */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Products and Pricing</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Product Information</h4>
                  <p className="text-gray-700">
                    We strive to display our products accurately. However, we do not warrant that product descriptions, images, or pricing are error-free. We reserve the right to correct errors and change information without prior notice.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                  <p className="text-gray-700">
                    All prices are in Kenyan Shillings (KES) and include applicable taxes unless stated otherwise. We reserve the right to modify prices at any time. In case of a pricing error, we may cancel the order and issue a refund.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Availability</h4>
                  <p className="text-gray-700">
                    Products are subject to availability. If an item is out of stock, we will notify you and provide options for backorder or cancellation.
                  </p>
                </div>
              </div>
            </div>

            {/* Orders and Payment */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard size={20} className="mr-2 text-green-600" />
                Orders and Payment
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Order Acceptance</h4>
                  <p className="text-gray-700">
                    Your order constitutes an offer to purchase. We reserve the right to accept or decline your order for any reason. Order confirmation does not constitute acceptance until payment is processed.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Methods</h4>
                  <p className="text-gray-700 mb-2">
                    We accept the following payment methods:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>M-Pesa</li>
                    <li>Visa and MasterCard credit/debit cards</li>
                    <li>Cash on Delivery (selected areas)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Order Cancellation</h4>
                  <p className="text-gray-700">
                    You may cancel your order within 1 hour of placement for a full refund. After that, cancellation may not be possible if the order is being processed.
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Truck size={20} className="mr-2 text-green-600" />
                Delivery Terms
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Areas</h4>
                  <p className="text-gray-700">
                    We deliver to select areas in Nairobi and surrounding regions. Please check your zip code for delivery availability.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Times</h4>
                  <p className="text-gray-700">
                    Estimated delivery times are provided at checkout. While we strive to meet these estimates, delays may occur due to factors beyond our control.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Charges</h4>
                  <p className="text-gray-700">
                    Delivery fees are calculated based on your location and order value. Free delivery may be available for orders above a certain amount.
                  </p>
                </div>
              </div>
            </div>

            {/* Returns and Refunds */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <RotateCcw size={20} className="mr-2 text-green-600" />
                Returns and Refunds
              </h3>
              
              <p className="text-gray-700 mb-3">
                Our return policy allows you to return eligible items within 7 days of delivery. Conditions apply:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Items must be unused and in original packaging</li>
                <li>Perishable goods cannot be returned unless defective</li>
                <li>Refunds are processed to the original payment method</li>
                <li>Return shipping costs may apply</li>
              </ul>
              <p className="text-gray-700 mt-3">
                For detailed information, please see our <Link href="/returns" className="text-green-600 hover:underline">Returns Policy</Link>.
              </p>
            </div>

            {/* User Conduct */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">User Conduct</h3>
              <p className="text-gray-700 mb-3">
                You agree not to use our website to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful code or malware</li>
                <li>Interfere with website operations</li>
                <li>Engage in fraudulent activities</li>
                <li>Harvest or collect user information</li>
              </ul>
            </div>

            {/* Limitation of Liability */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertCircle size={20} className="mr-2 text-green-600" />
                Limitation of Liability
              </h3>
              <p className="text-gray-700">
                To the maximum extent permitted by law, Lando Hypermarket shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services. Our total liability shall not exceed the amount you paid for the products in question.
              </p>
            </div>

            {/* Intellectual Property */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Intellectual Property</h3>
              <p className="text-gray-700">
                All content on this website, including logos, text, images, and software, is the property of Lando Hypermarket and protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our written consent.
              </p>
            </div>

            {/* Governing Law */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Governing Law</h3>
              <p className="text-gray-700">
                These Terms shall be governed by the laws of Kenya. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in Nairobi, Kenya.
              </p>
            </div>

            {/* Changes to Terms */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Changes to Terms</h3>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. Changes become effective immediately upon posting. Your continued use of our services constitutes acceptance of modified Terms.
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
              <p className="text-gray-700 mb-4">
                For questions about these Terms, please contact us:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-green-600" />
                  <a href="mailto:legal@landohypermarket.com" className="text-gray-700 hover:text-green-600 transition-colors">
                    legal@landohypermarket.com
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
        </div>
      </section>
    </div>
  );
}