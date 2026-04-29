import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { Calendar, Package, Users, FileText, Download } from 'lucide-react';
import Table from '../components/Table';
import toast from 'react-hot-toast';
import API from '../services/api';

const Reports = () => {
    const [dailyReport, setDailyReport] = useState([]);
    const [medicineStock, setMedicineStock] = useState([]);
    const [patientHistory, setPatientHistory] = useState([]);
    const [inventoryTransactions, setInventoryTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const [visitsRes, medicinesRes, prescriptionsRes, patientsRes] = await Promise.all([
                    API.get('/clinic/visits/'),
                    API.get('/clinic/medicines/'),
                    API.get('/clinic/prescriptions/'),
                    API.get('/clinic/patients/')
                ]);

                const visits = visitsRes.data.results || visitsRes.data;
                const medicines = medicinesRes.data.results || medicinesRes.data;
                const prescriptions = prescriptionsRes.data.results || prescriptionsRes.data;
                const patients = patientsRes.data.results || patientsRes.data;

                // Daily Report: group visits by date (last 7 days)
                const last7Days = [...Array(7).keys()].map(i => {
                    const d = new Date(); d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();
                const daily = last7Days.map(date => ({
                    date,
                    registered: visits.filter(v => v.created_at?.startsWith(date)).length,
                    completed: visits.filter(v => v.status === 'completed' && v.updated_at?.startsWith(date)).length,
                    dispensed: visits.filter(v => v.status === 'dispensed' && v.updated_at?.startsWith(date)).length,
                }));
                setDailyReport(daily);

                // Medicine Stock Report
                setMedicineStock(medicines.map(m => ({
                    name: m.name,
                    stock: m.stock_quantity,
                    reorder: m.reorder_level,
                    critical: m.critical_level,
                    status: m.stock_quantity <= m.critical_level ? 'Critical' : m.stock_quantity <= m.reorder_level ? 'Low' : 'OK'
                })));

                // Patient History Report
                const patientVisits = patients.map(p => ({
                    patient_name: p.name,
                    phone: p.phone,
                    last_visit: visits.filter(v => v.patient === p.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.created_at?.slice(0, 10) || 'Never',
                    total_visits: visits.filter(v => v.patient === p.id).length,
                    last_status: visits.filter(v => v.patient === p.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.status || 'N/A'
                }));
                setPatientHistory(patientVisits);

                // Inventory Transactions (mock for now – you can expand later)
                setInventoryTransactions([
                    { date: new Date().toISOString().slice(0, 10), medicine: 'Echinacea', type: 'Dispensed', quantity: 10, user: 'Pharmacy' },
                    { date: new Date().toISOString().slice(0, 10), medicine: 'Ginger Root', type: 'Restocked', quantity: 50, user: 'Admin' },
                ]);

            } catch (err) {
                toast.error('Failed to load reports');
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const dailyColumns = [
        { header: 'Date', accessor: 'date' },
        { header: 'Registered', accessor: 'registered' },
        { header: 'Completed', accessor: 'completed' },
        { header: 'Dispensed', accessor: 'dispensed' },
    ];
    const stockColumns = [
        { header: 'Medicine', accessor: 'name' },
        { header: 'Stock', accessor: 'stock' },
        { header: 'Reorder', accessor: 'reorder' },
        { header: 'Critical', accessor: 'critical' },
        { header: 'Status', accessor: 'status' },
    ];
    const patientColumns = [
        { header: 'Patient', accessor: 'patient_name' },
        { header: 'Phone', accessor: 'phone' },
        { header: 'Last Visit', accessor: 'last_visit' },
        { header: 'Total Visits', accessor: 'total_visits' },
        { header: 'Last Status', accessor: 'last_status' },
    ];
    const transactionColumns = [
        { header: 'Date', accessor: 'date' },
        { header: 'Medicine', accessor: 'medicine' },
        { header: 'Type', accessor: 'type' },
        { header: 'Quantity', accessor: 'quantity' },
        { header: 'User', accessor: 'user' },
    ];

    if (loading) return <Layout><div className="p-8 text-center">Loading reports...</div></Layout>;

    return (
        <Layout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h1 className="text-2xl font-bold">📊 System Reports</h1>

                {/* Daily Report */}
                <div className="rounded-xl bg-white p-5 shadow-sm border border-medical-border">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={20} className="text-primary-600" />
                        <h2 className="text-lg font-semibold">Daily Report (Last 7 Days)</h2>
                    </div>
                    <Table columns={dailyColumns} data={dailyReport} itemsPerPage={7} />
                </div>

                {/* Medicine Stock Report */}
                <div className="rounded-xl bg-white p-5 shadow-sm border border-medical-border">
                    <div className="flex items-center gap-2 mb-4">
                        <Package size={20} className="text-primary-600" />
                        <h2 className="text-lg font-semibold">Medicine Stock Report</h2>
                    </div>
                    <Table columns={stockColumns} data={medicineStock} itemsPerPage={10} />
                </div>

                {/* Patient History Report */}
                <div className="rounded-xl bg-white p-5 shadow-sm border border-medical-border">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={20} className="text-primary-600" />
                        <h2 className="text-lg font-semibold">Patient History Report</h2>
                    </div>
                    <Table columns={patientColumns} data={patientHistory} itemsPerPage={10} />
                </div>

                {/* Inventory Transactions Report */}
                <div className="rounded-xl bg-white p-5 shadow-sm border border-medical-border">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={20} className="text-primary-600" />
                        <h2 className="text-lg font-semibold">Inventory Transactions Report</h2>
                    </div>
                    <Table columns={transactionColumns} data={inventoryTransactions} itemsPerPage={10} />
                </div>
            </motion.div>
        </Layout>
    );
};

export default Reports;