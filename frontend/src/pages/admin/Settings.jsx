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
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
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
      toast.error(t('settings.load_error'));
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
      toast.success(t('settings.save_success'));
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(t('settings.save_error'));
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
          {t('settings.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* General Settings */}
        <div className="card p-6 border border-gray-100 shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <Building2 className="text-primary-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">{t('settings.general_info')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label className="label">{t('settings.mosque_name')}</label>
              <div className="relative">
                <input
                  type="text"
                  name="mosqueName"
                  value={settings.mosqueName}
                  onChange={handleChange}
                  className="input padding-inline-start-10"
                  placeholder={t('settings.mosque_name_placeholder')}
                  required
                />
                <Building2 className="absolute inset-inline-start-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="label">{t('settings.phone')}</label>
              <div className="relative">
                <input
                  type="text"
                  name="mosquePhone"
                  value={settings.mosquePhone}
                  onChange={handleChange}
                  className="input padding-inline-start-10"
                  placeholder={t('settings.phone_placeholder')}
                />
                <Phone className="absolute inset-inline-start-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="label">{t('settings.academic_year')}</label>
              <div className="relative">
                <input
                  type="text"
                  name="academicYearStart"
                  value={settings.academicYearStart}
                  onChange={handleChange}
                  className="input padding-inline-start-10"
                  placeholder={t('settings.academic_year_placeholder')}
                />
                <Calendar className="absolute inset-inline-start-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div className="col-span-full">
              <label className="label">{t('settings.address')}</label>
              <div className="relative">
                <textarea
                  name="mosqueAddress"
                  value={settings.mosqueAddress}
                  onChange={handleChange}
                  className="input padding-inline-start-10 py-2 h-24 resize-none"
                  placeholder={t('settings.address_placeholder')}
                />
                <MapPin className="absolute inset-inline-start-3 top-3 text-gray-400" size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Rules */}
        <div className="card p-6 border border-gray-100 shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <ShieldCheck className="text-secondary-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">{t('settings.rules_title')}</h2>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <AlertCircle className="text-amber-600 shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-amber-800">{t('settings.auto_enforcement')}</p>
                <p className="text-xs text-amber-700 mt-1">
                  {t('settings.auto_enforcement_desc')}
                </p>
              </div>
            </div>

            <div className="max-w-xs">
              <label className="label">{t('settings.threshold_label')}</label>
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
                {t('settings.saving')}
              </span>
            ) : (
              <>
                <Save size={20} />
                {t('common.save')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
