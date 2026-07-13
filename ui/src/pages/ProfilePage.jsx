import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAddresses, createAddress, updateAddress, changePassword } from '../api/auth';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [addressId, setAddressId] = useState(null);
  
  // Password State
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Profile Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'India'
  });

  useEffect(() => {
    if (!user || isLoaded) return;

    const loadProfileData = async () => {
      try {
        const addresses = await getAddresses();
        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        if (defaultAddr) {
          setAddressId(defaultAddr.id);
          setFormData({
            fullName: `${defaultAddr.firstName} ${defaultAddr.lastName}`.trim(),
            phone: defaultAddr.phone || '',
            address: defaultAddr.addressLine1 || '',
            city: defaultAddr.city || '',
            postalCode: defaultAddr.postalCode || '',
            country: defaultAddr.country || 'India'
          });
        } else {
          // Fallback if no address yet
          setFormData({
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            phone: user.phone || '',
            address: '',
            city: '',
            postalCode: '',
            country: 'India'
          });
        }
      } catch (err) {
        console.warn("Could not load address from database:", err);
      }
      setIsLoaded(true);
    };

    loadProfileData();
  }, [user, isLoaded]);

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage('');
    setProfileError('');

    try {
      const [firstName = '', ...lastNameParts] = formData.fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ');

      const payload = {
        addressName: "Default Address",
        firstName: firstName || 'User',
        lastName: lastName || 'User',
        phone: formData.phone,
        addressLine1: formData.address,
        city: formData.city,
        state: formData.city || 'Andhra Pradesh', // Logical fallback
        country: formData.country || 'India',
        postalCode: formData.postalCode,
        isDefault: true
      };

      if (addressId) {
        await updateAddress(addressId, payload);
      } else {
        const newAddr = await createAddress(payload);
        if (newAddr?.id) setAddressId(newAddr.id);
      }

      setProfileMessage('Your profile and shipping details have been updated successfully!');
      setTimeout(() => setProfileMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setProfileError(err.message || 'An error occurred while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(passwords.newPassword);
      setPasswordMessage('Your password has been successfully updated.');
      setPasswords({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setPasswordError(err.message || 'An error occurred while updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4 text-[#333]">Access Denied</h2>
        <p className="text-muted-foreground mb-8">Please log in to view and manage your account details.</p>
      </div>
    );
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (formData.fullName) {
      const parts = formData.fullName.split(' ');
      return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl retro-grid-bg min-h-screen relative">
      {/* Title Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-serif font-black shimmer-text tracking-tight pb-1">Account Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Manage your personal profiles, default shipping address, and password credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: User Summary card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="magic-glow-card glow-hover p-6 rounded-3xl text-center flex flex-col items-center border border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary to-amber-500"></div>
            
            <div className="w-24 h-24 rounded-full bg-amber-50 border-4 border-primary/10 flex items-center justify-center text-primary text-3xl font-black font-serif shadow-inner my-4">
              {getInitials()}
            </div>
            
            <h2 className="text-xl font-bold text-[#333] font-serif leading-tight">{formData.fullName || 'Godavari Sweet Lover'}</h2>
            <p className="text-xs text-muted-foreground mt-1 break-all font-mono font-medium">{user.email}</p>
            
            <div className="w-full border-t border-border mt-6 pt-4 text-left flex flex-col gap-3 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Account Status:</span>
                <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Active</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Role:</span>
                <span className="font-bold text-[#333]">{user.email === 'ayyalarameshnaidu@gmail.com' ? 'Admin' : 'Customer'}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Member Since:</span>
                <span className="font-mono">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {/* Quick Help Box */}
          <div className="border border-[#eaeaea] bg-amber-50/30 rounded-3xl p-6 flex flex-col gap-3">
            <span className="text-lg">🛎️</span>
            <h4 className="text-xs uppercase tracking-wider font-black text-primary font-serif">Need Assistance?</h4>
            <p className="text-xs text-[#555] leading-relaxed">
              If you have questions about your orders, shipping details, or security settings, please reach out to our Godavari customer helpline.
            </p>
            <div className="text-[11px] text-muted-foreground font-semibold flex flex-col gap-1.5 mt-2">
              <span>📞 +91 9988776655</span>
              <span>✉️ support@ahakonaseema.com</span>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Forms */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Profile & Shipping Form */}
          <div className="glassmorphism p-6 md:p-8 rounded-3xl border border-border/50 shadow-sm bg-white">
            <h3 className="text-xl font-bold font-serif text-[#333] mb-6 pb-3 border-b border-border">Profile & Shipping Details</h3>
            
            {profileMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-6 text-sm font-medium flex gap-2 items-center">
                <span>✓</span> {profileMessage}
              </div>
            )}
            {profileError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6 text-sm font-medium">
                {profileError}
              </div>
            )}
            
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleProfileChange}
                    className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-sm font-medium text-[#333]"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleProfileChange}
                    className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-sm font-medium text-[#333]"
                    placeholder="E.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default Shipping Address</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  onChange={handleProfileChange}
                  className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-sm font-medium text-[#333]"
                  placeholder="Street Address, Apartment, Suite, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</label>
                  <input 
                    type="text" 
                    name="city"
                    value={formData.city}
                    onChange={handleProfileChange}
                    className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-sm font-medium text-[#333]"
                    placeholder="City"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Postal / PIN Code</label>
                  <input 
                    type="text" 
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleProfileChange}
                    className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-sm font-medium text-[#333]"
                    placeholder="PIN Code"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Country</label>
                  <input 
                    type="text" 
                    name="country"
                    value={formData.country}
                    onChange={handleProfileChange}
                    className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-sm font-medium text-[#333]"
                    placeholder="Country"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="mt-2 bg-primary hover:bg-primary/95 text-white font-bold py-3 px-6 rounded-xl transition-all self-end active:scale-98 disabled:opacity-50 text-sm tracking-wide uppercase shadow-[0_4px_12px_rgba(186,36,42,0.15)]"
              >
                {loading ? 'Saving Details...' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glassmorphism p-6 md:p-8 rounded-3xl border border-border/50 shadow-sm bg-white">
            <h3 className="text-xl font-bold font-serif text-[#333] mb-6 pb-3 border-b border-border">Change Password Credentials</h3>
            
            {passwordMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-6 text-sm font-medium flex gap-2 items-center">
                <span>✓</span> {passwordMessage}
              </div>
            )}
            {passwordError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6 text-sm font-medium">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Password</label>
                  <input 
                    type="password" 
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-sm font-medium text-[#333]"
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-sm font-medium text-[#333]"
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={passwordLoading}
                className="mt-2 bg-[#3f3f3f] hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition-all self-end active:scale-98 disabled:opacity-50 text-sm tracking-wide uppercase shadow-md"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
