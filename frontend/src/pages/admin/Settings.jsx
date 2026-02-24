import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  Settings as SettingsIcon, 
  Save, 
  Building2, 
  Phone, 
  MapPin, 
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    mosqueName: '',
    mosqueAddress: '',
    mosquePhone: '',
    attendanceThreshold: 60,
    academicYearStart: ''
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ 
      ...prev, 
      [name]: name === 'attendanceThreshold' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings', settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="text-secondary-600" />
          System Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure global parameters and mosque information.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* General Settings */}
        <div className="card p-6 border border-gray-100 shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <Building2 className="text-primary-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">General Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label className="label">Mosque Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="mosqueName"
                  value={settings.mosqueName}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="e.g. Al-Fursan Islamic Center"
                  required
                />
                <Building2 className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="label">Contact Phone</label>
              <div className="relative">
                <input
                  type="text"
                  name="mosquePhone"
                  value={settings.mosquePhone}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="+123 456 789"
                />
                <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="label">Academic Year</label>
              <div className="relative">
                <input
                  type="text"
                  name="academicYearStart"
                  value={settings.academicYearStart}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="2025-2026"
                />
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div className="col-span-full">
              <label className="label">Address</label>
              <div className="relative">
                <textarea
                  name="mosqueAddress"
                  value={settings.mosqueAddress}
                  onChange={handleChange}
                  className="input pl-10 py-2 h-24 resize-none"
                  placeholder="Street name, City, Zip Code"
                />
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Rules */}
        <div className="card p-6 border border-gray-100 shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <ShieldCheck className="text-secondary-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Academic & Attendance Rules</h2>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <AlertCircle className="text-amber-600 shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-amber-800">Automatic Enforcement</p>
                <p className="text-xs text-amber-700 mt-1">
                  Students whose attendance falls below this threshold will be automatically flagged or disabled according to the "60% Rule".
                </p>
              </div>
            </div>

            <div className="max-w-xs">
              <label className="label">Attendance Threshold (%)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  name="attendanceThreshold"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.attendanceThreshold}
                  onChange={handleChange}
                  className="flex-1 accent-primary-600"
                />
                <span className="text-lg font-bold text-primary-700 w-12">{settings.attendanceThreshold}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end p-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </span>
            ) : (
              <>
                <Save size={20} />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
