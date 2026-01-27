// import React, { useState } from 'react';
// import { FaCopy, FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
// import { toast } from 'react-hot-toast';
// import { passwordAPI } from '../../services/api';

// const PasswordList = ({ passwords, onDelete, onCopy, onRefresh, onUpdate }) => {
//   const [decryptedPasswords, setDecryptedPasswords] = useState({});
//   const [showPassword, setShowPassword] = useState({});
//   const [loadingId, setLoadingId] = useState(null);
//   const [editingId, setEditingId] = useState(null);
//   const [editFormData, setEditFormData] = useState({});

//   const handleViewPassword = async (id) => {
//     setLoadingId(id);
    
//     try {
//       const masterPassword = prompt('Enter your master password to view:');
//       if (!masterPassword) {
//         setLoadingId(null);
//         return;
//       }

//       const response = await passwordAPI.decrypt(id, { masterPassword });
      
//       if (response.data.success) {
//         setDecryptedPasswords(prev => ({
//           ...prev,
//           [id]: response.data.data.password
//         }));
//         setShowPassword(prev => ({
//           ...prev,
//           [id]: true
//         }));
//         toast.success('Password decrypted successfully!');
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Failed to decrypt password');
//     } finally {
//       setLoadingId(null);
//     }
//   };

//   const handleEditClick = async (password) => {
//     try {
//       const masterPassword = prompt('Enter your master password to edit this password:');
//       if (!masterPassword) return;

//       setLoadingId(password._id);
      
//       const response = await passwordAPI.decrypt(password._id, { masterPassword });
      
//       if (response.data.success) {
//         setDecryptedPasswords(prev => ({
//           ...prev,
//           [password._id]: response.data.data.password
//         }));
        
//         setEditFormData({
//           site: password.site,
//           username: password.username,
//           password: response.data.data.password,
//           masterPassword: masterPassword
//         });
        
//         setEditingId(password._id);
//         toast.success('Ready to edit!');
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Failed to decrypt password');
//     } finally {
//       setLoadingId(null);
//     }
//   };

//   const handleEditChange = (e) => {
//     const { name, value } = e.target;
//     setEditFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleEditSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!editFormData.site || !editFormData.username || !editFormData.password || !editFormData.masterPassword) {
//       toast.error('Please fill all fields');
//       return;
//     }

//     try {
//       await onUpdate(editingId, editFormData);
      
//       setEditingId(null);
//       setEditFormData({});
      
//       setDecryptedPasswords(prev => {
//         const newState = { ...prev };
//         delete newState[editingId];
//         return newState;
//       });
      
//       setShowPassword(prev => {
//         const newState = { ...prev };
//         delete newState[editingId];
//         return newState;
//       });
      
//     } catch (error) {
//       // Error is already shown by onUpdate
//     }
//   };

//   const handleEditCancel = () => {
//     setEditingId(null);
//     setEditFormData({});
    
//     if (editingId) {
//       setDecryptedPasswords(prev => {
//         const newState = { ...prev };
//         delete newState[editingId];
//         return newState;
//       });
//     }
//   };

//   const toggleShowPassword = (id) => {
//     setShowPassword(prev => ({
//       ...prev,
//       [id]: !prev[id]
//     }));
//   };

//   const getStrengthColor = (score) => {
//     switch (score) {
//       case 0: return 'bg-red-500';
//       case 1: return 'bg-red-400';
//       case 2: return 'bg-yellow-500';
//       case 3: return 'bg-green-400';
//       case 4: return 'bg-green-600';
//       default: return 'bg-gray-300';
//     }
//   };

