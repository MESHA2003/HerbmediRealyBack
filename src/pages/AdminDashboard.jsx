import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import DashboardCard from '../components/DashboardCard';
import Table from '../components/Table';
import { Users, CheckCircle, Pill, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import API from '../services/api';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        patientsRegistered30d: 0,
        patientsTreated30d: 0,
        medicinesDispensed30d: 0,
        stockAlerts: 0,
        totalRevenue: 0,
        weeklyVisits: [],
        topMedicines: [],
        lowStockMedicines: [],
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Use the new stats endpoint
                const res = await API.get('/clinic/stats/admin/');
                const data = res.data;
                setStats({
                    patientsRegistered30d: data.patients_registered || 0,
                    patientsTreated30d: data.patients_treated || 0,
                    medicinesDispensed30d: data.medicines_dispensed || 0,
                    stockAlerts: data.stock_alerts || 0,
                    totalRevenue: data.total_revenue || 0,
                    weeklyVisits: data.weekly_visits || [],
                    topMedicines: (data.top_medicines || []).map(m => ({ name: m.name, count: m.count })),
                    lowStockMedicines: data.low_stock_medicines || [],
                });
            } catch (err) {
                console.error(err);
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const summaryCards = [
        { title: 'Patients Registered (30d)', value: stats.patientsRegistered30d, icon: Users, color: 'primary' },
        { title: 'Patients Treated (30d)', value: stats.patientsTreated30d, icon: CheckCircle, color: 'green' },
        { title: 'Medicines Dispensed (30d)', value: stats.medicinesDispensed30d, icon: Pill, color: 'blue' },
        { title: 'Stock Alerts (≤40%)', value: stats.stockAlerts, icon: AlertTriangle, color: 'orange' },
        { title: 'Revenue (TZS)', value: `TZS ${Math.round(stats.totalRevenue).toLocaleString()}`, icon: TrendingUp, color: 'purple' },
    ];

    const columns = [
        { header: 'Medicine', accessor: 'name' },
        { header: 'Stock', accessor: (row) => `${row.stock_quantity} ${row.unit || ''}` },
        { header: 'Capacity', accessor: (row) => row.total_capacity || '-' },
        { header: 'Stock %', accessor: (row) => `${row.stock_percentage || 0}%` },
        {
            header: 'Status',
            accessor: (row) => {
                const pct = row.stock_percentage || 0;
                let color, label;
                if (pct <= 20) { color = 'bg-red-100 text-red-700'; label = 'CRITICAL'; }
                else if (pct <= 40) { color = 'bg-yellow-100 text-yellow-700'; label = 'LOW'; }
                else { color = 'bg-green-100 text-green-700'; label = 'OK'; }
                return <span className={`rounded-full px-2 py-1 text-xs font-medium ${color}`}>{label}</span>;
            },
        },
    ];

    if (loading) return <Layout><div className="p-8 text-center">Loading dashboard...</div></Layout>;

    return (
        <Layout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                    {summaryCards.map((stat, i) => <DashboardCard key={i} {...stat} />)}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-xl bg-white p-5 shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Activity size={20} /> Weekly Patient Visits</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={stats.weeklyVisits}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#3b8c3b" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Pill size={20} /> Top 5 Prescribed Medicines</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stats.topMedicines}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b8c3b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={20} /> Current Stock Alerts (≤40%)</h2>
                    {stats.lowStockMedicines.length > 0 ? (
                        <Table columns={columns} data={stats.lowStockMedicines} itemsPerPage={5} />
                    ) : (
                        <div className="text-center text-medical-muted py-8">All stock levels are healthy ✅</div>
                    )}
                </div>
            </motion.div>
        </Layout>
    );
};

export default AdminDashboard;