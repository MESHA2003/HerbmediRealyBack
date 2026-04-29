import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import DashboardCard from '../components/DashboardCard';
import Table from '../components/Table';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import { Users, Stethoscope, Clock, CheckCircle, ClipboardList, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

const DoctorDashboard = () => {
    const [visits, setVisits] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [prescriptions, setPrescriptions] = useState([{ medicine_id: '', dosage: '', quantity: 1 }]);
    const [submitting, setSubmitting] = useState(false);
    const [statsData, setStatsData] = useState({ waiting: 0, in_progress: 0, completed_today: 0, total_today: 0 });

    const fetchData = async () => {
        try {
            // Use the new stats endpoint for doctor
            const statsRes = await API.get('/clinic/stats/doctor/');
            const data = statsRes.data;
            setVisits(data.queue || []);
            setStatsData({
                waiting: data.waiting || 0,
                in_progress: data.in_progress || 0,
                completed_today: data.completed_today || 0,
                total_today: data.total_today || 0,
            });
            // Also fetch medicines separately
            const medsRes = await API.get('/clinic/medicines/');
            setMedicines(medsRes.data.results || medsRes.data);
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stats = [
        { title: 'Waiting', value: statsData.waiting, icon: Clock, color: 'orange' },
        { title: 'In Progress', value: statsData.in_progress, icon: Stethoscope, color: 'blue' },
        { title: 'Completed Today', value: statsData.completed_today, icon: CheckCircle, color: 'green' },
        { title: 'Total Today', value: statsData.total_today, icon: Users, color: 'primary' },
    ];

    const handleOpenConsultation = async (visit) => {
        setSelectedVisit(visit);
        setDiagnosis(visit.diagnosis || '');
        setNotes(visit.notes || '');
        setPrescriptions([{ medicine_id: '', dosage: '', quantity: 1 }]);
        setModalOpen(true);
        if (visit.status === 'waiting') {
            try {
                await API.patch(`/clinic/visits/${visit.id}/`, { status: 'in_progress' });
                setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, status: 'in_progress' } : v));
            } catch (err) {
                toast.error('Could not start consultation');
            }
        }
    };

    const submitConsultation = async () => {
        if (!diagnosis) {
            toast.error('Please enter diagnosis');
            return;
        }
        setSubmitting(true);
        try {
            for (const p of prescriptions) {
                if (!p.medicine_id || !p.dosage || p.quantity < 1) continue;
                await API.post('/clinic/prescriptions/', {
                    visit: selectedVisit.id,
                    medicine: p.medicine_id,
                    dosage: p.dosage,
                    quantity_prescribed: p.quantity,
                });
            }
            await API.post(`/clinic/visits/${selectedVisit.id}/complete_consultation/`);
            await API.patch(`/clinic/visits/${selectedVisit.id}/`, { diagnosis, notes });
            toast.success('Consultation completed. Sent to pharmacy.');
            setModalOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to complete consultation');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        { header: 'Ticket', accessor: 'ticket_number' },
        { header: 'Patient', accessor: 'patient_name' },
        { header: 'Symptoms', accessor: 'symptoms' },
        {
            header: 'Status',
            accessor: (row) => (
                row.status === 'waiting' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700"><Clock size={12} /> Waiting</span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"><Stethoscope size={12} /> In Progress</span>
                )
            ),
        },
        {
            header: 'Action',
            accessor: (row) => (
                <button onClick={() => handleOpenConsultation(row)} className="inline-flex gap-1 rounded-md bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700">
                    {row.status === 'waiting' ? <><ClipboardList size={12} /> Consult</> : <><PlusCircle size={12} /> Resume</>}
                </button>
            ),
        },
    ];

    if (loading) return <Layout><div className="p-8 text-center">Loading...</div></Layout>;

    return (
        <Layout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => <DashboardCard key={i} {...stat} />)}
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Patient Queue</h2>
                    <Table columns={columns} data={visits} />
                </div>
            </motion.div>
            {/* Consultation Modal */}
            <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={`Consultation for ${selectedVisit?.patient_name}`}>
                <div className="space-y-4">
                    {/* Patient Info */}
                    <div className="bg-gray-50 p-3 rounded text-sm">
                        <p><strong>Ticket:</strong> {selectedVisit?.ticket_number}</p>
                        <p><strong>Symptoms:</strong> {selectedVisit?.symptoms}</p>
                    </div>

                    {/* Diagnosis */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Diagnosis *</label>
                        <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Enter diagnosis" className="w-full border rounded p-2 text-sm" rows={3} />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" className="w-full border rounded p-2 text-sm" rows={2} />
                    </div>

                    {/* Prescriptions */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Prescriptions</label>
                        {prescriptions.map((p, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <select value={p.medicine_id} onChange={(e) => {
                                    const newPres = [...prescriptions];
                                    newPres[idx].medicine_id = e.target.value;
                                    setPrescriptions(newPres);
                                }} className="flex-1 border rounded p-2 text-sm">
                                    <option value="">Select medicine</option>
                                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <input type="text" placeholder="Dosage" value={p.dosage} onChange={(e) => {
                                    const newPres = [...prescriptions];
                                    newPres[idx].dosage = e.target.value;
                                    setPrescriptions(newPres);
                                }} className="w-24 border rounded p-2 text-sm" />
                                <input type="number" placeholder="Qty" min="1" value={p.quantity} onChange={(e) => {
                                    const newPres = [...prescriptions];
                                    newPres[idx].quantity = parseInt(e.target.value) || 1;
                                    setPrescriptions(newPres);
                                }} className="w-16 border rounded p-2 text-sm" />
                                <button onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))} className="bg-red-100 text-red-700 px-2 rounded text-xs hover:bg-red-200">Remove</button>
                            </div>
                        ))}
                        <button onClick={() => setPrescriptions([...prescriptions, { medicine_id: '', dosage: '', quantity: 1 }])} className="text-primary-600 text-sm hover:underline">+ Add prescription</button>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-4">
                        <button onClick={submitConsultation} disabled={submitting} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50">
                            {submitting ? 'Completing...' : 'Complete & Send to Pharmacy'}
                        </button>
                        <button onClick={() => !submitting && setModalOpen(false)} disabled={submitting} className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default DoctorDashboard;