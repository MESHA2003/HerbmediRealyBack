import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DashboardCard from '../components/DashboardCard';
import Table from '../components/Table';
import { AlertCircle, CheckCircle, Package, RefreshCw, Search, CheckSquare, History } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

const PharmacyDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [pendingList, setPendingList] = useState([]);
    const [historyList, setHistoryList] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [stats, setStats] = useState({ pending: 0, fully: 0, totalUnits: 0 });
    const [searchTicket, setSearchTicket] = useState('');
    const [searchResult, setSearchResult] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get pharmacy stats from the dedicated endpoint
            const statsRes = await API.get('/clinic/stats/pharmacy/');
            const data = statsRes.data;
            setStats({
                pending: data.pending_count,
                fully: data.fully_dispensed_count,
                totalUnits: data.total_units_dispensed,
            });
            setPendingList(data.pending_prescriptions);
            // Use fully_dispensed_prescriptions directly from stats endpoint
            const history = (data.fully_dispensed_prescriptions || [])
                .sort((a, b) => new Date(b.dispensed_at || b.updated_at) - new Date(a.dispensed_at || a.updated_at))
                .slice(0, 20);
            setHistoryList(history);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load pharmacy data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const searchByTicket = async () => {
        if (!searchTicket.trim()) return toast.error('Enter ticket');
        try {
            const { data: visit } = await API.get(`/clinic/visits/by-ticket/${searchTicket}/`);
            const presRes = await API.get(`/clinic/prescriptions/?visit=${visit.id}`);
            setSearchResult(presRes.data.results || presRes.data);
            toast.success(`Found ${searchResult.length} prescriptions`);
        } catch {
            toast.error('Ticket not found');
            setSearchResult([]);
        }
    };

    const verifyDispense = async (prescription) => {
        const remaining = prescription.quantity_prescribed - prescription.quantity_dispensed;
        if (remaining <= 0) {
            toast.error('Already fully dispensed');
            return;
        }
        if (!window.confirm(`Verify that ${prescription.medicine_name} (${remaining} units) has been given?`)) return;
        try {
            await API.post(`/clinic/prescriptions/${prescription.id}/dispense/`, { quantity: remaining });
            toast.success(`Verified: ${prescription.medicine_name} dispensed.`);
            await fetchData(); // refresh both tabs
            if (searchTicket === prescription.visit_ticket) {
                setSearchResult([]);
                setSearchTicket('');
            }
        } catch (err) {
            toast.error('Verification failed');
        }
    };

    const pendingColumns = [
        { header: 'Ticket', accessor: r => r.visit_ticket || r.visit?.ticket_number || 'N/A' },
        { header: 'Patient', accessor: r => r.visit_patient_name || r.visit?.patient?.name || 'N/A' },
        { header: 'Medicine', accessor: r => r.medicine_name || r.medicine?.name || 'N/A' },
        { header: 'Prescribed', accessor: 'quantity_prescribed' },
        { header: 'Dispensed', accessor: 'quantity_dispensed' },
        {
            header: 'Action', accessor: r => (
                <button onClick={() => verifyDispense(r)} className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex items-center gap-1">
                    <CheckSquare size={14} /> Verify Dispensed
                </button>
            )
        },
    ];

    const historyColumns = [
        { header: 'Date', accessor: r => new Date(r.dispensed_at || r.updated_at).toLocaleDateString() },
        { header: 'Ticket', accessor: r => r.visit_ticket || 'N/A' },
        { header: 'Patient', accessor: r => r.visit_patient_name || 'N/A' },
        { header: 'Medicine', accessor: r => r.medicine_name || 'N/A' },
        { header: 'Prescribed', accessor: 'quantity_prescribed' },
        { header: 'Dispensed', accessor: 'quantity_dispensed' },
    ];

    if (loading) return <Layout><div className="p-8 text-center">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
                    <button onClick={fetchData} className="bg-gray-100 px-3 py-1 rounded text-sm">Refresh</button>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-xl border">
                    <div className="flex gap-2">
                        <input type="text" placeholder="Search ticket" value={searchTicket} onChange={e => setSearchTicket(e.target.value)} className="flex-1 border rounded p-2" />
                        <button onClick={searchByTicket} className="bg-primary-600 text-white px-4 rounded">Search</button>
                    </div>
                    {searchResult.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full border">
                                <thead className="bg-gray-50"><tr><th>Medicine</th><th>Prescribed</th><th>Dispensed</th><th>Action</th></tr></thead>
                                <tbody>
                                    {searchResult.map(p => (
                                        <tr key={p.id}>
                                            <td className="p-2">{p.medicine_name}</td>
                                            <td>{p.quantity_prescribed}</td><td>{p.quantity_dispensed}</td>
                                            <td>{p.quantity_dispensed < p.quantity_prescribed && <button onClick={() => verifyDispense(p)} className="text-green-600">Verify</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-5">
                    <DashboardCard title="Pending Verifications" value={stats.pending} icon={AlertCircle} color="orange" />
                    <DashboardCard title="Fully Dispensed" value={stats.fully} icon={CheckCircle} color="green" />
                    <DashboardCard title="Total Units Given" value={stats.totalUnits} icon={Package} color="blue" />
                </div>

                {/* Tabs */}
                <div className="border-b flex gap-4">
                    <button onClick={() => setActiveTab('pending')} className={`pb-2 ${activeTab === 'pending' ? 'border-b-2 border-primary-600 text-primary-600' : ''}`}>Pending ({stats.pending})</button>
                    <button onClick={() => setActiveTab('history')} className={`pb-2 ${activeTab === 'history' ? 'border-b-2 border-primary-600 text-primary-600' : ''}`}>History</button>
                </div>

                {/* Tables */}
                <div className="bg-white p-5 rounded-xl border">
                    {activeTab === 'pending' && (
                        pendingList.length === 0 ? <div className="text-center py-8">No pending verifications.</div> :
                            <Table columns={pendingColumns} data={pendingList} itemsPerPage={10} searchPlaceholder="Filter..." />
                    )}
                    {activeTab === 'history' && (
                        historyList.length === 0 ? <div className="text-center py-8">No history yet.</div> :
                            <Table columns={historyColumns} data={historyList} itemsPerPage={10} searchPlaceholder="Filter history..." />
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default PharmacyDashboard;