//   const getStrengthLabel = (score) => {
//     switch (score) {
//       case 0: return 'Very Weak';
//       case 1: return 'Weak';
//       case 2: return 'Fair';
//       case 3: return 'Good';
//       case 4: return 'Strong';
//       default: return 'Unknown';
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   return (
//     <div className="overflow-x-auto">
//       <table className="min-w-full divide-y divide-gray-200">
//         <thead className="bg-gray-50">
//           <tr>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Site
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Username
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Password
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Strength
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Created
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Actions
//             </th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-200">
//           {passwords.map((password) => (
//             <React.Fragment key={password._id}>
//               {/* Edit Form Row */}
//               {editingId === password._id && (
//                 <tr className="bg-yellow-50">
//                   <td colSpan="6" className="px-6 py-4">
//                     <div className="bg-white p-4 rounded-lg shadow border border-yellow-200">
//                       <div className="flex justify-between items-center mb-4">
//                         <h3 className="text-lg font-semibold text-gray-900">
//                           Edit Password for <span className="text-yellow-600">{editFormData.site || password.site}</span>
//                         </h3>
//                         <button
//                           onClick={handleEditCancel}
//                           className="text-gray-500 hover:text-gray-700 text-sm font-medium"
//                         >
//                           Cancel
//                         </button>
//                       </div>
                      
//                       <form onSubmit={handleEditSubmit}>
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-1">
//                               Website
//                             </label>
//                             <input
//                               type="text"
//                               name="site"
//                               value={editFormData.site || ''}
//                               onChange={handleEditChange}
//                               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-white"
//                               required
//                             />
//                           </div>
                          
//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-1">
//                               Username
//                             </label>
//                             <input
//                               type="text"
//                               name="username"
//                               value={editFormData.username || ''}
//                               onChange={handleEditChange}
//                               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-white"
//                               required
//                             />
//                           </div>
                          
//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-1">
//                               Password
//                             </label>
//                             <div className="relative">
//                               <input
//                                 type="text"
//                                 name="password"
//                                 value={editFormData.password || ''}
//                                 onChange={handleEditChange}
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-white pr-10"
//                                 required
//                               />
//                               {editFormData.password && (
//                                 <button
//                                   type="button"
//                                   onClick={() => {
//                                     navigator.clipboard.writeText(editFormData.password);
//                                     toast.success('Password copied!');
//                                   }}
//                                   className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                                   title="Copy password"
//                                 >
//                                   <FaCopy size={14} />
//                                 </button>
//                               )}
//                             </div>
//                           </div>
//                         </div>
                        
//                         <div className="mb-4">
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Master Password
//                             <span className="text-xs text-gray-500 ml-1">(required to re-encrypt)</span>
//                           </label>
//                           <input
//                             type="password"
//                             name="masterPassword"
//                             value={editFormData.masterPassword || ''}
//                             onChange={handleEditChange}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-white"
//                             placeholder="Enter master password again"
//                             required
//                           />
//                           <p className="text-xs text-gray-500 mt-1">
//                             Re-enter your master password to encrypt the updated password
//                           </p>
//                         </div>
                        
//                         <div className="flex justify-end space-x-3">
//                           <button
//                             type="button"
//                             onClick={handleEditCancel}
//                             className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
//                           >
//                             Cancel
//                           </button>
//                           <button
//                             type="submit"
//                             className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-medium"
//                           >
//                             Update Password
//                           </button>
//                         </div>
//                       </form>
//                     </div>
//                   </td>
//                 </tr>
//               )}
              
//               {/* Normal Row */}
//               <tr className="hover:bg-gray-50">
//                 {/* Site */}
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
//                       <span className="text-green-600 font-bold">
//                         {password.site.charAt(0).toUpperCase()}
//                       </span>
//                     </div>
//                     <div className="ml-4">
//                       <div className="text-sm font-medium text-gray-900">
//                         <a 
//                           href={password.site.startsWith('http') ? password.site : `https://${password.site}`}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-green-600 hover:text-green-800"
//                         >
//                           {password.site.length > 30 ? `${password.site.substring(0, 30)}...` : password.site}
//                         </a>
//                       </div>
//                     </div>
//                   </div>
//                 </td>

//                 {/* Username */}
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-900">{password.username}</div>
//                 </td>

//                 {/* Password */}
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center space-x-2">
//                     {decryptedPasswords[password._id] ? (
//                       <>
//                         <div className="min-w-[150px]">
//                           <span className={`text-sm font-mono px-3 py-1.5 rounded border ${showPassword[password._id] ? 'bg-gray-50 text-gray-900 border-gray-300' : 'text-gray-600 border-gray-200'}`}>
//                             {showPassword[password._id] 
//                               ? decryptedPasswords[password._id]
//                               : '•'.repeat(decryptedPasswords[password._id].length)}
//                           </span>
//                         </div>
//                         <div className="flex items-center space-x-2">
//                           <button
//                             onClick={() => toggleShowPassword(password._id)}
//                             className={`p-2 rounded-lg ${showPassword[password._id] ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
//                             title={showPassword[password._id] ? 'Hide' : 'Show'}
//                           >
//                             {showPassword[password._id] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
//                           </button>
//                           <button
//                             onClick={() => {
//                               navigator.clipboard.writeText(decryptedPasswords[password._id]);
//                               toast.success('Copied to clipboard!');
//                             }}
//                             className="bg-gray-50 text-gray-600 hover:bg-gray-100 p-2 rounded-lg"
//                             title="Copy"
//                           >
//                             <FaCopy size={14} />
//                           </button>
//                         </div>
//                       </>
//                     ) : (
//                       <>
//                         <div className="min-w-[150px]">
//                           <span className="text-sm font-mono text-gray-500 px-3 py-1.5 rounded border border-gray-200 bg-gray-50">
//                             ••••••••••••
//                           </span>
//                         </div>
//                         <button
//                           onClick={() => handleViewPassword(password._id)}
//                           disabled={loadingId === password._id}
//                           className="bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 p-2 rounded-lg"
//                           title="View Password"
//                         >
//                           {loadingId === password._id ? (
//                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
//                           ) : (
//                             <FaEye size={14} />
//                           )}
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 </td>

//                 {/* Strength */}
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
//                       <div
//                         className={`h-2 rounded-full ${getStrengthColor(password.strengthScore)}`}
//                         style={{ width: `${(password.strengthScore + 1) * 20}%` }}
//                       ></div>
//                     </div>
//                     <span className={`text-sm ${password.isWeak ? 'text-red-600' : 'text-gray-600'}`}>
//                       {getStrengthLabel(password.strengthScore)}
//                     </span>
//                   </div>
//                 </td>

//                 {/* Created Date */}
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                   {formatDate(password.createdAt)}
//                 </td>

//                 {/* Actions */}
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                   <div className="flex space-x-3">
//                     <button
//                       onClick={() => onCopy(password._id)}
//                       className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg"
//                       title="Copy Password"
//                     >
//                       <FaCopy size={16} />
//                     </button>
//                     <button
//                       onClick={() => handleEditClick(password)}
//                       disabled={loadingId === password._id || editingId}
//                       className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 disabled:opacity-50 p-2 rounded-lg"
//                       title="Edit"
//                     >
//                       {loadingId === password._id ? (
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
//                       ) : (
//                         <FaEdit size={16} />
//                       )}
//                     </button>
//                     <button
//                       onClick={() => onDelete(password._id)}
//                       className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg"
//                       title="Delete"
//                     >
//                       <FaTrash size={16} />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             </React.Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default PasswordList;

import React, { useState } from 'react';
import { FaCopy, FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { passwordAPI } from '../../services/api';

const PasswordList = ({ passwords, onDelete, onCopy, onRefresh, onUpdate }) => {
  const [decryptedPasswords, setDecryptedPasswords] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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
        setShowPassword(prev => ({
          ...prev,
          [id]: true
        }));
        toast.success('Password decrypted successfully!');
      }
    } catch (error) {
      // Handle master password lock scenarios
      if (error.response?.status === 423 && error.response?.data?.autoLogout) {
        toast.error('Master password locked! You will be logged out for security.');
        
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login?masterPasswordLocked=true';
        }, 2000);
        
        return;
      }
      
      if (error.response?.status === 423) {
        toast.error('Master password is locked. Please verify with OTP.');
        
        const shouldVerify = window.confirm(
          'Your master password is locked due to too many failed attempts.\n\n' +
          'An OTP has been sent to your email. Would you like to verify now?'
        );
        
        if (shouldVerify) {
          localStorage.removeItem('token');
          window.location.href = '/login?masterPasswordLocked=true';
        }
        
        return;
      }
      
      toast.error(error.response?.data?.message || 'Failed to decrypt password');
    } finally {
      setLoadingId(null);
    }
  };

  const handleEditClick = async (password) => {
    try {
      const masterPassword = prompt('Enter your master password to edit this password:');
      if (!masterPassword) return;

      setLoadingId(password._id);
      
      try {
        const response = await passwordAPI.decrypt(password._id, { masterPassword });
        
        if (response.data.success) {
          setDecryptedPasswords(prev => ({
            ...prev,
            [password._id]: response.data.data.password
          }));
          
          setEditFormData({
            site: password.site,
            username: password.username,
            password: response.data.data.password,
            masterPassword: masterPassword
          });
          
          setEditingId(password._id);
          toast.success('Ready to edit!');
        }
      } catch (error) {
        // Check if master password is locked
        if (error.response?.status === 423 && error.response?.data?.autoLogout) {
          toast.error('Master password locked! You will be logged out for security.');
          
          // Auto logout
          setTimeout(() => {
            localStorage.removeItem('token');
            window.location.href = '/login?masterPasswordLocked=true';
          }, 2000);
          
          return;
        }
        
        if (error.response?.status === 423) {
          toast.error('Master password is locked. Please verify with OTP.');
          
          // Show OTP verification option
          const shouldVerify = window.confirm(
            'Your master password is locked due to too many failed attempts.\n\n' +
            'An OTP has been sent to your email. Would you like to verify now?'
          );
          
          if (shouldVerify) {
            // Redirect to login with lock flag
            localStorage.removeItem('token');
            window.location.href = '/login?masterPasswordLocked=true';
          }
          
          return;
        }
        
        toast.error(error.response?.data?.message || 'Failed to decrypt password');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editFormData.site || !editFormData.username || !editFormData.password || !editFormData.masterPassword) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await onUpdate(editingId, editFormData);
      
      setEditingId(null);
      setEditFormData({});
      
      setDecryptedPasswords(prev => {
        const newState = { ...prev };
        delete newState[editingId];
        return newState;
      });
      
      setShowPassword(prev => {
        const newState = { ...prev };
        delete newState[editingId];
        return newState;
      });
      
    } catch (error) {
      // Error is already shown by onUpdate
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({});
    
    if (editingId) {
      setDecryptedPasswords(prev => {
        const newState = { ...prev };
        delete newState[editingId];
        return newState;
      });
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
            <React.Fragment key={password._id}>
              {/* Edit Form Row */}
              {editingId === password._id && (
                <tr className="bg-yellow-50">
                  <td colSpan="6" className="px-6 py-4">
                    <div className="bg-white p-4 rounded-lg shadow border border-yellow-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Edit Password for <span className="text-yellow-600">{editFormData.site || password.site}</span>
                        </h3>
                        <button
                          onClick={handleEditCancel}
                          className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                      
                      <form onSubmit={handleEditSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Website
                            </label>
                            <input
                              type="text"
                              name="site"
                              value={editFormData.site || ''}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-white"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Username
                            </label>
                            <input
                              type="text"
                              name="username"
                              value={editFormData.username || ''}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-white"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Password
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                name="password"
                                value={editFormData.password || ''}
                                onChange={handleEditChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-white pr-10"
                                required
                              />
                              {editFormData.password && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(editFormData.password);
                                    toast.success('Password copied!');
                                  }}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                  title="Copy password"
                                >
                                  <FaCopy size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Master Password
                            <span className="text-xs text-gray-500 ml-1">(required to re-encrypt)</span>
                          </label>
                          <input
                            type="password"
                            name="masterPassword"
                            value={editFormData.masterPassword || ''}
                            onChange={handleEditChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-white"
                            placeholder="Enter master password again"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Re-enter your master password to encrypt the updated password
                          </p>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={handleEditCancel}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-medium"
                          >
                            Update Password
                          </button>
                        </div>
                      </form>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Normal Row */}
              <tr className="hover:bg-gray-50">
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
                        <div className="min-w-[150px]">
                          <span className={`text-sm font-mono px-3 py-1.5 rounded border ${showPassword[password._id] ? 'bg-gray-50 text-gray-900 border-gray-300' : 'text-gray-600 border-gray-200'}`}>
                            {showPassword[password._id] 
                              ? decryptedPasswords[password._id]
                              : '•'.repeat(decryptedPasswords[password._id].length)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleShowPassword(password._id)}
                            className={`p-2 rounded-lg ${showPassword[password._id] ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            title={showPassword[password._id] ? 'Hide' : 'Show'}
                          >
                            {showPassword[password._id] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(decryptedPasswords[password._id]);
                              toast.success('Copied to clipboard!');
                            }}
                            className="bg-gray-50 text-gray-600 hover:bg-gray-100 p-2 rounded-lg"
                            title="Copy"
                          >
                            <FaCopy size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="min-w-[150px]">
                          <span className="text-sm font-mono text-gray-500 px-3 py-1.5 rounded border border-gray-200 bg-gray-50">
                            ••••••••••••
                          </span>
                        </div>
                        <button
                          onClick={() => handleViewPassword(password._id)}
                          disabled={loadingId === password._id}
                          className="bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 p-2 rounded-lg"
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
                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg"
                      title="Copy Password"
                    >
                      <FaCopy size={16} />
                    </button>
                    <button
                      onClick={() => handleEditClick(password)}
                      disabled={loadingId === password._id || editingId}
                      className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 disabled:opacity-50 p-2 rounded-lg"
                      title="Edit"
                    >
                      {loadingId === password._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      ) : (
                        <FaEdit size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(password._id)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg"
                      title="Delete"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PasswordList;