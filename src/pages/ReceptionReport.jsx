import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Users, UserPlus, TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import API from '../services/api';

const ReceptionReport = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartPeriod, setChartPeriod] = useState('weekly');
    const [chartData, setChartData] = useState([]);
    const [statusData, setStatusData] = useState([]);

    const fetchData = async () => {
        try {
            const { data } = await API.get('/clinic/visits/');
            const allVisits = data.results || data;
            setVisits(allVisits);
            prepareChartData(allVisits, chartPeriod);
            prepareStatusData(allVisits);
        } catch (err) {
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const prepareChartData = (visitsData, period) => {
        const grouped = {};
        visitsData.forEach(visit => {
            const date = new Date(visit.created_at);
            let key;
            if (period === 'daily') {
                key = date.toISOString().split('T')[0];
            } else if (period === 'weekly') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            grouped[key] = (grouped[key] || 0) + 1;
        });
        let sorted = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
        if (period === 'daily') sorted = sorted.slice(-7);
        else if (period === 'weekly') sorted = sorted.slice(-6);
        else sorted = sorted.slice(-6);
        const formatted = sorted.map(([name, value]) => ({
            name: period === 'daily' ? name.slice(5) : (period === 'weekly' ? `Week ${name.slice(5)}` : name),
            value
        }));
        setChartData(formatted);
    };

    const prepareStatusData = (visitsData) => {
        const statusCount = {
            waiting: visitsData.filter(v => v.status === 'waiting').length,
            in_progress: visitsData.filter(v => v.status === 'in_progress').length,
            completed: visitsData.filter(v => v.status === 'completed').length,
            dispensed: visitsData.filter(v => v.status === 'dispensed').length,
        };
        setStatusData([
            { name: 'Waiting', value: statusCount.waiting, color: '#eab308' },
            { name: 'In Progress', value: statusCount.in_progress, color: '#3b82f6' },
            { name: 'Completed', value: statusCount.completed, color: '#22c55e' },
            { name: 'Dispensed', value: statusCount.dispensed, color: '#6b7280' },
        ]);
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (visits.length) {
            prepareChartData(visits, chartPeriod);
        }
    }, [chartPeriod, visits]);

    const totalPatients = visits.length;
    const uniquePatients = new Set(visits.map(v => v.patient)).size;

    if (loading) return <Layout><div className="p-8 text-center">Loading report...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 size={24} /> Reception Report
                    </h1>
                    <div className="flex gap-2 bg-white rounded-lg border border-medical-border p-1">
                        <button onClick={() => setChartPeriod('daily')} className={`px-3 py-1 text-sm rounded-md transition ${chartPeriod === 'daily' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}>Daily</button>
                        <button onClick={() => setChartPeriod('weekly')} className={`px-3 py-1 text-sm rounded-md transition ${chartPeriod === 'weekly' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}>Weekly</button>
                        <button onClick={() => setChartPeriod('monthly')} className={`px-3 py-1 text-sm rounded-md transition ${chartPeriod === 'monthly' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}>Monthly</button>
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                    <div className="rounded-xl bg-white p-5 shadow-sm border">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-primary-100 p-3"><Users size={24} className="text-primary-600" /></div>
                            <div><p className="text-sm text-medical-muted">Total Visits</p><p className="text-2xl font-bold">{totalPatients}</p></div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm border">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-blue-100 p-3"><UserPlus size={24} className="text-blue-600" /></div>
                            <div><p className="text-sm text-medical-muted">Unique Patients</p><p className="text-2xl font-bold">{uniquePatients}</p></div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-xl bg-white p-5 shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp size={20} /> Patient Registrations ({chartPeriod})</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b8c3b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><PieChartIcon size={20} /> Patient Status Distribution</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                            {statusData.map(s => <div key={s.name} className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} /> <span className="text-xs">{s.name}: {s.value}</span></div>)}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ReceptionReport;