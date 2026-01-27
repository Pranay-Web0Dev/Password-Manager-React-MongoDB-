import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AddPassword from './AddPassword';
import PasswordList from './PasswordList';
import { passwordAPI } from '../../services/api';
import { useAutoLogout } from '../../services/useAutoLogout'; 
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();

  useAutoLogout();

  useEffect(() => {
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
    try {
      setLoading(true);
      const response = await passwordAPI.getAll();
      if (response.data.success) {
        setPasswords(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch passwords');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPassword = async (passwordData) => {
    try {
      const response = await passwordAPI.create(passwordData);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowAddForm(false);
        fetchPasswords();
        
        // Show warning if password is weak
        if (response.data.warning) {
          toast(response.data.warning, {
            icon: '⚠️',
            duration: 5000
          });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save password');
    }
  };

  const handleDeletePassword = async (id) => {
    if (window.confirm('Are you sure you want to delete this password?')) {
      try {
        const response = await passwordAPI.delete(id);
        if (response.data.success) {
          toast.success('Password deleted successfully');
          fetchPasswords();
        }
      } catch (error) {
        toast.error('Failed to delete password');
      }
    }
  };

  const handleCopyPassword = async (id) => {
    try {
      const masterPassword = prompt('Enter your master password to copy:');
      if (!masterPassword) return;

      const response = await passwordAPI.decrypt(id, { masterPassword });
      
      if (response.data.success) {
        navigator.clipboard.writeText(response.data.data.password);
        toast.success('Password copied to clipboard!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to copy password');
    }
  };

  // ADD THIS NEW FUNCTION FOR UPDATE
  const handleUpdatePassword = async (id, updatedData) => {
    try {
      const response = await passwordAPI.update(id, updatedData);
      if (response.data.success) {
        toast.success('Password updated successfully!');
        fetchPasswords(); // Refresh the list
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
      throw error; // Let PasswordList handle the error
    }
  };

  const stats = {
    total: passwords.length,
    weak: passwords.filter(p => p.isWeak).length,
    strong: passwords.filter(p => p.strengthScore >= 3).length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.total}</h3>
                <p className="text-gray-600">Total Passwords</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.928-.833-2.698 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.weak}</h3>
                <p className="text-gray-600">Weak Passwords</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.strong}</h3>
                <p className="text-gray-600">Strong Passwords</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Password Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {showAddForm ? 'Cancel' : 'Add New Password'}
          </button>
        </div>

        {/* Add Password Form */}
        {showAddForm && (
          <div className="mb-8">
            <AddPassword onSubmit={handleAddPassword} />
          </div>
        )}

        {/* Password List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : passwords.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No passwords yet</h3>
              <p className="text-gray-600 mb-4">Add your first password to get started</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Add Password
              </button>
            </div>
          ) : (
            <PasswordList
              passwords={passwords}
              onDelete={handleDeletePassword}
              onCopy={handleCopyPassword}
              onRefresh={fetchPasswords}
              onUpdate={handleUpdatePassword} // ADD THIS PROP
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;