import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import DashboardCard from '../components/DashboardCard';
import Table from '../components/Table';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import { Users, UserPlus, CheckCircle, Clock, Plus, Loader2, Activity, Stethoscope, Pill } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import API from '../services/api';

const ReceptionDashboard = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [weeklyData, setWeeklyData] = useState([]);
    const [newPatient, setNewPatient] = useState({
        name: '', phone: '', age: '', date_of_birth: '', gender: 'M',
        address: '', emergency_contact_name: '', emergency_contact_phone: ''
    });
    const [visitType, setVisitType] = useState('new');
    const [symptoms, setSymptoms] = useState('');

    const fetchVisits = async () => {
        try {
            // Use stats endpoint for reception
            const res = await API.get('/clinic/stats/reception/');
            const data = res.data;
            setVisits(data.recent_visits || []);
            // For weekly chart, can compute from visits or use data.weekly_registrations if provided
            // Compute weekly chart from recent_visits
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                last7Days.push(d.toISOString().split('T')[0]);
            }
            const chart = last7Days.map(date => ({
                date: date.slice(5),
                count: (data.recent_visits || []).filter(v => v.created_at?.startsWith(date)).length,
            }));
            setWeeklyData(chart);
        } catch (err) {
            toast.error('Failed to load visits');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
    }, []);

    const stats = [
        { title: 'Recent Visits (30d)', value: visits.length, icon: Users, color: 'primary' },
        { title: 'Waiting', value: visits.filter(v => v.status === 'waiting').length, icon: Clock, color: 'orange' },
        { title: 'Completed', value: visits.filter(v => v.status === 'completed').length, icon: CheckCircle, color: 'green' },
        { title: "Today's", value: visits.filter(v => v.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length, icon: UserPlus, color: 'blue' },
    ];

    const handleRegister = async () => {
        if (!newPatient.name || !newPatient.phone) {
            toast.error('Patient name and phone are required');
            return;
        }
        setSubmitting(true);
        try {
            const patientRes = await API.post('/clinic/patients/', {
                name: newPatient.name,
                phone: newPatient.phone,
                age: parseInt(newPatient.age) || 0,
                date_of_birth: newPatient.date_of_birth || null,
                gender: newPatient.gender,
                address: newPatient.address,
                emergency_contact_name: newPatient.emergency_contact_name,
                emergency_contact_phone: newPatient.emergency_contact_phone,
            });
            const today = new Date().toISOString().split('T')[0];
            await API.post('/clinic/visits/', {
                patient: patientRes.data.id,
                visit_type: visitType,
                symptoms: symptoms,
                status: 'waiting',
                visit_date: today,
            });
            toast.success(`Patient registered. ID: ${patientRes.data.patient_id}`);
            resetForm();
            setIsModalOpen(false);
            fetchVisits();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewPatient({ name: '', phone: '', age: '', date_of_birth: '', gender: 'M', address: '', emergency_contact_name: '', emergency_contact_phone: '' });
        setVisitType('new');
        setSymptoms('');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'waiting': return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700"><Clock size={12} /> Waiting</span>;
            case 'in_progress': return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"><Stethoscope size={12} /> In Progress</span>;
            case 'completed': return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"><CheckCircle size={12} /> Completed</span>;
            case 'dispensed': return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"><Pill size={12} /> Dispensed</span>;
            default: return <span>{status}</span>;
        }
    };

    const columns = [
        { header: 'Ticket', accessor: 'ticket_number' },
        { header: 'Patient ID', accessor: (row) => row.patient_id || row.patient?.patient_id || 'N/A' },
        { header: 'Patient', accessor: 'patient_name' },
        { header: 'Phone', accessor: 'patient_phone' },
        { header: 'Visit Type', accessor: (row) => row.visit_type === 'new' ? 'New' : 'Follow-up' },
        { header: 'Symptoms', accessor: 'symptoms' },
        { header: 'Status', accessor: (row) => getStatusBadge(row.status) },
    ];

    if (loading) return <Layout><div className="p-8 text-center">Loading...</div></Layout>;

    return (
        <Layout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-center border-b pb-3">
                    <h1 className="text-2xl font-bold">Reception Dashboard</h1>
                    <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> New Patient</button>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => <DashboardCard key={i} {...stat} />)}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="bg-white p-5 rounded-xl border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Activity size={20} /> Weekly Patient Registrations</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b8c3b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-5 rounded-xl border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock size={20} /> Current Status Overview</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between"><span>Waiting:</span><span className="font-bold">{visits.filter(v => v.status === 'waiting').length}</span></div>
                            <div className="flex justify-between"><span>In Progress:</span><span className="font-bold">{visits.filter(v => v.status === 'in_progress').length}</span></div>
                            <div className="flex justify-between"><span>Completed:</span><span className="font-bold">{visits.filter(v => v.status === 'completed').length}</span></div>
                            <div className="flex justify-between"><span>Dispensed:</span><span className="font-bold">{visits.filter(v => v.status === 'dispensed').length}</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border">
                    <h2 className="text-lg font-semibold mb-4">Recent Patients (Last 30 days)</h2>
                    <Table columns={columns} data={visits} itemsPerPage={10} searchPlaceholder="Search by ticket, patient, phone..." />
                </div>
            </motion.div>

            <Modal isOpen={isModalOpen} onClose={() => !submitting && setIsModalOpen(false)} title="Register New Patient">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Patient Name *</label>
                        <input type="text" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} placeholder="Full name" className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone *</label>
                        <input type="tel" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} placeholder="Phone number" className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Age</label>
                        <input type="number" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} placeholder="Age" className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date of Birth</label>
                        <input type="date" value={newPatient.date_of_birth} onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Gender</label>
                        <select value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} className="w-full border rounded px-3 py-2">
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="O">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <input type="text" value={newPatient.address} onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })} placeholder="Village / District / Street" className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Emergency Contact Name</label>
                        <input type="text" value={newPatient.emergency_contact_name} onChange={(e) => setNewPatient({ ...newPatient, emergency_contact_name: e.target.value })} placeholder="Contact name" className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Emergency Contact Phone</label>
                        <input type="tel" value={newPatient.emergency_contact_phone} onChange={(e) => setNewPatient({ ...newPatient, emergency_contact_phone: e.target.value })} placeholder="Contact phone" className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Visit Type</label>
                        <select value={visitType} onChange={(e) => setVisitType(e.target.value)} className="w-full border rounded px-3 py-2">
                            <option value="new">New Patient</option>
                            <option value="followup">Follow-up</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Symptoms</label>
                        <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Describe symptoms" className="w-full border rounded px-3 py-2 h-24" />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button onClick={handleRegister} disabled={submitting} className="flex-1 bg-primary-600 text-white rounded px-4 py-2 hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {submitting ? <><Loader2 size={16} className="animate-spin" /> Registering...</> : <><UserPlus size={16} /> Register Patient</>}
                        </button>
                        <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="flex-1 bg-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-400">Cancel</button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default ReceptionDashboard;