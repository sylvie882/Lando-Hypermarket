'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  ArrowLeft,
  Save,
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Smartphone,
  Lock,
  ChevronRight,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  avatar_url?: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  role: string;
  date_of_birth?: string;
  gender?: string;
  is_active: boolean;
  loyalty_points?: number;
  membership_tier?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  bio?: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user: authUser, updateUser, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Profile form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form errors
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (authUser && token) {
      fetchProfileData();
    }
  }, [authUser, token]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      // Use the new api.user.getProfile method
      const response = await api.user.getProfile();
      
      if (response.data && response.data.user) {
        const profileData = response.data.user;
        setProfile(profileData);
        
        // Set form fields
        setName(profileData.name || '');
        setEmail(profileData.email || '');
        setPhone(profileData.phone || '');
        setDateOfBirth(profileData.date_of_birth || '');
        setGender(profileData.gender || '');
        setBio(profileData.bio || '');
        
        // Set avatar preview
        if (profileData.avatar_url) {
          setAvatarPreview(profileData.avatar_url);
        } else if (profileData.avatar) {
          // Use the api's getImageUrl helper if available
          const imageUrl = api.getImageUrl ? 
            api.getImageUrl(profileData.avatar) : 
            `https://api.hypermarket.co.ke/storage/${profileData.avatar}`;
          setAvatarPreview(imageUrl);
        }
      }
      
    } catch (error: any) {
      console.error('Failed to fetch profile data:', error);
      setFetchError(error.message);
      
      // Fallback to auth user data if available
      if (authUser) {
        const fallbackProfile = {
          id: authUser.id,
          name: authUser.name || '',
          email: authUser.email || '',
          phone: authUser.phone || '',
          avatar: authUser.avatar || null,
          email_verified_at: authUser.email_verified_at || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_admin: authUser.role === 'admin',
          role: authUser.role || 'customer',
          is_active: true
        };
        
        setProfile(fallbackProfile);
        setName(authUser.name || '');
        setEmail(authUser.email || '');
        setPhone(authUser.phone || '');
        
        if (authUser.avatar) {
          // Try to construct avatar URL
          if (authUser.avatar.startsWith('http')) {
            setAvatarPreview(authUser.avatar);
          } else {
            setAvatarPreview(`https://api.hypermarket.co.ke/storage/${authUser.avatar}`);
          }
        }
        
        toast('Using cached user data. Some features may be limited.', {
          icon: '⚠️',
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #f59e0b'
          }
        });
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 2MB as per backend)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      
      setAvatar(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = async () => {
    if (avatar) {
      // Just remove the selected file
      setAvatar(null);
      if (profile?.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      } else if (profile?.avatar) {
        const imageUrl = api.getImageUrl ? 
          api.getImageUrl(profile.avatar) : 
          `https://api.hypermarket.co.ke/storage/${profile.avatar}`;
        setAvatarPreview(imageUrl);
      } else {
        setAvatarPreview(null);
      }
    } else {
      // Call API to remove avatar from server
      try {
        await api.user.removeAvatar();
        setAvatarPreview(null);
        toast.success('Avatar removed successfully');
        fetchProfileData(); // Refresh profile data
      } catch (error: any) {
        console.error('Failed to remove avatar:', error);
        toast.error(error.message || 'Failed to remove avatar');
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    setErrors({});
    setSuccess('');
    
    try {
      const formData = new FormData();
      
      // Only append fields that have changed
      if (name !== profile?.name) formData.append('name', name);
      if (email !== profile?.email) formData.append('email', email);
      if (phone !== profile?.phone) formData.append('phone', phone);
      if (dateOfBirth !== profile?.date_of_birth) formData.append('date_of_birth', dateOfBirth);
      if (gender !== profile?.gender) formData.append('gender', gender);
      if (bio !== profile?.bio) formData.append('bio', bio);
      if (avatar) formData.append('avatar', avatar);
      
      // Use the new api.user.updateProfile method
      const response = await api.user.updateProfile(formData);
      
      // Update local auth user
      if (response.data && response.data.user) {
        updateUser(response.data.user);
      }
      
      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!');
      
      // Refresh profile data
      fetchProfileData();
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
      
    } catch (error: any) {
      console.error('Profile update failed:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        const errorMessages = Object.values(error.response.data.errors).flat();
        toast.error(errorMessages.join(', '));
      } else {
        toast.error(error.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&#).');
      return;
    }
    
    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }
    
    setSaving(true);
    
    try {
      const passwordData = {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      };
      
      // Use the new api.user.changePassword method
      await api.user.changePassword(passwordData);
      
      toast.success('Password changed successfully!');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      
    } catch (error: any) {
      console.error('Password change failed:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        toast.error(errorMessages.join(', '));
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to change password');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatarOnly = async () => {
    if (!avatar) return;
    
    setSaving(true);
    try {
      // Use the new api.user.uploadAvatar method
      const response = await api.user.uploadAvatar(avatar);
      
      toast.success('Avatar uploaded successfully');
      setAvatar(null);
      fetchProfileData(); // Refresh profile data
      
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkGoogleAccount = async () => {
    toast('Google account linking would redirect to Google OAuth. This feature needs to be implemented on the backend.', {
      icon: 'ℹ️',
      style: {
        background: '#dbeafe',
        color: '#1e40af',
        border: '1px solid #3b82f6'
      }
    });
  };

  const handleUnlinkGoogleAccount = async () => {
    try {
      // Use the auth method for unlinking
      await api.auth.unlinkGoogleAccount();
      toast.success('Google account unlinked successfully');
      fetchProfileData();
    } catch (error: any) {
      console.error('Failed to unlink Google account:', error);
      toast.error(error.message || 'Failed to unlink Google account');
    }
  };

  const handleDeactivateAccount = async () => {
    if (!confirm('Are you sure you want to deactivate your account? This action can be reversed later by contacting support.')) {
      return;
    }
    
    const password = prompt('Please enter your password to confirm account deactivation:');
    if (!password) return;
    
    try {
      const reason = prompt('Please tell us why you are leaving (optional):');
      
      // Use the new api.user.deleteAccount method
      await api.user.deleteAccount(password, reason || undefined);
      
      toast.success('Account deactivated successfully');
      
      // Clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (error: any) {
      console.error('Failed to deactivate account:', error);
      toast.error(error.message || 'Failed to deactivate account');
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] px-4 sm:px-6 lg:px-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to edit your profile.</p>
        <Link
          href="/auth/login"
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Login to Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1">Update your personal information and preferences</p>
          </div>
        </div>
      </div>

      {fetchError && !profile && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-2">Unable to load profile data</h3>
              <p className="text-sm text-yellow-700 mb-3">{fetchError}</p>
              <p className="text-sm text-yellow-700">
                You can still update your profile information, but some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Profile Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Information Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h2>
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{success}</span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/placeholder-avatar.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <label className="cursor-pointer p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </label>
                    {(avatarPreview || avatar) && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">Profile Photo</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload a clear photo of yourself. Max file size: 2MB. Supported formats: JPG, PNG, GIF.
                  </p>
                  {avatar && (
                    <button
                      type="button"
                      onClick={handleUploadAvatarOnly}
                      disabled={saving}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
                    >
                      Upload Avatar Only
                    </button>
                  )}
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-colors"
                  placeholder="Enter your full name"
                  required
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name[0]}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                  {profile?.email_verified ? (
                    <div className="absolute right-3 top-3 flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  ) : profile?.email_verified_at ? (
                    <div className="absolute right-3 top-3 flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  ) : (
                    <div className="absolute right-3 top-3 flex items-center gap-1 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Unverified</span>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email[0]}</p>
                )}
                {!profile?.email_verified && !profile?.email_verified_at && (
                  <p className="text-sm text-amber-600">
                    Please verify your email address to access all features
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-colors"
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone[0]}</p>
                )}
                {profile?.phone_verified && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Verified
                  </p>
                )}
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bio (Optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-colors"
                  placeholder="Tell us a little about yourself"
                />
                {errors.bio && (
                  <p className="text-sm text-red-600">{errors.bio[0]}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date of Birth
                  </span>
                </label>
                <input
                  type="date"
                  value={formatDateForInput(dateOfBirth)}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-colors"
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-red-600">{errors.date_of_birth[0]}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['male', 'female', 'other'].map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={gender === option}
                        onChange={(e) => setGender(e.target.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="capitalize">{option}</span>
                    </label>
                  ))}
                </div>
                {errors.gender && (
                  <p className="text-sm text-red-600">{errors.gender[0]}</p>
                )}
              </div>
              
              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
                <Link
                  href="/profile"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Password Change Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Password & Security
            </h2>
            
            {!showPasswordChange ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Password</p>
                    <p className="text-sm text-gray-500">Change your password to keep your account secure</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-colors pr-10"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-colors pr-10"
                      placeholder="Enter new password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&#)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-colors pr-10"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column - Account Settings */}
        <div className="space-y-8">
          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Account ID</p>
                <p className="font-mono text-sm text-gray-900">{profile?.id || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-900 capitalize">
                  {profile?.role || 'customer'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <p className={`font-medium ${profile?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Loyalty Points</p>
                <p className="font-medium text-gray-900">
                  {profile?.loyalty_points || 0} points
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Membership Tier</p>
                <p className="font-medium text-gray-900 capitalize">
                  {profile?.membership_tier || 'Bronze'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-gray-900">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Account Actions</h2>
            
            <div className="space-y-3">
              <button 
                onClick={handleDeactivateAccount}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group border border-red-200 hover:border-red-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Deactivate Account</p>
                    <p className="text-sm text-gray-500">Temporarily disable your account</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>

              <Link
                href="/support"
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Contact Support</p>
                    <p className="text-sm text-gray-500">Get help with your account</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </Link>
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Security Tips
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Use a strong, unique password</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Enable two-factor authentication if available</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Never share your password with anyone</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Log out from shared devices</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}