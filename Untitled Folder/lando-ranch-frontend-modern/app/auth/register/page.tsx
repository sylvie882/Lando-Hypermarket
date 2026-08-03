'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Check password requirements and strength
    if (name === 'password') {
      const requirements = {
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
      };
      
      setPasswordRequirements(requirements);
      
      // Calculate strength (0-5)
      let strength = Object.values(requirements).filter(req => req).length;
      setPasswordStrength(strength);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Please enter your name';
    }
    if (!formData.email.trim()) {
      errors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Please enter your phone number';
    } else {
      // Clean phone number - remove all non-digit characters except +
      const cleanPhone = formData.phone.replace(/[^\d+]/g, '');
      if (!cleanPhone.match(/^\+?[\d\s\-\(\)]{10,}$/)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }
    if (!formData.password) {
      errors.password = 'Please enter a password';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else {
      // Check all password requirements
      const missingRequirements = [];
      if (!passwordRequirements.uppercase) missingRequirements.push('uppercase letter');
      if (!passwordRequirements.lowercase) missingRequirements.push('lowercase letter');
      if (!passwordRequirements.number) missingRequirements.push('number');
      if (!passwordRequirements.specialChar) missingRequirements.push('special character');
      
      if (missingRequirements.length > 0) {
        errors.password = `Password must contain at least one ${missingRequirements.join(', ')}`;
      }
    }
    if (!formData.password_confirmation) {
      errors.password_confirmation = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = 'Passwords do not match';
    }
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return false;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Show first error as toast
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});

    if (!validateForm()) return;

    setIsRegistering(true);
    try {
      // Prepare data for API - clean phone number
      const apiData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone.replace(/[^\d+]/g, ''), // Remove non-digit chars except +
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: 'customer', // Default role for regular registration
      };

      // Direct API call to register
      const response = await api.auth.register(apiData);
      
      if (response.data.token && response.data.user) {
        const { token, user } = response.data;
        
        // Store auth data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success('Registration successful! Welcome to Lando Ranch.');
        
        // Redirect based on user role
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
        
        router.refresh();
      } else {
        toast.error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Registration error details:', error);
      
      // Handle Laravel validation errors
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        console.log('Laravel validation errors:', validationErrors);
        
        // Map Laravel errors to form errors
        const mappedErrors: Record<string, string> = {};
        Object.keys(validationErrors).forEach(key => {
          mappedErrors[key] = validationErrors[key][0];
        });
        
        setFormErrors(mappedErrors);
        
        // Show the first error as toast
        const firstError = Object.values(mappedErrors)[0];
        if (firstError) {
          toast.error(firstError);
        }
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    if (passwordStrength === 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength === 3) return 'Medium';
    if (passwordStrength === 4) return 'Strong';
    return 'Very Strong';
  };

  const getPasswordStrengthDescription = () => {
    switch (passwordStrength) {
      case 0:
        return 'Enter a password';
      case 1:
      case 2:
        return 'Password is too weak';
      case 3:
        return 'Password is okay';
      case 4:
        return 'Password is strong';
      case 5:
        return 'Password is very strong';
      default:
        return '';
    }
  };

  // Handle social login redirect
// Get Google OAuth URL
const handleGoogleLogin = async () => {
  try {
    const response = await api.auth.getGoogleAuthUrl();
    const googleAuthUrl = response.data.url;
    window.location.href = googleAuthUrl;
  } catch (error) {
    console.error('Google login error:', error);
    toast.error('Failed to initiate Google login');
  }
};

