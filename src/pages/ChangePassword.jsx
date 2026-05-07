import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Lock, Eye, EyeOff, Save, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (field) => (e) => {
        setForm({ ...form, [field]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.old_password || !form.new_password || !form.confirm_password) {
            toast.error('All fields are required');
            return;
        }

        if (form.new_password !== form.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }

        if (form.new_password.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        setSubmitting(true);
        try {
            await API.post('/auth/change-password/', {
                old_password: form.old_password,
                new_password: form.new_password,
            });
            toast.success('Password changed successfully!');
            setForm({ old_password: '', new_password: '', confirm_password: '' });
            // Navigate back to dashboard after a short delay
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to change password';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg mx-auto space-y-6"
            >
                {/* Header */}
                <div className="flex items-center gap-3 border-b pb-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-full p-2 hover:bg-gray-100 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Change Password</h1>
                        <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                Current Password
                            </label>
                            <div className="relative">
                                <Lock
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type={showOld ? 'text' : 'password'}
                                    value={form.old_password}
                                    onChange={handleChange('old_password')}
                                    placeholder="Enter current password"
                                    className="w-full border rounded-lg pl-10 pr-10 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOld(!showOld)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={form.new_password}
                                    onChange={handleChange('new_password')}
                                    placeholder="Enter new password"
                                    className="w-full border rounded-lg pl-10 pr-10 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={form.confirm_password}
                                    onChange={handleChange('confirm_password')}
                                    placeholder="Re-enter new password"
                                    className="w-full border rounded-lg pl-10 pr-10 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-primary-600 text-white rounded-lg px-4 py-2.5 hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition"
                        >
                            {submitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Updating...</>
                            ) : (
                                <><Save size={18} /> Update Password</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">🔒 Password Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Use at least 6 characters</li>
                        <li>Mix letters, numbers, and symbols</li>
                        <li>Avoid using obvious personal information</li>
                        <li>Don't reuse passwords across accounts</li>
                    </ul>
                </div>
            </motion.div>
        </Layout>
    );
};

export default ChangePassword;