import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit, AlertCircle, ShieldAlert, History, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
const Users = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'teacher' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [includeDisabled, setIncludeDisabled] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/users?includeDisabled=${includeDisabled}`);
      setUsers(res.data);
    } catch (error) {
      toast.error(t('users.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [includeDisabled]);

  const handleViewHistory = async (user) => {
    setSelectedTeacher(user);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const response = await api.get(`/teacher-attendance/history/${user.id}`);
      setHistoryRecords(response.data);
    } catch (error) {
      toast.error(t('common.load_error') || 'Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update mode
        await api.put(`/users/${editingUser}`, formData);
        toast.success(t('users.update_success'));
      } else {
        // Create mode
        await api.post('/auth/register', formData);
        toast.success(t('users.create_success'));
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
      if (userToDelete.status === 'Disabled') {
        // Permanent Delete (simulated by actual delete if backend supports it, or just a final warning)
        // For now, the backend DELETE /users/:id already sets status to Disabled.
        // If they are already Disabled, we might want a real permanent delete or just keep it as is.
        // The user asked for a warning about logs being disabled forever.
        await api.delete(`/users/${userToDelete.id}?permanent=true`);
      } else {
        await api.delete(`/users/${userToDelete.id}`);
      }
      toast.success(t('users.delete_success'));
      fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(t('users.load_error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReactivate = async (user) => {
    setIsDeleting(true);
    try {
      await api.put(`/users/${user.id}`, { status: 'Active' });
      toast.success(t('common.success') || 'User reactivated successfully');
      fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(t('common.error') || 'Failed to reactivate user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'teacher' });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">{t('users.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-display">{t('users.title')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{t('users.manage_subtitle') || 'Manage and monitor system access'}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2 group py-2.5 px-5 rounded-2xl shadow-lg shadow-primary-200"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-bold text-sm">{t('users.add_user')}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={includeDisabled}
            onChange={() => setIncludeDisabled(!includeDisabled)} 
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-700">
            {t('users.show_deactivated') || 'Show Deactivated'}
          </span>
        </label>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm shadow-gray-200/50">
        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-gray-50 bg-white">
          {users.map((user) => (
            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{user.name}</span>
                  {user.status === 'Disabled' && (
                    <span className="text-[10px] text-red-500 font-bold uppercase">{t('common.deactivated') || '(Deactivated)'}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400">@{user.username}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {t(`users.${user.role}`)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(user)} 
                  className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                  title={t('common.edit')}
                >
                  <Edit size={18} />
                </button>
                {user.role === 'teacher' && (
                  <button 
                    onClick={() => handleViewHistory(user)} 
                    className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all active:scale-90"
                    title={t('common.history')}
                  >
                    <History size={18} />
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(user)} 
                  className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                  title="Delete User"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle size={40} className="text-gray-100" />
                <p className="text-xs font-bold uppercase tracking-widest">{t('users.no_users')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('common.name')}</th>
                <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('common.username')}</th>
                <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('common.role')}</th>
                <th className={`px-6 py-4 ${isRTL ? 'text-left' : 'text-right'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 group-hover:bg-white flex items-center justify-center text-primary-600 font-bold border border-gray-100 shadow-xs transition-all">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono tracking-tight">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xs ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      {t(`users.${user.role}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className={`flex gap-1 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                <button 
                  onClick={() => handleEdit(user)} 
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
                  title={t('common.edit')}
                >
                  <Edit size={18} />
                </button>
                {user.role === 'teacher' && (
                  <button 
                    onClick={() => handleViewHistory(user)} 
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all active:scale-95"
                    title={t('common.history')}
                  >
                    <History size={18} />
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(user)} 
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                  title="Delete User"
                >
                  <Trash2 size={18} />
                </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <AlertCircle size={40} className="text-gray-200" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest">{t('users.no_users')}</p>
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
                    {editingUser ? t('users.edit_user') : t('users.add_new_user')}
                  </h3>
                  <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 margin-inline-start-1">{t('users.full_name')}</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 margin-inline-start-1">{t('common.username')}</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 margin-inline-start-1">
                      {editingUser ? t('users.new_password') : t('users.password')}
                    </label>
                    <input 
                      type="password" 
                      required={!editingUser}
                      className="input-field" 
                      placeholder={editingUser ? '••••••••' : t('users.password')}
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 margin-inline-start-1">{t('users.access_role')}</label>
                    <select className="input-field" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                      <option value="teacher">{t('users.teacher_role')}</option>
                      <option value="admin">{t('users.admin_role')}</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-6">
                    <button type="submit" className="flex-1 btn-primary py-3 rounded-2xl font-bold">
                      {editingUser ? t('common.save') : t('users.add_user')}
                    </button>
                    <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                      {t('common.cancel')}
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {userToDelete?.status === 'Disabled' ? t('common.delete') : t('users.delete_title')}
                  </h3>
                  <p className="text-gray-500 mb-8 px-4">
                    {userToDelete?.status === 'Disabled' 
                      ? t('users.permanent_delete_warning')
                      : t('users.deactivate_confirm', { name: userToDelete?.name })}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    {userToDelete?.status === 'Disabled' ? (isDeleting ? t('users.deleting') : t('common.delete')) : (isDeleting ? t('users.deleting') : t('users.yes_delete'))}
                  </button>
                  
                  {userToDelete?.status === 'Disabled' && (
                    <button 
                      onClick={() => handleReactivate(userToDelete)}
                      disabled={isDeleting}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      {t('users.reactivate')}
                    </button>
                  )}

                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    className="w-full py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 text-center"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Attendance History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity" onClick={() => setShowHistoryModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white p-6 sm:p-8 text-start">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedTeacher?.name} - {t('common.history') || 'Attendance History'}
                  </h3>
                  <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                     <X size={20} />
                  </button>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {loadingHistory ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                      <p className="text-sm font-medium text-gray-400">{t('common.loading')}</p>
                    </div>
                  ) : historyRecords.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No records found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historyRecords.map(record => (
                        <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md hover:shadow-gray-100 transition-all group">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                               record.status === 'Present' ? 'bg-green-100 text-green-700' : 
                               record.status === 'Absent' ? 'bg-red-100 text-red-700' : 
                               'bg-amber-100 text-amber-700'
                             }`}>
                               {record.status === 'Present' ? <Check size={18} /> : 
                               record.status === 'Absent' ? <X size={18} /> : 
                               <AlertCircle size={18} />}
                             </div>
                             <div>
                                <p className="font-bold text-sm text-gray-900">{format(new Date(record.date), 'dd MMM yyyy')}</p>
                                <p className={`text-[10px] font-black uppercase tracking-wider ${
                                  record.status === 'Present' ? 'text-green-600' : 
                                  record.status === 'Absent' ? 'text-red-500' : 
                                  'text-amber-500'
                                }`}>
                                  {t(`teacher_attendance.${record.status.toLowerCase()}`)}
                                </p>
                             </div>
                          </div>
                          {record.notes && (
                            <div className="mt-3 sm:mt-0 sm:max-w-[45%]">
                              <p className="text-[11px] text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-100 italic leading-relaxed">
                                {record.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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