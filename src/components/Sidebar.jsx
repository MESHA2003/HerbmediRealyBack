import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, Stethoscope, Pill, Package, Shield,
    LogOut, ClipboardList, Box, User, ChevronRight, Circle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const roleNavMap = {
    reception: [
        { path: '/reception', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/reception/reports', label: 'Reports', icon: ClipboardList },
    ],
    doctor: [
        { path: '/doctor', label: 'Queue', icon: Users },
        { path: '/doctor/history', label: 'History', icon: ClipboardList },
    ],
    pharmacy: [
        { path: '/pharmacy', label: 'Dashboard', icon: Pill },
        { path: '/inventory', label: 'Inventory', icon: Package },
    ],
    inventory: [
        { path: '/inventory', label: 'Stock', icon: Package },
        { path: '/inventory/alerts', label: 'Alerts', icon: Shield },
    ],
    admin: [
        { path: '/admin', label: 'Overview', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/reports', label: 'Reports', icon: ClipboardList },
        { path: '/inventory', label: 'Inventory', icon: Box },
    ],
};

const Sidebar = ({ sidebarOpen }) => {
    const { user, logout } = useAuth();
    const role = user?.role || 'reception';
    const navItems = roleNavMap[role] || roleNavMap.reception;

    const getInitials = () => {
        const name = user?.username || 'U';
        return name.charAt(0).toUpperCase();
    };

    return (
        <motion.aside
            initial={{ x: -280 }}
            animate={{ x: sidebarOpen ? 0 : -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-white to-gray-50 shadow-xl border-r border-medical-border custom-scrollbar"
        >
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center justify-center border-b border-medical-border bg-white">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                        🌿 HerbalClinic
                    </h1>
                </div>

                {/* User Profile Section */}
                <div className="border-b border-medical-border p-4 bg-white/50">
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold shadow-md"
                        >
                            {getInitials()}
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                        </motion.div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold truncate text-medical-text">{user?.username || 'User'}</p>
                            <p className="text-xs text-medical-muted capitalize">{user?.role || 'Role'}</p>
                            {user?.email && (
                                <p className="text-xs text-medical-muted truncate">{user.email}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                                    : 'text-medical-muted hover:bg-gray-100 hover:text-primary-600'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={20} className="transition-transform group-hover:scale-105" />
                                    <span className="flex-1">{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="h-1.5 w-1.5 rounded-full bg-primary-600"
                                        />
                                    )}
                                    <ChevronRight
                                        size={14}
                                        className={`absolute right-3 opacity-0 transition-all group-hover:opacity-100 ${isActive ? 'text-primary-600' : 'text-medical-muted'
                                            }`}
                                    />
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="border-t border-medical-border p-4 bg-white/50">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </motion.button>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;