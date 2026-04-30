import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Leaf, Building2, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import img1 from '../assets/img1.jpg';
import img2 from '../assets/img2.jpg';
import img3 from '../assets/img3.jpg';

const images = [img1, img2, img3];

// Floral pattern SVG (repeating light green leaves)
const floralPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cpath fill='%234CAF50' fill-opacity='0.08' d='M40,10 L45,25 L60,30 L45,35 L40,50 L35,35 L20,30 L35,25 Z'/%3E%3Cpath fill='%238BC34A' fill-opacity='0.06' d='M10,70 L15,55 L30,50 L15,45 L10,30 L5,45 L-10,50 L5,55 Z'/%3E%3C/svg%3E")`;

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            toast.error('Please enter both username and password');
            return;
        }
        setIsLoading(true);
        try {
            const user = await login(username, password);
            navigate(`/${user.role}`);
        } catch (err) {
            if (err.response?.status === 400 || err.response?.status === 401) {
                toast.error('Invalid username or password');
            } else if (err.response?.status === 403) {
                toast.error('Your account is not active. Contact admin.');
            } else {
                toast.error('Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="relative flex min-h-screen flex-col items-center justify-center p-4"
            style={{ backgroundImage: floralPattern, backgroundColor: '#e8f5e9' }}
        >
            {/* Main container - white, shadowed */}
            <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* Left Side – Rotating Images (40%) */}
                <div className="hidden md:block md:w-2/5 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentImageIndex}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.8 }}
                            className="absolute inset-0"
                        >
                            <img
                                src={images[currentImageIndex]}
                                alt="Herbal Clinic"
                                className="h-full w-full object-cover"
                            />
                        </motion.div>
                    </AnimatePresence>
                    {/* Overlay with clinic info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 size={18} />
                            <h3 className="text-lg font-bold">Shekilindi Herbal Clinic & Research</h3>
                        </div>
                        <p className="text-sm opacity-90 mb-1">Owner: Shaaban Shekilindi</p>
                        <div className="flex items-center gap-2 text-xs opacity-80">
                            <MapPin size={14} />
                            <span>P.O.Box 1249 Dodoma</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs opacity-80">
                            <Phone size={14} />
                            <span>0713184406</span>
                        </div>
                    </div>
                </div>

                {/* Right Side – Login Form (60%) */}
                <div className="w-full md:w-3/5 p-6 md:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mx-auto max-w-md"
                    >
                        <div className="mb-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                                <Leaf className="h-6 w-6 text-primary-600" />
                            </div>
                            <h2 className="mt-3 text-xl font-bold text-medical-text">Welcome Back</h2>
                            <p className="mt-1 text-sm text-medical-muted">
                                Sign in to your account
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-medical-text">Username</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-medical-muted" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full rounded-lg border border-medical-border py-2 pl-10 pr-4 text-sm focus:border-primary-400 focus:outline-none"
                                        placeholder="Enter username"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-medical-text">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-medical-muted" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-lg border border-medical-border py-2 pl-10 pr-10 text-sm focus:border-primary-400 focus:outline-none"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-muted hover:text-primary-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full rounded-lg bg-primary-600 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-70"
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 py-4 text-center text-sm text-medical-muted">
                <p>&copy; {new Date().getFullYear()} Shekilindi Herbal Clinic & Research. All rights reserved.</p>
            </div>
        </div>
    );
};

export default Login;