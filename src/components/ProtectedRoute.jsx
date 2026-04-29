import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoaderSkeleton from './LoaderSkeleton';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><LoaderSkeleton variant="card" /></div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

export default ProtectedRoute;