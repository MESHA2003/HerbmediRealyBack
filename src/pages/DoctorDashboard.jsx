import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import DashboardCard from '../components/DashboardCard';
import Table from '../components/Table';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import { Users, Stethoscope, Clock, CheckCircle, ClipboardList, PlusCircle, RefreshCw, Send, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

// Common symptoms list
const commonSymptoms = [
    'Fever', 'Cough', 'Headache', 'Fatigue', 'Nausea', 'Joint Pain',
    'Dizziness', 'Rash', 'Sore Throat', 'Shortness of Breath', 'Chest Pain'
];

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

    // Follow-up state
    const [followUpQueue, setFollowUpQueue] = useState([]);
    const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState(null);
    const [reDiagnosis, setReDiagnosis] = useState('');
    const [doctorNotes, setDoctorNotes] = useState('');
    const [followUpPrescriptions, setFollowUpPrescriptions] = useState([{ medicine_id: '', dosage: '', quantity: 1 }]);
    const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

    // Symptom selection state
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [otherSymptoms, setOtherSymptoms] = useState('');

    const fetchData = async () => {
        try {
            const statsRes = await API.get('/clinic/stats/doctor/');
            const data = statsRes.data;
            setVisits(data.queue || []);
            setStatsData({
                waiting: data.waiting || 0,
                in_progress: data.in_progress || 0,
                completed_today: data.completed_today || 0,
                total_today: data.total_today || 0,
            });
            const medsRes = await API.get('/clinic/medicines/');
            setMedicines(medsRes.data.results || medsRes.data);
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowUpQueue = async () => {
        try {
            const res = await API.get('/clinic/followups/doctor-queue/');
            setFollowUpQueue(res.data || []);
        } catch (err) {
            console.error('Failed to fetch follow-up queue', err);
        }
    };

    useEffect(() => {
        fetchData();
        fetchFollowUpQueue();
    }, []);

    const stats = [
        { title: 'Waiting', value: statsData.waiting, icon: Clock, color: 'orange' },
        { title: 'In Progress', value: statsData.in_progress, icon: Stethoscope, color: 'blue' },
        { title: 'Completed Today', value: statsData.completed_today, icon: CheckCircle, color: 'green' },
        { title: 'Total Today', value: statsData.total_today, icon: Users, color: 'primary' },
    ];

    // Regular consultation handlers
    const handleOpenConsultation = async (visit) => {
        setSelectedVisit(visit);
        setDiagnosis(visit.diagnosis || '');
        setNotes(visit.notes || '');
        const existingSymptoms = visit.symptoms || '';
        const symptomsArray = existingSymptoms.split(',').map(s => s.trim()).filter(s => s);
        const common = symptomsArray.filter(s => commonSymptoms.includes(s));
        const other = symptomsArray.filter(s => !commonSymptoms.includes(s)).join(', ');
        setSelectedSymptoms(common);
        setOtherSymptoms(other);
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

            let symptomsStr = selectedSymptoms.join(', ');
            if (otherSymptoms.trim()) {
                symptomsStr += symptomsStr ? `, ${otherSymptoms}` : otherSymptoms;
            }

            await API.post(`/clinic/visits/${selectedVisit.id}/complete/`);
            await API.patch(`/clinic/visits/${selectedVisit.id}/`, {
                diagnosis,
                notes,
                symptoms: symptomsStr,
            });

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

    // Follow-up handlers
    const handleOpenFollowUp = async (followUp) => {
        setSelectedFollowUp(followUp);
        setReDiagnosis(followUp.re_diagnosis || '');
        setDoctorNotes(followUp.doctor_notes || '');
        setFollowUpPrescriptions([{ medicine_id: '', dosage: '', quantity: 1 }]);
        setFollowUpModalOpen(true);

        // Mark as in_progress
        if (followUp.status === 'reassigned') {
            try {
                await API.post(`/clinic/followups/${followUp.id}/start-doctor-review/`);
                setFollowUpQueue(prev => prev.map(f => f.id === followUp.id ? { ...f, status: 'in_progress' } : f));
            } catch (err) {
                toast.error('Could not start follow-up review');
            }
        }
    };

    const submitFollowUpReview = async () => {
        if (!reDiagnosis) {
            toast.error('Please enter re-diagnosis');
            return;
        }
        setSubmittingFollowUp(true);
        try {
            const payload = {
                re_diagnosis: reDiagnosis,
                doctor_notes: doctorNotes,
                prescriptions: followUpPrescriptions
                    .filter(p => p.medicine_id && p.dosage && p.quantity >= 1)
                    .map(p => ({
                        medicine_id: parseInt(p.medicine_id),
                        dosage: p.dosage,
                        quantity: parseInt(p.quantity),
                    })),
            };

            await API.post(`/clinic/followups/${selectedFollowUp.id}/complete-doctor-review/`, payload);

            toast.success('Follow-up review completed. Sent to pharmacy.');
            setFollowUpModalOpen(false);
            fetchFollowUpQueue();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to complete follow-up review');
        } finally {
            setSubmittingFollowUp(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'waiting': return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700"><Clock size={12} /> Waiting</span>;
            case 'in_progress': return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"><Stethoscope size={12} /> In Progress</span>;
            case 'completed': return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"><CheckCircle size={12} /> Completed</span>;
            case 'dispensed': return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"><Pill size={12} /> Dispensed</span>;
            case 'reassigned': return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700"><Send size={12} /> Reassigned</span>;
            case 'pending_reassign': return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700"><Clock size={12} /> Pending</span>;
            default: return <span>{status}</span>;
        }
    };

    const getFollowUpStatusBadge = (status) => {
        switch (status) {
            case 'reassigned': return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700"><Send size={12} /> New (Reassigned)</span>;
            case 'in_progress': return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"><Stethoscope size={12} /> In Progress</span>;
            case 'completed': return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"><CheckCircle size={12} /> Completed</span>;
            default: return <span>{status}</span>;
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

    const followUpColumns = [
        { header: 'Patient', accessor: (row) => <><span className="font-medium">{row.patient_name}</span> <span className="text-xs text-gray-500 font-mono">({row.patient_id})</span></> },
        { header: 'Condition', accessor: (row) => row.condition_after_treatment?.substring(0, 60) + (row.condition_after_treatment?.length > 60 ? '...' : '') },
        { header: 'Date', accessor: 'follow_up_date' },
        { header: 'Status', accessor: (row) => getFollowUpStatusBadge(row.status) },
        {
            header: 'Action',
            accessor: (row) => (
                row.status === 'completed' ? (
                    <span className="text-xs text-gray-400">Done</span>
                ) : (
                    <button onClick={() => handleOpenFollowUp(row)} className="inline-flex gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700">
                        <Stethoscope size={12} /> {row.status === 'reassigned' ? 'Review' : 'Resume'}
                    </button>
                )
            ),
        },
    ];

    if (loading) return <Layout><div className="p-8 text-center">Loading...</div></Layout>;

    const followUpCount = followUpQueue.filter(f => f.status === 'reassigned').length;

    return (
        <Layout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
                    <button
                        onClick={() => { fetchFollowUpQueue(); fetchData(); }}
                        className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-200"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => <DashboardCard key={i} {...stat} />)}
                </div>

                {/* Follow-Up Queue Panel */}
                <div className="bg-white p-5 rounded-xl border border-indigo-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <RefreshCw size={20} className="text-indigo-600" />
                            Follow-Up Re-Diagnosis Queue
                            {followUpCount > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {followUpCount} new
                                </span>
                            )}
                            {followUpQueue.length > 0 && (
                                <span className="text-xs text-gray-500 font-normal ml-1">
                                    ({followUpQueue.length} total)
                                </span>
                            )}
                        </h2>
                    </div>
                    {followUpQueue.length === 0 ? (
                        <p className="text-gray-400 text-sm">No follow-ups assigned yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-gray-500 text-xs">
                                        <th className="pb-2 pr-4">Patient</th>
                                        <th className="pb-2 pr-4">Condition</th>
                                        <th className="pb-2 pr-4">Date</th>
                                        <th className="pb-2 pr-4">Status</th>
                                        <th className="pb-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {followUpQueue.map((fu) => (
                                        <tr key={fu.id} className="border-b last:border-0">
                                            <td className="py-2 pr-4"><span className="font-medium">{fu.patient_name}</span><br /><span className="text-xs text-gray-500 font-mono">{fu.patient_id}</span></td>
                                            <td className="py-2 pr-4 text-xs text-gray-600 max-w-[200px] truncate">{fu.condition_after_treatment}</td>
                                            <td className="py-2 pr-4 text-xs">{fu.follow_up_date}</td>
                                            <td className="py-2 pr-4">{getFollowUpStatusBadge(fu.status)}</td>
                                            <td className="py-2">
                                                {fu.status === 'completed' ? (
                                                    <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                                                ) : (
                                                    <button onClick={() => handleOpenFollowUp(fu)} className="inline-flex gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700">
                                                        <Stethoscope size={12} /> {fu.status === 'reassigned' ? 'Re-Diagnose' : 'Resume'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Patient Queue</h2>
                    <Table columns={columns} data={visits} />
                </div>
            </motion.div>

            {/* Regular Consultation Modal */}
            <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={`Consultation for ${selectedVisit?.patient_name}`}>
                <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="bg-gray-50 p-3 rounded text-sm">
                        <p><strong>Ticket:</strong> {selectedVisit?.ticket_number}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Symptoms (select common)</label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            {commonSymptoms.map(symptom => (
                                <label key={symptom} className="inline-flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={selectedSymptoms.includes(symptom)} onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedSymptoms([...selectedSymptoms, symptom]);
                                        } else {
                                            setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
                                        }
                                    }} />
                                    {symptom}
                                </label>
                            ))}
                        </div>
                        <input type="text" placeholder="Other symptoms (type here)" value={otherSymptoms} onChange={(e) => setOtherSymptoms(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Diagnosis *</label>
                        <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Enter diagnosis" className="w-full border rounded p-2 text-sm" rows={3} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" className="w-full border rounded p-2 text-sm" rows={2} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Prescriptions</label>
                        {prescriptions.map((p, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <select value={p.medicine_id} onChange={(e) => { const newPres = [...prescriptions]; newPres[idx].medicine_id = e.target.value; setPrescriptions(newPres); }} className="flex-1 border rounded p-2 text-sm">
                                    <option value="">Select medicine</option>
                                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name} (Stock: {m.stock_quantity})</option>)}
                                </select>
                                <input type="text" placeholder="Dosage" value={p.dosage} onChange={(e) => { const newPres = [...prescriptions]; newPres[idx].dosage = e.target.value; setPrescriptions(newPres); }} className="w-24 border rounded p-2 text-sm" />
                                <input type="number" placeholder="Qty" min="1" value={p.quantity} onChange={(e) => { const newPres = [...prescriptions]; newPres[idx].quantity = parseInt(e.target.value) || 1; setPrescriptions(newPres); }} className="w-16 border rounded p-2 text-sm" />
                                <button onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))} className="bg-red-100 text-red-700 px-2 rounded text-xs hover:bg-red-200">Remove</button>
                            </div>
                        ))}
                        <button onClick={() => setPrescriptions([...prescriptions, { medicine_id: '', dosage: '', quantity: 1 }])} className="text-primary-600 text-sm hover:underline">+ Add prescription</button>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button onClick={submitConsultation} disabled={submitting} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50">
                            {submitting ? 'Completing...' : 'Complete & Send to Pharmacy'}
                        </button>
                        <button onClick={() => !submitting && setModalOpen(false)} disabled={submitting} className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                    </div>
                </div>
            </Modal>

            {/* Follow-Up Re-Diagnosis Modal */}
            <Modal isOpen={followUpModalOpen} onClose={() => !submittingFollowUp && setFollowUpModalOpen(false)} title={`Follow-Up Re-Diagnosis: ${selectedFollowUp?.patient_name}`} size="lg">
                <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Patient Info */}
                    <div className="bg-indigo-50 p-3 rounded text-sm border border-indigo-200">
                        <p><strong>Patient ID:</strong> {selectedFollowUp?.patient_id}</p>
                        <p><strong>Condition Reported:</strong> {selectedFollowUp?.condition_after_treatment}</p>
                        <p><strong>Previous Notes:</strong> {selectedFollowUp?.notes || 'None'}</p>
                    </div>

                    {/* Previous Prescriptions from linked visit */}
                    {selectedFollowUp?.visit && (
                        <div className="bg-gray-50 p-3 rounded text-sm border">
                            <p className="font-medium mb-1">Previous Visit: {selectedFollowUp.visit_ticket || 'N/A'}</p>
                            <p className="text-xs text-gray-500">Previous diagnosis and prescriptions were from the initial visit.</p>
                        </div>
                    )}

                    {/* Re-Diagnosis */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Re-Diagnosis *</label>
                        <textarea
                            value={reDiagnosis}
                            onChange={(e) => setReDiagnosis(e.target.value)}
                            placeholder="Enter your re-diagnosis for this follow-up patient..."
                            className="w-full border rounded p-2 text-sm"
                            rows={3}
                        />
                        <p className="text-xs text-gray-400 mt-1">Assess the patient's current condition and provide updated diagnosis.</p>
                    </div>

                    {/* Doctor Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Doctor's Notes</label>
                        <textarea
                            value={doctorNotes}
                            onChange={(e) => setDoctorNotes(e.target.value)}
                            placeholder="Additional notes about the follow-up..."
                            className="w-full border rounded p-2 text-sm"
                            rows={2}
                        />
                    </div>

                    {/* New Prescriptions */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Additional Prescriptions (Optional)</label>
                        <p className="text-xs text-gray-400 mb-2">Select additional drugs for this follow-up treatment.</p>
                        {followUpPrescriptions.map((p, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <select
                                    value={p.medicine_id}
                                    onChange={(e) => {
                                        const newPres = [...followUpPrescriptions];
                                        newPres[idx].medicine_id = e.target.value;
                                        setFollowUpPrescriptions(newPres);
                                    }}
                                    className="flex-1 border rounded p-2 text-sm"
                                >
                                    <option value="">Select medicine</option>
                                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name} (Stock: {m.stock_quantity})</option>)}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Dosage"
                                    value={p.dosage}
                                    onChange={(e) => {
                                        const newPres = [...followUpPrescriptions];
                                        newPres[idx].dosage = e.target.value;
                                        setFollowUpPrescriptions(newPres);
                                    }}
                                    className="w-24 border rounded p-2 text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    min="1"
                                    value={p.quantity}
                                    onChange={(e) => {
                                        const newPres = [...followUpPrescriptions];
                                        newPres[idx].quantity = parseInt(e.target.value) || 1;
                                        setFollowUpPrescriptions(newPres);
                                    }}
                                    className="w-16 border rounded p-2 text-sm"
                                />
                                <button
                                    onClick={() => setFollowUpPrescriptions(followUpPrescriptions.filter((_, i) => i !== idx))}
                                    className="bg-red-100 text-red-700 px-2 rounded text-xs hover:bg-red-200"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => setFollowUpPrescriptions([...followUpPrescriptions, { medicine_id: '', dosage: '', quantity: 1 }])}
                            className="text-indigo-600 text-sm hover:underline"
                        >
                            + Add additional drug
                        </button>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={submitFollowUpReview}
                            disabled={submittingFollowUp}
                            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submittingFollowUp ? (
                                <><Loader2 size={16} className="animate-spin" /> Completing...</>
                            ) : (
                                <><CheckCircle size={16} /> Complete & Send to Pharmacy</>
                            )}
                        </button>
                        <button
                            onClick={() => !submittingFollowUp && setFollowUpModalOpen(false)}
                            disabled={submittingFollowUp}
                            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default DoctorDashboard;