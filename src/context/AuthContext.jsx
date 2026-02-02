// import React, { createContext, useState, useContext, useEffect } from 'react';
// import axios from 'axios';

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Set axios defaults
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     }
//   }, []);

//   // Check if user is logged in on mount
//   useEffect(() => {
//     const checkLoggedIn = async () => {
//       const token = localStorage.getItem('token');
      
//       if (token) {
//         try {
//           const response = await axios.get('http://localhost:4000/api/auth/me');
//           setUser(response.data.user);
//         } catch (error) {
//           console.error('Auto-login failed:', error);
//           localStorage.removeItem('token');
//           delete axios.defaults.headers.common['Authorization'];
//         }
//       }
//       setLoading(false);
//     };

//     checkLoggedIn();
//   }, []);

//   // Register function
//   const register = async (email, password, masterPassword) => {
//     try {
//       setError(null);
//       const response = await axios.post('http://localhost:4000/api/auth/register', {
//         email,
//         password,
//         masterPassword
//       });

//       const { token, user } = response.data;
      
//       localStorage.setItem('token', token);
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       setUser(user);

//       return { success: true, data: response.data };
//     } catch (error) {
//       const message = error.response?.data?.message || 'Registration failed';
//       setError(message);
//       return { success: false, error: message };
//     }
//   };

//   // Login function
//   const login = async (email, password) => {
//     try {
//       setError(null);
//       const response = await axios.post('http://localhost:4000/api/auth/login', {
//         email,
//         password
//       });

//       const { token, user } = response.data;
      
//       localStorage.setItem('token', token);
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       setUser(user);

//       return { success: true, data: response.data };
//     } catch (error) {
//       const message = error.response?.data?.message || 'Login failed';
//       setError(message);
//       return { success: false, error: message };
//     }
//   };

//   // Logout function
//   const logout = () => {
//     localStorage.removeItem('token');
//     delete axios.defaults.headers.common['Authorization'];
//     setUser(null);
//   };

//   // Verify master password
//   const verifyMasterPassword = async (masterPassword) => {
//     try {
//       const response = await axios.post('http://localhost:4000/api/auth/verify-master', {
//         masterPassword
//       });
//       return { success: true, data: response.data };
//     } catch (error) {
//       const message = error.response?.data?.message || 'Verification failed';
//       return { success: false, error: message };
//     }
//   };

//   const value = {
//     user,
//     loading,
//     error,
//     register,
//     login,
//     logout,
//     verifyMasterPassword,
//     setError
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { authService } from '../services/authService'; // Import the fixed service

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await axios.get('http://localhost:4000/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Auto-login failed:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Register function - use authService
  const register = async (email, password, masterPassword) => {
    setError(null);
    const result = await authService.register({ email, password, masterPassword });
    
    if (result.success) {
      setUser(result.data.user);
    }
    
    return result;
  };

  // Login function - use authService (FIXED: Removed duplicate logic)
  const login = async (email, password) => {
    setError(null);
    const result = await authService.login({ email, password });
    
    if (result.success) {
      setUser(result.data.user);
    }
    
    return result;
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Verify master password - use authService
  const verifyMasterPassword = async (masterPassword) => {
    return await authService.verifyMasterPassword(masterPassword);
  };

  // Verify master password with OTP - use authService
  const verifyMasterWithOTP = async (data) => {
    return await authService.verifyMasterWithOTP(data);
  };

  // Get master password status - use authService
  const getMasterPasswordStatus = async () => {
    return await authService.getMasterPasswordStatus();
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    verifyMasterPassword,
    verifyMasterWithOTP,
    getMasterPasswordStatus,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};