'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  Save,
  Lock,
  Eye,
  EyeOff,
  Edit2,
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { fetchWithAuth } from '@/app/lib/auth-fetch';
import { getProfile } from '@/app/lib/profile.service';
import type { ProfileApiResponse } from '@/app/lib/profile.service';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  department: string;
  position: string;
  employeeId: string;
  joinDate: string;
}

const emptyProfile: UserProfile = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  department: '',
  position: '',
  employeeId: '',
  joinDate: '',
};

function mapApiProfileToUserProfile(api: ProfileApiResponse | null): UserProfile {
  if (!api) return { ...emptyProfile };
  const nameParts = (api.userDetail?.name ?? '').trim().split(/\s+/);
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') ?? '';
  return {
    id: api.id ?? '',
    firstName,
    lastName,
    email: api.emailAddress ?? '',
    phone: api.userDetail?.phoneNumber ?? api.mobileNumber ?? '',
    address: '',
    dateOfBirth: '',
    department: '',
    position: api.roleName ?? '',
    employeeId: api.userDetail?.employeeCode ?? '',
    joinDate: '',
  };
}

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'details' | 'password'>(
    tabParam === 'password' ? 'password' : 'details'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(emptyProfile);
  const [formData, setFormData] = useState<UserProfile>(emptyProfile);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await getProfile();
      const mapped = mapApiProfileToUserProfile(data);
      setUserProfile(mapped);
      setFormData(mapped);
    } catch (e) {
      console.error('Profile fetch error:', e);
      setMessage({ type: 'error', text: 'Failed to load profile. Please try again.' });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (tabParam === 'password') setActiveTab('password');
    else if (tabParam !== 'password') setActiveTab('details');
  }, [tabParam]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateDetailsForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) newErrors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (!passwordData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetailsForm()) return;

    const userId = userProfile.id;
    if (!userId) {
      setMessage({ type: 'error', text: 'Session expired. Please sign in again.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const res = await fetchWithAuth('/api/user/update-detail', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          userId,
        },
        body: JSON.stringify({
          name: fullName || undefined,
          phoneNumber: formData.phone.trim() || undefined,
          employeeCode: formData.employeeId.trim() || undefined,
        }),
        credentials: 'same-origin',
      });

      const json = await res.json().catch(() => ({}));
      const success = res.ok && (json?.status === 'SUCCESS' || json?.code === 'user.detail.update.success');

      if (success) {
        setUserProfile(formData);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'user',
            JSON.stringify({
              name: `${formData.firstName} ${formData.lastName}`.trim(),
              email: formData.email,
            })
          );
        }
      } else {
        const msg =
          (json?.message && typeof json.message === 'string' ? json.message : null) ||
          (Array.isArray(json?.errors) ? json.errors.join(', ') : null) ||
          'Failed to update profile. Please try again.';
        setMessage({ type: 'error', text: msg });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    const userId = userProfile.id;
    if (!userId) {
      setMessage({ type: 'error', text: 'Session expired. Please sign in again.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetchWithAuth('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          id: userId,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
        credentials: 'same-origin',
      });

      const json = await res.json().catch(() => ({}));
      const success = res.ok && (json?.status === 'SUCCESS' || json?.data !== undefined);

      if (success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setMessage({ type: 'success', text: 'Password changed successfully!' });
      } else {
        const msg =
          (json?.message && typeof json.message === 'string' ? json.message : null) ||
          (Array.isArray(json?.errors) ? json.errors.join(', ') : null) ||
          'Failed to change password. Please check your current password.';
        setMessage({ type: 'error', text: msg });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleCancel = () => {
    setFormData(userProfile);
    setIsEditing(false);
    setErrors({});
  };

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="profile-page">
          <Breadcrumb items={[{ label: 'Profile' }]} />
          <div className="page-header-section">
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Loading profile...</p>
          </div>
          <div className="profile-content" style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="profile-page">
        <Breadcrumb items={[{ label: 'Profile' }]} />

        <div className="page-header-section">
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Manage your personal information and account settings</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <User size={18} />
            <span>Personal Details</span>
          </button>
          <button
            type="button"
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={18} />
            <span>Change Password</span>
          </button>
        </div>

        {message && (
          <div className={`alert-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="profile-content">
            <div className="profile-card">
              <div className="profile-card-header">
                <h2 className="profile-card-title">Personal Information</h2>
                {!isEditing && (
                  <button type="button" className="btn-secondary btn-small" onClick={() => setIsEditing(true)}>
                    <Edit2 size={16} />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="profile-details-view">
                  <div className="profile-avatar-section">
                    <div className="profile-avatar" />
                    <div className="profile-name-section">
                      <h3 className="profile-full-name">
                        {userProfile.firstName} {userProfile.lastName}
                      </h3>
                      <p className="profile-email">{userProfile.email}</p>
                    </div>
                  </div>

                  <div className="profile-details-grid">
                    <div className="profile-detail-item">
                      <div className="detail-label">
                        <Mail size={16} />
                        <span>Email</span>
                      </div>
                      <div className="detail-value">{userProfile.email}</div>
                    </div>
                    <div className="profile-detail-item">
                      <div className="detail-label">
                        <Phone size={16} />
                        <span>Phone</span>
                      </div>
                      <div className="detail-value">{userProfile.phone}</div>
                    </div>
                    <div className="profile-detail-item">
                      <div className="detail-label">
                        <MapPin size={16} />
                        <span>Address</span>
                      </div>
                      <div className="detail-value">{userProfile.address || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <div className="detail-label">
                        <Calendar size={16} />
                        <span>Date of Birth</span>
                      </div>
                      <div className="detail-value">
                        {userProfile.dateOfBirth
                          ? new Date(userProfile.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '—'}
                      </div>
                    </div>
                    <div className="profile-detail-item">
                      <div className="detail-label">
                        <Building2 size={16} />
                        <span>Department</span>
                      </div>
                      <div className="detail-value">{userProfile.department || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <div className="detail-label">
                        <Briefcase size={16} />
                        <span>Organization Position</span>
                      </div>
                      <div className="detail-value">{userProfile.position || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <div className="detail-label">
                        <User size={16} />
                        <span>Employee ID</span>
                      </div>
                      <div className="detail-value">{userProfile.employeeId || '—'}</div>
                    </div>
                    <div className="profile-detail-item">
                      <div className="detail-label">
                        <Calendar size={16} />
                        <span>Join Date</span>
                      </div>
                      <div className="detail-value">
                        {userProfile.joinDate
                          ? new Date(userProfile.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveDetails} className="profile-edit-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="firstName" className="form-label">First Name <span className="required">*</span></label>
                      <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="Enter first name" />
                      {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName" className="form-label">Last Name <span className="required">*</span></label>
                      <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Enter last name" />
                      {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">Email <span className="required">*</span></label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className={`form-input ${errors.email ? 'error' : ''}`} placeholder="Enter email address" />
                      {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">Phone <span className="required">*</span></label>
                      <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="Enter phone number" />
                      {errors.phone && <span className="form-error">{errors.phone}</span>}
                    </div>
                    <div className="form-group form-group-full">
                      <label htmlFor="address" className="form-label">Address</label>
                      <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} className="form-input" rows={3} placeholder="Enter address" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
                      <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="department" className="form-label">Department</label>
                      <input type="text" id="department" name="department" value={formData.department} onChange={handleInputChange} className="form-input" placeholder="Department" readOnly />
                    </div>
                    <div className="form-group">
                      <label htmlFor="position" className="form-label">Organization Position</label>
                      <input type="text" id="position" name="position" value={formData.position} onChange={handleInputChange} className="form-input" placeholder="Position" readOnly />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                      <Save size={16} />
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="profile-content">
            <div className="profile-card">
              <div className="profile-card-header">
                <h2 className="profile-card-title">Change Password</h2>
              </div>

              <form onSubmit={handleChangePassword} className="profile-edit-form">
                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label htmlFor="currentPassword" className="form-label">Current Password <span className="required">*</span></label>
                    <div className="password-input-wrapper">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`form-input ${errors.currentPassword ? 'error' : ''}`}
                        placeholder="Enter current password"
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowCurrentPassword(!showCurrentPassword)} aria-label="Toggle visibility">
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.currentPassword && <span className="form-error">{errors.currentPassword}</span>}
                  </div>
                  <div className="form-group form-group-full">
                    <label htmlFor="newPassword" className="form-label">New Password <span className="required">*</span></label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`form-input ${errors.newPassword ? 'error' : ''}`}
                        placeholder="Enter new password (min. 8 characters)"
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowNewPassword(!showNewPassword)} aria-label="Toggle visibility">
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.newPassword && <span className="form-error">{errors.newPassword}</span>}
                  </div>
                  <div className="form-group form-group-full">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password <span className="required">*</span></label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Confirm new password"
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Toggle visibility">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    <Lock size={16} />
                    <span>{loading ? 'Changing...' : 'Change Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
