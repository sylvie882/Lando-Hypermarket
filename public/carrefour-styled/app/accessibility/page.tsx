import React from 'react';
import Link from 'next/link';
import { 
  AccessibilityIcon, 
  ChevronRight, 
  Clock, 
  Eye, 
  Volume2, 
  Keyboard, 
  Type, 
  Contrast, 
  MousePointer, 
  Globe,
  Mail,
  Phone,
  FileText
} from 'lucide-react';

export default function AccessibilityPage() {
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12 md:py-16">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <AccessibilityIcon size={28} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Accessibility</h1>
          </div>
          <p className="text-lg text-green-50 mb-4">
            Our commitment to making Lando Hypermarket accessible to everyone.
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
            <span className="text-gray-900 font-medium">Accessibility</span>
          </div>
        </div>
      </div>

      {/* Main Content - Full width with padding only */}
      <section className="px-4 sm:px-6 md:px-8 lg:px-12 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 lg:p-10">
          
          {/* Introduction */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Accessibility Commitment</h2>
            <p className="text-gray-700 mb-4">
              At Lando Hypermarket, we believe that everyone should have equal access to our products and services. We are committed to ensuring digital accessibility for people with disabilities and providing an inclusive shopping experience for all our customers.
            </p>
            <p className="text-gray-700">
              We continuously work to improve the user experience for everyone and apply relevant accessibility standards to ensure our website is accessible to people with various disabilities.
            </p>
          </div>

          {/* Accessibility Standards */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Accessibility Standards</h3>
            <p className="text-gray-700 mb-3">
              We strive to conform to the following accessibility standards:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</li>
              <li>Section 508 of the Rehabilitation Act</li>
              <li>Americans with Disabilities Act (ADA) standards</li>
            </ul>
          </div>

          {/* Accessibility Features */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Accessibility Features</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Screen Reader */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Volume2 size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Screen Reader Compatibility</h4>
                    <p className="text-gray-700 text-sm">
                      Our site is optimized for screen readers with proper heading structures, ARIA labels, and alternative text for images.
                    </p>
                  </div>
                </div>
              </div>

              {/* Keyboard Navigation */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Keyboard size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Keyboard Navigation</h4>
                    <p className="text-gray-700 text-sm">
                      Full keyboard accessibility with visible focus indicators and logical tab order.
                    </p>
                  </div>
                </div>
              </div>

              {/* Text Resizing */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Type size={18} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Text Resizing</h4>
                    <p className="text-gray-700 text-sm">
                      Text can be resized up to 200% without loss of content or functionality.
                    </p>
                  </div>
                </div>
              </div>

              {/* High Contrast */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Contrast size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">High Contrast</h4>
                    <p className="text-gray-700 text-sm">
                      Sufficient color contrast ratios for text and interactive elements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assistive Technologies */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Supported Assistive Technologies</h3>
            <p className="text-gray-700 mb-3">
              Our website is designed to work with various assistive technologies, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>JAWS (Job Access With Speech) screen reader</li>
              <li>NVDA (NonVisual Desktop Access) screen reader</li>
              <li>VoiceOver (macOS and iOS)</li>
              <li>TalkBack (Android)</li>
              <li>Zoom text magnifiers</li>
              <li>Speech recognition software</li>
            </ul>
          </div>

          {/* Browser Compatibility */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Globe size={20} className="mr-2 text-green-600" />
              Browser Compatibility
            </h3>
            <p className="text-gray-700 mb-3">
              We support the latest versions of major browsers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Google Chrome</li>
              <li>Mozilla Firefox</li>
              <li>Apple Safari</li>
              <li>Microsoft Edge</li>
            </ul>
          </div>

          {/* Ongoing Efforts */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye size={20} className="mr-2 text-green-600" />
              Ongoing Accessibility Efforts
            </h3>
            <p className="text-gray-700 mb-3">
              We are continuously working to improve accessibility through:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Regular accessibility audits and testing</li>
              <li>Staff training on accessibility best practices</li>
              <li>User feedback integration</li>
              <li>Keeping up with evolving standards</li>
            </ul>
          </div>

          {/* Third-Party Content */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Third-Party Content</h3>
            <p className="text-gray-700">
              While we strive to ensure all content is accessible, some third-party content (such as embedded videos or social media feeds) may not be fully accessible. We encourage third-party providers to maintain accessibility standards.
            </p>
          </div>

          {/* Feedback */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Accessibility Feedback</h3>
            <p className="text-gray-700 mb-3">
              We welcome your feedback on the accessibility of our website. If you encounter any accessibility barriers or have suggestions for improvement, please contact us. We will make every reasonable effort to accommodate your needs.
            </p>
          </div>

          {/* Alternative Formats */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Alternative Formats</h3>
            <p className="text-gray-700 mb-3">
              If you need information from our website in an alternative format (such as large print, braille, or audio), please contact us and we will work to provide it.
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Accessibility Contact</h3>
            <p className="text-gray-700 mb-4">
              For accessibility questions, assistance, or to provide feedback:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-green-600" />
                <a href="mailto:accessibility@landohypermarket.com" className="text-gray-700 hover:text-green-600 transition-colors">
                  accessibility@landohypermarket.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-green-600" />
                <a href="tel:+254716354589" className="text-gray-700 hover:text-green-600 transition-colors">
                  +254 716 354 589
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MousePointer size={18} className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Accessibility Coordinator</p>
                  <p className="text-gray-700">Lando Hypermarket</p>
                  <p className="text-gray-700">Nairobi, Kenya</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}