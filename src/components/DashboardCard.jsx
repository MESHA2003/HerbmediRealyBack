import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const DashboardCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => {
    const colorMap = {
        primary: 'bg-primary-50 text-primary-700',
        blue: 'bg-blue-50 text-blue-700',
        green: 'bg-green-50 text-green-700',
        orange: 'bg-orange-50 text-orange-700',
    };

    return (
        <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-xl bg-medical-card p-5 shadow-sm border border-medical-border transition-all"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-medical-muted">{title}</p>
                    <motion.p
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="mt-1 text-2xl font-bold text-medical-text"
                    >
                        {value}
                    </motion.p>
                    {trend && (
                        <div className="mt-2 flex items-center gap-1 text-xs">
                            {trend > 0 ? <TrendingUp size={12} className="text-green-600" /> : <TrendingDown size={12} className="text-red-600" />}
                            <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>{Math.abs(trend)}%</span>
                            <span className="text-medical-muted">vs last month</span>
                        </div>
                    )}
                </div>
                <div className={`rounded-full p-3 ${colorMap[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardCard;