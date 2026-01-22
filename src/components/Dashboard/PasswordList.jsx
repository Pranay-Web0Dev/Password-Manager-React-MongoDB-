import React, { useState } from 'react';
import { FaCopy, FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { passwordAPI } from '../../services/api';

const PasswordList = ({ passwords, onDelete, onCopy, onRefresh }) => {
  const [decryptedPasswords, setDecryptedPasswords] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const handleViewPassword = async (id) => {
    setLoadingId(id);
    
    try {
      const masterPassword = prompt('Enter your master password to view:');
      if (!masterPassword) {
        setLoadingId(null);
        return;
      }

      const response = await passwordAPI.decrypt(id, { masterPassword });
      
      if (response.data.success) {
        setDecryptedPasswords(prev => ({
          ...prev,
          [id]: response.data.data.password
        }));
        toast.success('Password decrypted successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decrypt password');
    } finally {
      setLoadingId(null);
    }
  };

  const toggleShowPassword = (id) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStrengthColor = (score) => {
    switch (score) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-red-400';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-green-400';
      case 4: return 'bg-green-600';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthLabel = (score) => {
    switch (score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Site
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Username
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Password
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Strength
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {passwords.map((password) => (
            <tr key={password._id} className="hover:bg-gray-50">
              {/* Site */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">
                      {password.site.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      <a 
                        href={password.site.startsWith('http') ? password.site : `https://${password.site}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800"
                      >
                        {password.site.length > 30 ? `${password.site.substring(0, 30)}...` : password.site}
                      </a>
                    </div>
                  </div>
                </div>
              </td>

              {/* Username */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{password.username}</div>
              </td>

              {/* Password */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {decryptedPasswords[password._id] ? (
                    <>
                      <span className="text-sm font-mono">
                        {showPassword[password._id] 
                          ? decryptedPasswords[password._id]
                          : '•'.repeat(decryptedPasswords[password._id].length)}
                      </span>
                      <button
                        onClick={() => toggleShowPassword(password._id)}
                        className="text-gray-600 hover:text-gray-800"
                        title={showPassword[password._id] ? 'Hide' : 'Show'}
                      >
                        {showPassword[password._id] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(decryptedPasswords[password._id]);
                          toast.success('Copied to clipboard!');
                        }}
                        className="text-gray-600 hover:text-gray-800"
                        title="Copy"
                      >
                        <FaCopy size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-mono text-gray-500">
                        ••••••••••••
                      </span>
                      <button
                        onClick={() => handleViewPassword(password._id)}
                        disabled={loadingId === password._id}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        title="View Password"
                      >
                        {loadingId === password._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          <FaEye size={14} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </td>

              {/* Strength */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className={`h-2 rounded-full ${getStrengthColor(password.strengthScore)}`}
                      style={{ width: `${(password.strengthScore + 1) * 20}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm ${password.isWeak ? 'text-red-600' : 'text-gray-600'}`}>
                    {getStrengthLabel(password.strengthScore)}
                  </span>
                </div>
              </td>

              {/* Created Date */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(password.createdAt)}
              </td>

              {/* Actions */}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-3">
                  <button
                    onClick={() => onCopy(password._id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Copy Password"
                  >
                    <FaCopy size={16} />
                  </button>
                  <button
                    onClick={() => toast.info('Edit feature coming soon!')}
                    className="text-yellow-600 hover:text-yellow-800"
                    title="Edit"
                  >
                    <FaEdit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(password._id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PasswordList;