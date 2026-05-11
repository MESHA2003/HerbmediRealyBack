import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import DashboardCard from '../components/DashboardCard';
import Table from '../components/Table';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import { Users, UserPlus, CheckCircle, Clock, Plus, Loader2, Activity, Stethoscope, Pill, Search, RefreshCw, Edit3, ClipboardList, Send, ListChecks } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import API from '../services/api';

const ReceptionDashboard = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [weeklyData, setWeeklyData] = useState([]);
    const [activeTab, setActiveTab] = useState('new');

    // New Patient form
    const [newPatient, setNewPatient] = useState({
        name: '', phone: '', age: '', date_of_birth: '', gender: 'M',
        address: '', emergency_contact_name: '', emergency_contact_phone: ''
    });

    // Follow Up form
    const [followUpPatientId, setFollowUpPatientId] = useState('');
    const [searchingPatient, setSearchingPatient] = useState(false);
    const [foundPatient, setFoundPatient] = useState(null);
    const [patientVisits, setPatientVisits] = useState([]);
    const [patientFollowUps, setPatientFollowUps] = useState([]);
    const [followUpData, setFollowUpData] = useState({
        condition_after_treatment: '',
        notes: '',
        follow_up_date: new Date().toISOString().split('T')[0],
    });
    const [editingPatient, setEditingPatient] = useState({
        name: '', phone: '', age: '', date_of_birth: '', gender: 'M',
        address: '', emergency_contact_name: '', emergency_contact_phone: ''
    });
    const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

    // Follow-Up Reassignment
    const [pendingFollowUps, setPendingFollowUps] = useState([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [reassigning, setReassigning] = useState(false);

    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 0 ? age.toString() : '';
    };
    const [visitType, setVisitType] = useState('new');
    const [symptoms, setSymptoms] = useState('');

    const fetchVisits = async () => {
        try {
            const res = await API.get('/clinic/stats/reception/');
            const data = res.data;
            setVisits(data.recent_visits || []);
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

    const fetchPendingFollowUps = async () => {
        setLoadingPending(true);
        try {
            const res = await API.get('/clinic/followups/pending-reassign/');
            setPendingFollowUps(res.data || []);
        } catch (err) {
            console.error('Failed to fetch pending follow-ups', err);
        } finally {
            setLoadingPending(false);
        }
    };

    useEffect(() => {
        fetchVisits();
        fetchPendingFollowUps();
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

    const resetFollowUp = () => {
        setFollowUpPatientId('');
        setFoundPatient(null);
        setPatientVisits([]);
        setPatientFollowUps([]);
        setFollowUpData({
            condition_after_treatment: '',
            notes: '',
            follow_up_date: new Date().toISOString().split('T')[0],
        });
        setEditingPatient({
            name: '', phone: '', age: '', date_of_birth: '', gender: 'M',
            address: '', emergency_contact_name: '', emergency_contact_phone: ''
        });
    };

    const handleSearchPatient = async () => {
        if (!followUpPatientId.trim()) {
            toast.error('Please enter a Patient ID');
            return;
        }
        setSearchingPatient(true);
        try {
            const res = await API.post('/clinic/followups/search-patient/', {
                patient_id: followUpPatientId.trim()
            });
            const data = res.data;
            setFoundPatient(data.patient);
            setPatientVisits(data.visits || []);
            setPatientFollowUps(data.follow_ups || []);
            setEditingPatient({
                name: data.patient.name || '',
                phone: data.patient.phone || '',
                age: data.patient.age?.toString() || '',
                date_of_birth: data.patient.date_of_birth || '',
                gender: data.patient.gender || 'M',
                address: data.patient.address || '',
                emergency_contact_name: data.patient.emergency_contact_name || '',
                emergency_contact_phone: data.patient.emergency_contact_phone || '',
            });
            toast.success('Patient found!');
        } catch (err) {
            if (err.response?.status === 404) {
                toast.error('Patient not found. Please check the ID.');
            } else {
                toast.error(err.response?.data?.error || 'Search failed');
            }
            setFoundPatient(null);
            setPatientVisits([]);
            setPatientFollowUps([]);
        } finally {
            setSearchingPatient(false);
        }
    };

    const handleUpdatePatient = async () => {
        if (!foundPatient) return;
        try {
            const payload = {
                patient_id: foundPatient.patient_id,
                ...editingPatient,
                age: parseInt(editingPatient.age) || 0,
            };
            const res = await API.patch('/clinic/followups/update-patient/', payload);
            setFoundPatient(res.data.patient);
            toast.success('Patient information updated');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update patient');
        }
    };

    const handleSubmitFollowUp = async () => {
        if (!foundPatient) return;
        if (!followUpData.condition_after_treatment.trim()) {
            toast.error('Please describe the condition after treatment');
            return;
        }
        setSubmittingFollowUp(true);
        try {
            await API.post('/clinic/followups/', {
                patient: foundPatient.id,
                follow_up_date: followUpData.follow_up_date,
                condition_after_treatment: followUpData.condition_after_treatment,
                notes: followUpData.notes,
                status: 'pending_reassign',
            });

            toast.success('Follow-up recorded! Pending reassignment to doctor.');

            const res = await API.post('/clinic/followups/search-patient/', {
                patient_id: foundPatient.patient_id
            });
            setPatientFollowUps(res.data.follow_ups || []);
            setFollowUpData({
                condition_after_treatment: '',
                notes: '',
                follow_up_date: new Date().toISOString().split('T')[0],
            });
            fetchVisits();
            fetchPendingFollowUps();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to record follow-up');
        } finally {
            setSubmittingFollowUp(false);
        }
    };

    const handleReassign = async (followUp) => {
        setReassigning(true);
        try {
            await API.post(`/clinic/followups/${followUp.id}/reassign/`, {
                reassigned_by: 'Receptionist'
            });
            toast.success(`Follow-up for ${followUp.patient_name} reassigned to doctor!`);
            setPendingFollowUps(prev => prev.filter(f => f.id !== followUp.id));
            fetchVisits();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to reassign');
        } finally {
            setReassigning(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'waiting': return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700"><Clock size={12} /> Waiting</span>;
            case 'in_progress': return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"><Stethoscope size={12} /> In Progress</span>;
            case 'completed': return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"><CheckCircle size={12} /> Completed</span>;
            case 'dispensed': return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"><Pill size={12} /> Dispensed</span>;
            case 'pending_reassign': return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700"><Clock size={12} /> Pending Reassign</span>;
            case 'reassigned': return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700"><Send size={12} /> Reassigned</span>;
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

    const pendingCount = pendingFollowUps.length;

    return (
        <Layout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-center border-b pb-3">
                    <h1 className="text-2xl font-bold">Reception Dashboard</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setActiveTab('new'); setIsModalOpen(true); resetFollowUp(); }}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <Plus size={18} /> New Patient
                        </button>
                        <button
                            onClick={() => { setActiveTab('followup'); setIsModalOpen(true); resetForm(); }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <RefreshCw size={18} /> Follow Up
                        </button>
                    </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => <DashboardCard key={i} {...stat} />)}
                </div>

                {/* Follow-Up Reassignments Panel */}
                <div className="bg-white p-5 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <ListChecks size={20} className="text-purple-600" />
                            Follow-Up Reassignments
                            {pendingCount > 0 && (
                                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {pendingCount} pending
                                </span>
                            )}
                        </h2>
                        <button
                            onClick={fetchPendingFollowUps}
                            className="text-purple-600 text-sm flex items-center gap-1 hover:text-purple-800"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                    {loadingPending ? (
                        <div className="text-center py-4 text-gray-400"><Loader2 size={20} className="animate-spin mx-auto" /></div>
                    ) : pendingCount === 0 ? (
                        <p className="text-gray-400 text-sm">No follow-ups pending reassignment.</p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {pendingFollowUps.map((fu) => (
                                <div key={fu.id} className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-100">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{fu.patient_name}</span>
                                            <span className="text-xs font-mono text-gray-500">({fu.patient_id})</span>
                                            {getStatusBadge('pending_reassign')}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Condition: {fu.condition_after_treatment?.substring(0, 80)}{fu.condition_after_treatment?.length > 80 ? '...' : ''}
                                        </p>
                                        <p className="text-xs text-gray-400">Follow-up date: {fu.follow_up_date}</p>
                                    </div>
                                    <button
                                        onClick={() => handleReassign(fu)}
                                        disabled={reassigning}
                                        className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {reassigning ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                        Reassign to Doctor
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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

            {/* NEW PATIENT MODAL */}
            <Modal isOpen={isModalOpen && activeTab === 'new'} onClose={() => !submitting && setIsModalOpen(false)} title="Register New Patient">
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
                        <input type="date" value={newPatient.date_of_birth} onChange={(e) => {
                            const dob = e.target.value;
                            const calculatedAge = calculateAge(dob);
                            setNewPatient({ ...newPatient, date_of_birth: dob, age: calculatedAge });
                        }} className="w-full border rounded px-3 py-2" />
                        {newPatient.date_of_birth && newPatient.age && (
                            <p className="text-xs text-green-600 mt-1">Auto-calculated age: {newPatient.age} years</p>
                        )}
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

            {/* FOLLOW UP MODAL */}
            <Modal isOpen={isModalOpen && activeTab === 'followup'} onClose={() => setIsModalOpen(false)} title="Patient Follow-Up" size="lg">
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Search size={16} /> Step 1: Search Patient by ID</h3>
                        <p className="text-xs text-gray-500 mb-2">Enter the Patient ID (e.g., SCH-2026-00001)</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={followUpPatientId}
                                onChange={(e) => setFollowUpPatientId(e.target.value.toUpperCase())}
                                placeholder="SCH-2026-00001"
                                className="flex-1 border rounded px-3 py-2 text-sm font-mono"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
                            />
                            <button
                                onClick={handleSearchPatient}
                                disabled={searchingPatient}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                {searchingPatient ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                Search
                            </button>
                        </div>
                    </div>

                    {foundPatient && (
                        <>
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                                    <CheckCircle size={16} className="text-green-600" />
                                    Patient Found: {foundPatient.patient_id}
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="font-medium">Name:</span> {foundPatient.name}</div>
                                    <div><span className="font-medium">Phone:</span> {foundPatient.phone}</div>
                                    <div><span className="font-medium">Age:</span> {foundPatient.age}</div>
                                    <div><span className="font-medium">Gender:</span> {foundPatient.gender === 'M' ? 'Male' : foundPatient.gender === 'F' ? 'Female' : 'Other'}</div>
                                    <div className="col-span-2"><span className="font-medium">Address:</span> {foundPatient.address || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                                    <Edit3 size={16} className="text-yellow-600" />
                                    Step 2: Edit Patient Information (Optional)
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">Update patient details if needed before recording follow-up.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-medium mb-1">Name</label><input type="text" value={editingPatient.name} onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                                    <div><label className="block text-xs font-medium mb-1">Phone</label><input type="tel" value={editingPatient.phone} onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                                    <div><label className="block text-xs font-medium mb-1">Age</label><input type="number" value={editingPatient.age} onChange={(e) => setEditingPatient({ ...editingPatient, age: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                                    <div><label className="block text-xs font-medium mb-1">Date of Birth</label><input type="date" value={editingPatient.date_of_birth} onChange={(e) => { const dob = e.target.value; const age = calculateAge(dob); setEditingPatient({ ...editingPatient, date_of_birth: dob, age }); }} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                                    <div><label className="block text-xs font-medium mb-1">Gender</label><select value={editingPatient.gender} onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm"><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></select></div>
                                    <div><label className="block text-xs font-medium mb-1">Address</label><input type="text" value={editingPatient.address} onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                                    <div><label className="block text-xs font-medium mb-1">Emergency Contact Name</label><input type="text" value={editingPatient.emergency_contact_name} onChange={(e) => setEditingPatient({ ...editingPatient, emergency_contact_name: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                                    <div><label className="block text-xs font-medium mb-1">Emergency Contact Phone</label><input type="tel" value={editingPatient.emergency_contact_phone} onChange={(e) => setEditingPatient({ ...editingPatient, emergency_contact_phone: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                                </div>
                                <button onClick={handleUpdatePatient} className="mt-3 bg-yellow-500 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-600">Update Patient Info</button>
                            </div>

                            {patientVisits.length > 0 && (
                                <div className="bg-white border p-4 rounded-lg">
                                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-2"><ClipboardList size={16} /> Visit History ({patientVisits.length})</h3>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {patientVisits.map((v, i) => (
                                            <div key={i} className="text-xs border-b pb-1 flex justify-between">
                                                <span className="font-mono">{v.ticket_number}</span>
                                                <span>{v.visit_date}</span>
                                                <span>{getStatusBadge(v.status)}</span>
                                                <span className="text-gray-500">{v.diagnosis ? `DX: ${v.diagnosis}` : 'No diagnosis'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {patientFollowUps.length > 0 && (
                                <div className="bg-gray-50 border p-4 rounded-lg">
                                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-2"><RefreshCw size={16} /> Previous Follow-Ups ({patientFollowUps.length})</h3>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {patientFollowUps.map((fu, i) => (
                                            <div key={i} className="text-xs border-b pb-1">
                                                <span className="font-medium">{fu.follow_up_date}</span>: {fu.condition_after_treatment}
                                                {fu.notes && <span className="text-gray-500 ml-2">Note: {fu.notes}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                                    <Activity size={16} className="text-blue-600" />
                                    Step 3: Record Condition After Treatment
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Follow-Up Date</label>
                                        <input type="date" value={followUpData.follow_up_date} onChange={(e) => setFollowUpData({ ...followUpData, follow_up_date: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Condition After Treatment *</label>
                                        <textarea value={followUpData.condition_after_treatment} onChange={(e) => setFollowUpData({ ...followUpData, condition_after_treatment: e.target.value })} placeholder="Describe the patient's condition after treatment, any improvements, side effects, or concerns..." className="w-full border rounded px-3 py-2 h-20 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Additional Notes</label>
                                        <textarea value={followUpData.notes} onChange={(e) => setFollowUpData({ ...followUpData, notes: e.target.value })} placeholder="Any additional notes for the doctor..." className="w-full border rounded px-3 py-2 h-16 text-sm" />
                                    </div>
                                    <p className="text-xs text-purple-600 font-medium">After saving, the follow-up will appear in the reassignment panel above for review.</p>
                                    <button onClick={handleSubmitFollowUp} disabled={submittingFollowUp} className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {submittingFollowUp ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><RefreshCw size={16} /> Save Follow-Up</>}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="flex pt-2">
                        <button onClick={() => setIsModalOpen(false)} className="w-full bg-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-400">Close</button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default ReceptionDashboard;