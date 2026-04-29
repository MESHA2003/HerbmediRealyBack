import { motion } from 'framer-motion';

const LoaderSkeleton = ({ variant = 'card' }) => {
    if (variant === 'card') {
        return (
            <div className="rounded-xl bg-white p-5 shadow-sm border border-medical-border">
                <div className="h-4 w-1/3 rounded bg-gray-200 animate-pulse mb-3"></div>
                <div className="h-8 w-2/3 rounded bg-gray-200 animate-pulse"></div>
            </div>
        );
    }
    if (variant === 'table') {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 w-full rounded bg-gray-100 animate-pulse"></div>
                ))}
            </div>
        );
    }
    return <div className="h-10 w-full rounded bg-gray-100 animate-pulse"></div>;
};

export default LoaderSkeleton;