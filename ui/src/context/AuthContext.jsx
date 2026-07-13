import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signIn as apiSignIn, signUp as apiSignUp, signOut as apiSignOut } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const determineAdmin = (currUser) => {
    if (!currUser) return false;
    return (
      currUser.role === 'Admin' || 
      currUser.role === 'Super Admin' ||
      currUser.email === 'superadmin@ecommerce.com' ||
      currUser.email === 'admin@sweetverse.com' || 
      currUser.email === 'ayyalarameshnaidu@gmail.com'
    );
  };

  const loadUser = async () => {
    try {
      const currUser = await getCurrentUser();
      setUser(currUser);
      setIsAdmin(determineAdmin(currUser));
    } catch (err) {
      console.error("Error loading user profile:", err);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    // Event listener for expired sessions (triggered by apiClient)
    const handleExpired = () => {
      setUser(null);
      setIsAdmin(false);
    };

    window.addEventListener('auth_session_expired', handleExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleExpired);
    };
  }, []);

  const value = {
    user,
    loading,
    signIn: async (email, password) => {
      const data = await apiSignIn(email, password);
      setUser(data.user);
      setIsAdmin(determineAdmin(data.user));
      
      // Emit login event to sync cart
      window.dispatchEvent(new Event('auth_login_event'));
      return data;
    },
    signUp: async (email, password, metadata = {}) => {
      return await apiSignUp(email, password, metadata);
    },
    signOut: async () => {
      await apiSignOut();
      setUser(null);
      setIsAdmin(false);
      window.dispatchEvent(new Event('auth_logout_event'));
    },
    isAdmin,
    refreshUser: async () => {
      await loadUser();
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
