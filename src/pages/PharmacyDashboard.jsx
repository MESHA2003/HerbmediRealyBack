import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DashboardCard from '../components/DashboardCard';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { AlertCircle, CheckCircle, Package, Search, CheckSquare, History, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import LOGO_BASE64 from '../utils/logoBase64';

const PharmacyDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [pendingVisits, setPendingVisits] = useState([]);
    const [dispensedVisits, setDispensedVisits] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [stats, setStats] = useState({ pending: 0, fully: 0, totalUnits: 0 });
    const [searchTicket, setSearchTicket] = useState('');
    const [searchVisit, setSearchVisit] = useState(null);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [dispensing, setDispensing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const statsRes = await API.get('/clinic/stats/pharmacy/');
            const data = statsRes.data;
            setStats({
                pending: data.pending_count,
                fully: data.fully_dispensed_count,
                totalUnits: data.total_units_dispensed,
            });
            setPendingVisits(data.pending_visits || []);
            setDispensedVisits(data.dispensed_visits || []);
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
            // Get prescriptions for this visit
            const presRes = await API.get(`/clinic/prescriptions/?visit=${visit.id}`);
            setSearchVisit({ ...visit, prescriptions: presRes.data.results || presRes.data });
            toast.success('Visit found');
        } catch {
            toast.error('Ticket not found');
            setSearchVisit(null);
        }
    };

    const openDetails = (visit) => {
        setSelectedVisit(visit);
        setDetailsModalOpen(true);
    };

    const confirmDispenseAll = (visit) => {
        setSelectedVisit(visit);
        setConfirmModalOpen(true);
    };

    const handleDispenseAll = async () => {
        if (!selectedVisit) return;
        setDispensing(true);
        try {
            const response = await API.post(`/clinic/visits/${selectedVisit.id}/dispense-all/`);
            toast.success('All medicines dispensed successfully!');
            setConfirmModalOpen(false);
            setDetailsModalOpen(false);
            setSearchVisit(null);
            setSearchTicket('');
            // Print receipt immediately — do this before refresh so user sees it right away
            printReceipt(response.data.receipt);
            // Refresh data in background (no loading spinner)
            try {
                const statsRes = await API.get('/clinic/stats/pharmacy/');
                const data = statsRes.data;
                setStats({
                    pending: data.pending_count,
                    fully: data.fully_dispensed_count,
                    totalUnits: data.total_units_dispensed,
                });
                setPendingVisits(data.pending_visits || []);
                setDispensedVisits(data.dispensed_visits || []);
            } catch (err) {
                console.error(err);
            }
        } catch (err) {
            console.error(err);
            toast.error('Dispensing failed');
        } finally {
            setDispensing(false);
        }
    };

    const printReceipt = (receipt) => {
        const printWindow = window.open('', '_blank');
        const items = receipt.items || [];

        // Group same medicine names together
        const grouped = items.reduce((acc, item) => {
            const existing = acc.find(i => i.medicine_name === item.medicine_name);
            if (existing) {
                existing.quantity += item.quantity;
                existing.total += Number(item.total);
            } else {
                acc.push({ ...item, total: Number(item.total) });
            }
            return acc;
        }, []);

        const itemsHtml = grouped.map(item => `
            <tr>
                <td>${item.medicine_name}</td>
                <td class="center">${item.quantity}</td>
                <td class="right">${Number(item.total).toLocaleString()}</td>
            </tr>
        `).join('');
        const grandTotal = grouped.reduce((sum, item) => sum + Number(item.total), 0);

        printWindow.document.write(`
      <html>
        <head>
          <title>Pharmacy Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
            .receipt { max-width: 350px; margin: auto; border: 1px solid #ccc; padding: 15px; background: white; }
            .logo { text-align: center; margin-bottom: 8px; }
            .logo img { max-width: 80px; max-height: 80px; border-radius: 50%; }
            h2 { text-align: center; margin: 0 0 5px; font-size: 16px; }
            hr { margin: 10px 0; }
            .clinic { text-align: center; font-size: 12px; }
            .footer { text-align: center; font-size: 11px; margin-top: 15px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { padding: 4px 2px; }
            th { border-bottom: 1px solid #ccc; text-align: left; }
            td.center { text-align: center; }
            td.right { text-align: right; }
            .grand-total { font-weight: bold; font-size: 14px; text-align: right; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="logo"><img src="${LOGO_BASE64}" alt="Clinic Logo"/></div>
            <h2>Shekilindi Herbal Clinic</h2>
            <div class="clinic">P.O.Box 1249 Dodoma | Tel: +255 784324959</div>
            <hr/>
            <p><strong>Receipt No:</strong> ${receipt.receipt_number}</p>
            <p><strong>Date:</strong> ${new Date(receipt.created_at).toLocaleString()}</p>
            <p><strong>Ticket:</strong> ${receipt.ticket_number}</p>
            <p><strong>Patient:</strong> ${receipt.patient_name} (${receipt.patient_id})</p>
            <hr/>
            <table>
                <thead>
                    <tr><th>Medicine</th><th class="center">Qty</th><th class="right">Price</th><th class="right">Total</th></tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <hr/>
            <div class="grand-total">Total (TZS): ${grandTotal.toLocaleString()}</div>
            <hr/>
            <p class="footer">Thank you for visiting us!</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    // Fetch prescriptions for a visit to show in details modal
    const fetchVisitPrescriptions = async (visit) => {
        try {
            const presRes = await API.get(`/clinic/prescriptions/?visit=${visit.id}`);
            return presRes.data.results || presRes.data;
        } catch {
            return [];
        }
    };

    const openDetailsWithPrescriptions = async (visit) => {
        const prescriptions = await fetchVisitPrescriptions(visit);
        setSelectedVisit({ ...visit, prescriptions });
        setDetailsModalOpen(true);
    };

    const pendingColumns = [
        { header: 'Ticket', accessor: 'ticket_number' },
        { header: 'Patient', accessor: 'patient_name' },
        {
            header: 'Prescriptions',
            accessor: (row) => {
                const count = row.prescriptions?.length || 0;
                return <span className="text-sm">{count > 0 ? `${count} item(s)` : 'N/A'}</span>;
            }
        },
        {
            header: 'Action',
            accessor: (row) => (
                <div className="flex gap-2">
                    <button onClick={() => openDetailsWithPrescriptions(row)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex items-center gap-1">
                        <Eye size={14} /> View
                    </button>
                    <button onClick={() => confirmDispenseAll(row)}
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex items-center gap-1">
                        <CheckSquare size={14} /> Dispense All
                    </button>
                </div>
            )
        },
    ];

    const historyColumns = [
        { header: 'Date', accessor: (r) => new Date(r.updated_at).toLocaleDateString() },
        { header: 'Ticket', accessor: 'ticket_number' },
        { header: 'Patient', accessor: 'patient_name' },
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
                        <input type="text" placeholder="Search ticket" value={searchTicket}
                            onChange={e => setSearchTicket(e.target.value)} className="flex-1 border rounded p-2" />
                        <button onClick={searchByTicket} className="bg-primary-600 text-white px-4 rounded">Search</button>
                    </div>
                    {searchVisit && (
                        <div className="mt-4 bg-gray-50 p-4 rounded">
                            <p><strong>Ticket:</strong> {searchVisit.ticket_number}</p>
                            <p><strong>Patient:</strong> {searchVisit.patient_name} ({searchVisit.patient_id})</p>
                            <p><strong>Status:</strong> {searchVisit.status}</p>
                            <div className="mt-2 flex gap-2">
                                <button onClick={() => openDetailsWithPrescriptions(searchVisit)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                    View Prescriptions
                                </button>
                                {searchVisit.status !== 'dispensed' && (
                                    <button onClick={() => confirmDispenseAll(searchVisit)}
                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                        Dispense All
                                    </button>
                                )}
                            </div>
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
                    <button onClick={() => setActiveTab('pending')}
                        className={`pb-2 ${activeTab === 'pending' ? 'border-b-2 border-primary-600 text-primary-600' : ''}`}>
                        Pending ({stats.pending})
                    </button>
                    <button onClick={() => setActiveTab('history')}
                        className={`pb-2 ${activeTab === 'history' ? 'border-b-2 border-primary-600 text-primary-600' : ''}`}>
                        Dispensed ({stats.fully})
                    </button>
                </div>

                {/* Tables */}
                <div className="bg-white p-5 rounded-xl border">
                    {activeTab === 'pending' && (
                        pendingVisits.length === 0 ? <div className="text-center py-8">No pending verifications.</div> :
                            <Table columns={pendingColumns} data={pendingVisits} itemsPerPage={10} searchPlaceholder="Filter..." />
                    )}
                    {activeTab === 'history' && (
                        dispensedVisits.length === 0 ? <div className="text-center py-8">No history yet.</div> :
                            <Table columns={historyColumns} data={dispensedVisits} itemsPerPage={10} searchPlaceholder="Filter history..." />
                    )}
                </div>
            </div>

            {/* Prescription Details Modal */}
            <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)}
                title={`Prescriptions for ${selectedVisit?.patient_name} (${selectedVisit?.ticket_number})`}>
                {selectedVisit && (
                    <div className="space-y-4">
                        <p><strong>Patient ID:</strong> {selectedVisit.patient_id}</p>
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border p-2 text-left">Medicine</th>
                                    <th className="border p-2 text-left">Dosage</th>
                                    <th className="border p-2 text-center">Prescribed</th>
                                    <th className="border p-2 text-center">Dispensed</th>
                                    <th className="border p-2 text-right">Unit Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(selectedVisit.prescriptions || []).map((p, i) => (
                                    <tr key={p.id || i}>
                                        <td className="border p-2">{p.medicine_name || p.medicine?.name}</td>
                                        <td className="border p-2">{p.dosage}</td>
                                        <td className="border p-2 text-center">{p.quantity_prescribed}</td>
                                        <td className="border p-2 text-center">{p.quantity_dispensed}</td>
                                        <td className="border p-2 text-right">
                                            TZS {Number(p.medicine_price || p.medicine?.price_per_unit || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex gap-2 pt-2">
                            {selectedVisit.status !== 'dispensed' && (
                                <button onClick={() => { setDetailsModalOpen(false); confirmDispenseAll(selectedVisit); }}
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                    Dispense All & Print Receipt
                                </button>
                            )}
                            <button onClick={() => setDetailsModalOpen(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-50">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Dispense All Modal */}
            <Modal isOpen={confirmModalOpen} onClose={() => !dispensing && setConfirmModalOpen(false)}
                title="Confirm Dispense All">
                {selectedVisit && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            This will dispense <strong>ALL remaining</strong> prescriptions for:
                        </p>
                        <p><strong>Patient:</strong> {selectedVisit.patient_name}</p>
                        <p><strong>Ticket:</strong> {selectedVisit.ticket_number}</p>
                        <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                            A single receipt will be generated with all medicines.
                        </p>
                        <div className="flex gap-2 pt-2">
                            <button onClick={handleDispenseAll} disabled={dispensing}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
                                {dispensing ? 'Dispensing...' : 'Confirm & Print Receipt'}
                            </button>
                            <button onClick={() => setConfirmModalOpen(false)} disabled={dispensing}
                                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default PharmacyDashboard;