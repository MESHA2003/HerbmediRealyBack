import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, Menu, LogOut, ChevronDown, Mail, Phone, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Static notifications (replace with real API later if needed)
    const notifications = [
        { id: 1, text: 'Low stock alert: Echinacea', time: '5 min ago', read: false },
        { id: 2, text: 'New patient registered', time: '1 hour ago', read: false },
        { id: 3, text: 'Prescription dispensed', time: '2 hours ago', read: true },
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
    };

    // Get display name (first_name + last_name or username)
    const displayName = user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.username || 'User';

    return (
        <motion.header
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 right-0 top-0 z-30 h-16 bg-white shadow-sm border-b border-medical-border md:left-64"
        >
            <div className="flex h-full items-center justify-between px-4 md:px-6">
                {/* Left: Menu button + Search */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleSidebar}
                        className="rounded-md p-1 text-medical-muted hover:bg-gray-100 md:hidden"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-medical-muted" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-80 rounded-lg border border-medical-border bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary-400 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Right: Notifications + User */}
                <div className="flex items-center gap-4">
                    {/* Notifications Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative rounded-full p-1.5 hover:bg-gray-100 transition"
                        >
                            <Bell size={20} className="text-medical-muted" />
                            {unreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 mt-2 w-80 rounded-lg border border-medical-border bg-white shadow-lg z-50"
                                >
                                    <div className="p-3 border-b border-medical-border">
                                        <h3 className="font-semibold">Notifications</h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.map(notif => (
                                            <div key={notif.id} className={`p-3 border-b border-medical-border hover:bg-gray-50 ${!notif.read ? 'bg-primary-50' : ''}`}>
                                                <p className="text-sm">{notif.text}</p>
                                                <p className="text-xs text-medical-muted mt-1">{notif.time}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-2 text-center border-t border-medical-border">
                                        <button className="text-sm text-primary-600">View all</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* User Profile + Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 rounded-full hover:bg-gray-100 p-1 transition"
                        >
                            <div className="h-8 w-8 overflow-hidden rounded-full bg-primary-100 flex items-center justify-center">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <User size={18} className="text-primary-600" />
                                )}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium">{displayName}</p>
                                <p className="text-xs text-medical-muted capitalize">{user?.role}</p>
                            </div>
                            <ChevronDown size={16} className="text-medical-muted hidden md:block" />
                        </button>

                        {/* User Menu Dropdown with full details */}
                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 mt-2 w-72 rounded-lg border border-medical-border bg-white shadow-lg z-50"
                                >
                                    <div className="p-4 border-b border-medical-border">
                                        <p className="font-semibold text-medical-text">{displayName}</p>
                                        <p className="text-xs text-medical-muted capitalize mt-0.5">Role: {user?.role}</p>
                                        {user?.email && (
                                            <div className="flex items-center gap-2 mt-2 text-sm text-medical-text">
                                                <Mail size={14} className="text-medical-muted" />
                                                <span>{user.email}</span>
                                            </div>
                                        )}
                                        {user?.phone && (
                                            <div className="flex items-center gap-2 mt-1 text-sm text-medical-text">
                                                <Phone size={14} className="text-medical-muted" />
                                                <span>{user.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2">
                                    <button
                                        onClick={() => { setShowUserMenu(false); navigate('/change-password'); }}
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        <Lock size={16} />
                                        <span>Change Password</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};

export default Navbar;