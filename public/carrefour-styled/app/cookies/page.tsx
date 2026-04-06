import React from 'react';
import Link from 'next/link';
import { 
  Cookie, 
  ChevronRight, 
  Clock, 
  Settings, 
  Info, 
  Shield, 
  Sliders, 
  XCircle,
  Mail,
  Phone,
  FileText
} from 'lucide-react';

export default function CookiesPolicy() {
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12 md:py-16">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Cookie size={28} className="text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">Cookie Policy</h1>
            </div>
            <p className="text-lg text-green-50 mb-4">
              How we use cookies and similar technologies to improve your experience.
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
              <span className="text-gray-900 font-medium">Cookie Policy</span>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide useful information to website owners.
              </p>
              <p className="text-gray-700">
                This Cookie Policy explains what cookies are, how we use them, and your choices regarding cookies on the Lando Hypermarket website.
              </p>
            </div>

            {/* How We Use Cookies */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Info size={20} className="mr-2 text-green-600" />
                How We Use Cookies
              </h3>
              <p className="text-gray-700 mb-3">
                We use cookies for various purposes, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><span className="font-medium">Essential Cookies:</span> Required for the website to function properly</li>
                <li><span className="font-medium">Performance Cookies:</span> Help us understand how visitors interact with our site</li>
                <li><span className="font-medium">Functional Cookies:</span> Remember your preferences and settings</li>
                <li><span className="font-medium">Targeting Cookies:</span> Deliver personalized content and advertisements</li>
              </ul>
            </div>

            {/* Types of Cookies */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h3>
              
              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Essential Cookies (Strictly Necessary)</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        These cookies are necessary for the website to function and cannot be switched off. They enable core functionality such as:
                      </p>
                      <ul className="list-disc pl-5 text-sm text-gray-700">
                        <li>Security and fraud prevention</li>
                        <li>Shopping cart functionality</li>
                        <li>Account login</li>
                        <li>Payment processing</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Performance Cookies */}
                <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Sliders size={18} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Performance & Analytics Cookies</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        These cookies help us understand how visitors interact with our website by collecting anonymous information. We use:
                      </p>
                      <ul className="list-disc pl-5 text-sm text-gray-700">
                        <li>Google Analytics to track page visits and user behavior</li>
                        <li>Heat mapping tools to understand user interaction</li>
                        <li>Performance monitoring to optimize site speed</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Functional Cookies</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        These cookies enhance your experience by remembering your preferences:
                      </p>
                      <ul className="list-disc pl-5 text-sm text-gray-700">
                        <li>Language preferences</li>
                        <li>Location settings</li>
                        <li>Recently viewed products</li>
                        <li>Saved items and wishlists</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Targeting Cookies */}
                <div className="bg-orange-50 rounded-lg p-5 border border-orange-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Cookie size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Targeting & Advertising Cookies</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        These cookies track your browsing habits to deliver relevant advertisements:
                      </p>
                      <ul className="list-disc pl-5 text-sm text-gray-700">
                        <li>Personalized product recommendations</li>
                        <li>Retargeting ads on social media</li>
                        <li>Measuring ad effectiveness</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Third-Party Cookies */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Third-Party Cookies</h3>
              <p className="text-gray-700 mb-3">
                Some cookies are placed by third-party services that appear on our pages. These include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><span className="font-medium">Google:</span> Analytics, reCAPTCHA, and advertising</li>
                <li><span className="font-medium">Social Media:</span> Facebook, Twitter, Instagram pixels for sharing and tracking</li>
                <li><span className="font-medium">Payment Processors:</span> M-Pesa, Visa, MasterCard for secure transactions</li>
              </ul>
            </div>

            {/* Cookie Duration */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cookie Duration</h3>
              <p className="text-gray-700 mb-3">
                Cookies may be either:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><span className="font-medium">Session Cookies:</span> Temporary cookies that expire when you close your browser</li>
                <li><span className="font-medium">Persistent Cookies:</span> Remain on your device for a set period or until you delete them</li>
              </ul>
            </div>

            {/* Your Choices */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Settings size={20} className="mr-2 text-green-600" />
                Your Cookie Choices
              </h3>
              
              <div className="space-y-4">
                <p className="text-gray-700">
                  You have the right to accept or reject cookies. You can manage your cookie preferences through:
                </p>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Browser Settings</h4>
                  <p className="text-gray-700 text-sm mb-2">
                    Most browsers allow you to control cookies through their settings:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Chrome: Settings → Privacy and Security → Cookies</li>
                    <li>Firefox: Options → Privacy & Security → Cookies</li>
                    <li>Safari: Preferences → Privacy → Cookies</li>
                    <li>Edge: Settings → Cookies and site permissions</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Our Cookie Consent Tool</h4>
                  <p className="text-gray-700 text-sm">
                    When you first visit our site, you can customize your cookie preferences. You can change these settings at any time by clicking the "Cookie Settings" link in the footer.
                  </p>
                </div>
              </div>
            </div>

            {/* Consequences of Disabling */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <XCircle size={20} className="mr-2 text-green-600" />
                Consequences of Disabling Cookies
              </h3>
              <p className="text-gray-700">
                If you choose to disable cookies, some parts of our website may not function properly. You may experience:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-700">
                <li>Inability to add items to your cart</li>
                <li>Difficulty logging into your account</li>
                <li>Loss of personalized recommendations</li>
                <li>Increased frequency of login prompts</li>
              </ul>
            </div>

            {/* Updates to Policy */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Updates to This Policy</h3>
              <p className="text-gray-700">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h3>
              <p className="text-gray-700 mb-4">
                If you have questions about our use of cookies, please contact us:
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
        </div>
      </section>
    </div>
  );
}