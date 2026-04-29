import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { FileText, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

const DoctorHistory = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await API.get('/clinic/visits/history/');
                setVisits(data.results || data);
            } catch (err) {
                toast.error('Failed to load patient history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleViewPrescriptions = async (visit) => {
        try {
            const { data } = await API.get(`/clinic/prescriptions/?visit=${visit.id}`);
            setSelectedVisit({ ...visit, prescriptions: data.results || data });
            setModalOpen(true);
        } catch (err) {
            toast.error('Failed to load prescriptions');
        }
    };

    const columns = [
        { header: 'Date', accessor: (row) => new Date(row.created_at).toLocaleDateString() },
        { header: 'Ticket', accessor: 'ticket_number' },
        { header: 'Patient', accessor: 'patient_name' },
        { header: 'Diagnosis', accessor: 'diagnosis' },
        { header: 'Notes', accessor: (row) => row.notes?.slice(0, 50) || '-' },
        {
            header: 'Prescriptions',
            accessor: (row) => (
                <button
                    onClick={() => handleViewPrescriptions(row)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    <Eye size={16} /> View
                </button>
            ),
        },
    ];

    if (loading) return <Layout><div className="p-8 text-center">Loading history...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Patient Consultation History</h1>
                <div className="rounded-xl bg-white p-5 shadow-sm border border-medical-border">
                    <Table columns={columns} data={visits} itemsPerPage={10} />
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Prescriptions">
                {selectedVisit && (
                    <div className="space-y-4">
                        <p><strong>Patient:</strong> {selectedVisit.patient_name}</p>
                        <p><strong>Ticket:</strong> {selectedVisit.ticket_number}</p>
                        <p><strong>Diagnosis:</strong> {selectedVisit.diagnosis}</p>
                        <div className="border-t pt-2">
                            <h3 className="font-semibold">Prescriptions</h3>
                            <ul className="list-disc pl-5 mt-2">
                                {selectedVisit.prescriptions?.map(p => (
                                    <li key={p.id}>{p.medicine_name} – {p.dosage} (Qty: {p.quantity_prescribed})</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default DoctorHistory;