// Or simply redirect to the endpoint
const handleGoogleLoginDirect = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/social/google`;
};

  // Handle WhatsApp contact
  const handleWhatsAppContact = () => {
    const phoneNumber = '+254716354589'; // Using the number from your header
    const message = encodeURIComponent('Hello! I need help with registration.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Lando Ranch for fresh produce delivered to your doorstep
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border ${
                  formErrors.name ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="John Doe"
              />
            </div>
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border ${
                  formErrors.email ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="you@example.com"
              />
            </div>
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border ${
                  formErrors.phone ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="0712 345 678 or +254712345678"
              />
            </div>
            {formErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter your phone number with country code (e.g., +254712345678)
            </p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`block w-full pl-10 pr-12 py-3 border ${
                  formErrors.password ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                )}
              </button>
            </div>
            
            {/* Password Requirements */}
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${
                    passwordRequirements.length ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {passwordRequirements.length ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                  </div>
                  <span className={`text-sm ${passwordRequirements.length ? 'text-gray-700' : 'text-gray-500'}`}>
                    At least 8 characters
                  </span>
                </li>
                <li className="flex items-center">
                  <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${
                    passwordRequirements.uppercase ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {passwordRequirements.uppercase ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                  </div>
                  <span className={`text-sm ${passwordRequirements.uppercase ? 'text-gray-700' : 'text-gray-500'}`}>
                    One uppercase letter (A-Z)
                  </span>
                </li>
                <li className="flex items-center">
                  <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${
                    passwordRequirements.lowercase ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {passwordRequirements.lowercase ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                  </div>
                  <span className={`text-sm ${passwordRequirements.lowercase ? 'text-gray-700' : 'text-gray-500'}`}>
                    One lowercase letter (a-z)
                  </span>
                </li>
                <li className="flex items-center">
                  <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${
                    passwordRequirements.number ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {passwordRequirements.number ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                  </div>
                  <span className={`text-sm ${passwordRequirements.number ? 'text-gray-700' : 'text-gray-500'}`}>
                    One number (0-9)
                  </span>
                </li>
                <li className="flex items-center">
                  <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${
                    passwordRequirements.specialChar ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {passwordRequirements.specialChar ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                  </div>
                  <span className={`text-sm ${passwordRequirements.specialChar ? 'text-gray-700' : 'text-gray-500'}`}>
                    One special character (!@#$%^&* etc.)
                  </span>
                </li>
              </ul>
              
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Password Strength: <span className={getPasswordStrengthColor().replace('bg-', 'text-')}>
                        {getPasswordStrengthText()}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {getPasswordStrengthDescription()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {formErrors.password && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {formErrors.password}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.password_confirmation}
                onChange={handleChange}
                className={`block w-full pl-10 pr-12 py-3 border ${
                  formErrors.password_confirmation ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                )}
              </button>
            </div>
            {formErrors.password_confirmation && (
              <p className="mt-1 text-sm text-red-600">{formErrors.password_confirmation}</p>
            )}
            {formData.password_confirmation && formData.password !== formData.password_confirmation && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  Passwords do not match
                </p>
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="font-medium text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-orange-600 hover:text-orange-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-orange-600 hover:text-orange-500">
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="newsletter"
                name="newsletter"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="newsletter" className="font-medium text-gray-700">
                Subscribe to our newsletter for updates and offers
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isRegistering || !agreedToTerms || passwordStrength < 3}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
            
            {passwordStrength < 3 && formData.password && (
              <p className="mt-2 text-sm text-amber-600 text-center">
                Please meet all password requirements to continue
              </p>
            )}
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <MessageCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Need help with registration?</p>
              <p className="text-blue-600 mb-2">Our team is ready to assist you via WhatsApp.</p>
              <button
                onClick={handleWhatsAppContact}
                className="inline-flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Chat with Support
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Debug Info (remove in production) */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <details className="text-sm">
            <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900">
              Debug Info (Click to expand)
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <span className="font-medium">Form Data:</span>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-medium">Clean Phone:</span>
                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  {formData.phone.replace(/[^\d+]/g, '')}
                </code>
              </div>
              <div>
                <span className="font-medium">Password Requirements:</span>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(passwordRequirements, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-medium">Form Errors:</span>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(formErrors, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}