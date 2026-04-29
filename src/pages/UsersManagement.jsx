import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Table from '../components/Table';
import { Users, Edit, Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';
import FormInput from '../components/FormInput';

const UsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({
        username: '', email: '', password: '', role: 'reception', phone: '', first_name: '', last_name: ''
    });

    const fetchUsers = async () => {
        try {
            const res = await API.get('/auth/users/');
            setUsers(res.data.results || res.data);
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async () => {
        if (!newUser.username || !newUser.password) {
            toast.error('Username and password are required');
            return;
        }
        try {
            await API.post('/auth/register/', newUser);
            toast.success(`User ${newUser.username} created`);
            setIsCreateModalOpen(false);
            setNewUser({ username: '', email: '', password: '', role: 'reception', phone: '', first_name: '', last_name: '' });
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Creation failed');
        }
    };

    const handleEditUser = (user) => {
        setEditingUser({ ...user });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async () => {
        try {
            await API.patch(`/auth/users/${editingUser.id}/`, editingUser);
            toast.success('User updated');
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Delete user "${username}"? This cannot be undone.`)) {
            try {
                await API.delete(`/auth/users/${userId}/`);
                toast.success('User deleted');
                fetchUsers();
            } catch (err) {
                toast.error('Delete failed');
            }
        }
    };

    const columns = [
        { header: 'Username', accessor: 'username' },
        { header: 'Full Name', accessor: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || '-' },
        { header: 'Email', accessor: 'email' },
        { header: 'Role', accessor: 'role' },
        { header: 'Phone', accessor: 'phone' },
        {
            header: 'Actions',
            accessor: (row) => (
                <div className="flex gap-2">
                    <button onClick={() => handleEditUser(row)} className="text-blue-600 hover:text-blue-800 transition">
                        <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteUser(row.id, row.username)} className="text-red-600 hover:text-red-800 transition">
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    if (loading) return <Layout><div className="p-8 text-center">Loading users...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users size={28} className="text-primary-600" />
                        User Management
                    </h1>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white flex items-center gap-2 hover:bg-primary-700 transition shadow-sm"
                    >
                        <Plus size={16} /> Create New User
                    </button>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm border border-medical-border">
                    <Table columns={columns} data={users} itemsPerPage={10} />
                </div>
            </div>

            {/* ================= CREATE USER MODAL (Centered) ================= */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white border-b border-medical-border px-6 py-4 flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Create New User</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 transition">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="Username *" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
                                    <FormInput label="Password *" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                                    <FormInput label="First Name" value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} />
                                    <FormInput label="Last Name" value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} />
                                    <FormInput label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                                    <FormInput label="Phone" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-medical-text mb-1">Role</label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            className="w-full rounded-lg border border-medical-border px-3 py-2 focus:border-primary-400 focus:outline-none"
                                        >
                                            <option value="reception">Reception</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="pharmacy">Pharmacy</option>
                                            <option value="inventory">Inventory</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-medical-border">
                                    <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-lg border border-medical-border hover:bg-gray-50 transition">
                                        Cancel
                                    </button>
                                    <button onClick={handleCreateUser} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition">
                                        Create User
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ================= EDIT USER MODAL (Centered) ================= */}
            <AnimatePresence>
                {isEditModalOpen && editingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white border-b border-medical-border px-6 py-4 flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Edit User</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 transition">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="Username" value={editingUser.username} disabled />
                                    <FormInput label="Email" type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
                                    <FormInput label="First Name" value={editingUser.first_name} onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })} />
                                    <FormInput label="Last Name" value={editingUser.last_name} onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })} />
                                    <FormInput label="Phone" value={editingUser.phone} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} />
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-medical-text mb-1">Role</label>
                                        <select
                                            value={editingUser.role}
                                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                            className="w-full rounded-lg border border-medical-border px-3 py-2 focus:border-primary-400 focus:outline-none"
                                        >
                                            <option value="reception">Reception</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="pharmacy">Pharmacy</option>
                                            <option value="inventory">Inventory</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-medical-border">
                                    <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg border border-medical-border hover:bg-gray-50 transition">
                                        Cancel
                                    </button>
                                    <button onClick={handleUpdateUser} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition">
                                        Update User
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default UsersManagement;