import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User, Mail, Phone, Building2, Save, LogOut } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  university: string;
  university_id: string;
}

interface University {
  id: string;
  name: string;
  code: string;
}

export function AccountPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    university: '',
    university_id: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    const { data } = await supabase.from('universities').select('*').order('name');
    if (data) setUniversities(data);
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setIsAdmin(data.email === 'admin@campus.demo');
        setFormData({
          name: data.name,
          email: data.email,
          phone_number: data.phone_number,
          university: data.university,
          university_id: data.university_id || '',
        });
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    const updateData: any = {
      name: formData.name,
      email: formData.email,
      phone_number: formData.phone_number,
    };

    if (isAdmin && formData.university_id) {
      const selectedUni = universities.find(u => u.id === formData.university_id);
      updateData.university = selectedUni?.name || formData.university;
      updateData.university_id = formData.university_id;
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, ...updateData });
      setEditMode(false);
      window.location.reload();
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Account</h1>
              <p className="text-blue-100 text-sm">Manage your profile information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Profile Information</h2>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditMode(false);
                      if (profile) {
                        setFormData({
                          name: profile.name,
                          email: profile.email,
                          phone_number: profile.phone_number,
                          university: profile.university,
                          university_id: profile.university_id || '',
                        });
                      }
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center space-x-2">
                  <User size={18} />
                  <span>Full Name</span>
                </div>
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-800 font-medium">
                  {profile?.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Mail size={18} />
                  <span>Email Address</span>
                </div>
              </label>
              {editMode ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-800 font-medium">
                  {profile?.email}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Phone size={18} />
                  <span>Phone Number</span>
                </div>
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-800 font-medium">
                  {profile?.phone_number}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Building2 size={18} />
                  <span>University</span>
                  {isAdmin && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Admin Can Change</span>}
                </div>
              </label>
              {editMode && isAdmin ? (
                <select
                  value={formData.university_id}
                  onChange={(e) => setFormData({ ...formData, university_id: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select your university</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-800 font-medium">
                  {profile?.university}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all flex items-center justify-center space-x-2"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Changes to your profile will be saved to your account and reflected across all campus services.
          </p>
        </div>
      </div>
    </div>
  );
}
