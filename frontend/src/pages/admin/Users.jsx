import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit, AlertCircle } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'teacher' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update mode
        await api.put(`/users/${editingUser}`, formData);
        toast.success('User updated successfully');
      } else {
        // Create mode
        await api.post('/auth/register', formData);
        toast.success('User created successfully');
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setFormData({ 
      name: user.name, 
      username: user.username, 
      password: '', // Keep password empty unless they want to change it
      role: user.role 
    });
    setShowModal(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success('User deleted successfully');
      fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'teacher' });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 font-display">User Management</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          Add User
        </button>
      </div>

      <div className="card shadow-sm border border-gray-100 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">Username</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 italic-last-td">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3 text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono tracking-tight">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full shadow-xs ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button 
                      onClick={() => handleEdit(user)} 
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
                      title="Edit User"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={40} className="text-gray-200" />
                      No users found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity" onClick={handleCloseModal}></div>
            
            <div 
              className="relative z-10 inline-block align-middle bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-lg w-full p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-900" id="modal-title">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      className="input-field" 
                      placeholder="e.g. Abdullah Ahmed"
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Username</label>
                    <input 
                      type="text" 
                      required 
                      className="input-field" 
                      placeholder="e.g. abdullah123"
                      value={formData.username} 
                      onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                      {editingUser ? 'New Password (optional)' : 'Password'}
                    </label>
                    <input 
                      type="password" 
                      required={!editingUser}
                      className="input-field" 
                      placeholder={editingUser ? '••••••••' : 'Password'}
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Access Role</label>
                    <select className="input-field" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                      <option value="teacher">Teacher (Class Access)</option>
                      <option value="admin">Admin (Full Control)</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-6">
                    <button type="submit" className="flex-1 btn-primary py-3 rounded-2xl font-bold">
                      {editingUser ? 'Save Changes' : 'Create User'}
                    </button>
                    <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity" onClick={() => !isDeleting && setShowDeleteModal(false)}></div>
            
            <div 
              className="relative z-10 inline-block align-middle bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-md w-full p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white p-6 sm:p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-6">
                    <AlertCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
                  <p className="text-gray-500 mb-8">
                    Are you sure you want to delete <span className="font-semibold text-gray-900">"{userToDelete?.name}"</span>? 
                    This action cannot be undone and will remove all their access.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    {isDeleting ? 'Deleting...' : 'Yes, Delete User'}
                  </button>
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;