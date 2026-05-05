import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DashboardCard from '../components/DashboardCard';
import Table from '../components/Table';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import { Package, AlertTriangle, TrendingUp, Plus, Edit, Trash2, DollarSign, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

const unitMapping = {
    liquid: ['ml', 'liters'],
    powder: ['g', 'kg'],
    capsules: ['pieces', 'bottles'],
    raw_herbs: ['kg', 'bundles'],
};

const Inventory = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [stockAdjustItem, setStockAdjustItem] = useState(null);
    const [stockAdjustQty, setStockAdjustQty] = useState(0);
    const [stockAdjustType, setStockAdjustType] = useState('add');
    const [newMedicine, setNewMedicine] = useState({
        name: '',
        category: 'capsules',
        unit: 'pieces',
        price_per_unit: '',
        source: '',
        stock_quantity: '',
        total_capacity: '',
        reorder_level: 10,
        critical_level: 5,
        expiry_date: '',
        description: '',
    });

    const fetchMedicines = async () => {
        try {
            const { data } = await API.get('/clinic/medicines/');
            setMedicines(data.results || data);
        } catch (err) {
            toast.error('Failed to load medicines');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, []);

    const handleCategoryChange = (category) => {
        const units = unitMapping[category] || ['pieces'];
        setNewMedicine({ ...newMedicine, category, unit: units[0] });
    };

    const handleEditCategoryChange = (category) => {
        const units = unitMapping[category] || ['pieces'];
        setEditingItem({ ...editingItem, category, unit: units[0] });
    };

    const totalStockValue = medicines.reduce((sum, m) => sum + (m.price_per_unit * m.stock_quantity), 0);
    const lowStockCount = medicines.filter(m => m.stock_percentage <= 40).length;
    const criticalStockCount = medicines.filter(m => m.stock_percentage <= 20).length;

    const stats = [
        { title: 'Total Items', value: medicines.length, icon: Package, color: 'primary' },
        { title: 'Low Stock (≤40%)', value: lowStockCount, icon: AlertTriangle, color: 'orange' },
        { title: 'Critical (≤20%)', value: criticalStockCount, icon: AlertTriangle, color: 'red' },
        { title: 'Total Stock Value', value: `TZS ${Math.round(totalStockValue).toLocaleString()}`, icon: DollarSign, color: 'green' },
    ];

    const handleAddMedicine = async () => {
        if (!newMedicine.name) {
            toast.error('Medicine name required');
            return;
        }
        if (!newMedicine.total_capacity || newMedicine.total_capacity <= 0) {
            toast.error('Total capacity must be greater than 0');
            return;
        }
        try {
            const payload = {
                ...newMedicine,
                price_per_unit: parseFloat(newMedicine.price_per_unit) || 0,
                stock_quantity: parseInt(newMedicine.stock_quantity) || 0,
                total_capacity: parseInt(newMedicine.total_capacity) || 0,
            };
            await API.post('/clinic/medicines/', payload);
            toast.success('Medicine added successfully');
            setIsAddModalOpen(false);
            setNewMedicine({
                name: '', category: 'capsules', unit: 'pieces', price_per_unit: '', source: '', stock_quantity: '',
                total_capacity: '', reorder_level: 10, critical_level: 5, expiry_date: '', description: ''
            });
            fetchMedicines();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to add medicine');
        }
    };

    const handleEdit = (med) => {
        setEditingItem({ ...med });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        try {
            await API.put(`/clinic/medicines/${editingItem.id}/`, editingItem);
            toast.success('Medicine updated');
            setIsEditModalOpen(false);
            fetchMedicines();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
            try {
                await API.delete(`/clinic/medicines/${id}/`);
                toast.success('Medicine deleted');
                fetchMedicines();
            } catch (err) {
                toast.error('Delete failed');
            }
        }
    };

    const handleStockAdjust = (med) => {
        setStockAdjustItem(med);
        setStockAdjustQty(0);
        setStockAdjustType('add');
        setIsStockModalOpen(true);
    };

    const confirmStockAdjust = async () => {
        if (stockAdjustQty <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }
        let newQty = stockAdjustItem.stock_quantity;
        if (stockAdjustType === 'add') {
            newQty += stockAdjustQty;
        } else {
            if (stockAdjustQty > stockAdjustItem.stock_quantity) {
                toast.error('Cannot reduce more than current stock');
                return;
            }
            newQty -= stockAdjustQty;
        }
        try {
            await API.patch(`/clinic/medicines/${stockAdjustItem.id}/`, { stock_quantity: newQty });
            toast.success(`Stock ${stockAdjustType === 'add' ? 'increased' : 'reduced'} by ${stockAdjustQty}`);
            setIsStockModalOpen(false);
            fetchMedicines();
        } catch (err) {
            toast.error('Stock adjustment failed');
        }
    };

    const renderHealthBar = (row) => {
        const percent = row.stock_percentage || 0;
        let bgColor = 'bg-green-500';
        if (percent <= 20) bgColor = 'bg-red-500';
        else if (percent <= 40) bgColor = 'bg-yellow-500';
        return (
            <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className={`${bgColor} h-2 rounded-full`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                </div>
                <span className="text-xs font-medium">{percent}%</span>
            </div>
        );
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Category', accessor: (row) => row.category?.replace('_', ' ') || '-' },
        { header: 'Stock', accessor: (row) => `${row.stock_quantity} ${row.unit}` },
        { header: 'Capacity', accessor: (row) => row.total_capacity || '-' },
        { header: 'Health', accessor: renderHealthBar },
        { header: 'Price/Unit', accessor: (row) => `TZS ${Number(row.price_per_unit).toLocaleString()}` },
        { header: 'Expiry', accessor: (row) => row.expiry_date || '-' },
        {
            header: 'Status',
            accessor: (row) => {
                let color, label;
                if (row.stock_percentage <= 20) { color = 'bg-red-100 text-red-700'; label = 'CRITICAL'; }
                else if (row.stock_percentage <= 40) { color = 'bg-yellow-100 text-yellow-700'; label = 'LOW'; }
                else { color = 'bg-green-100 text-green-700'; label = 'OK'; }
                return <span className={`rounded-full px-2 py-1 text-xs font-medium ${color}`}>{label}</span>;
            },
        },
        {
            header: 'Actions',
            accessor: (row) => (
                <div className="flex gap-2">
                    <button onClick={() => handleStockAdjust(row)} className="text-green-600 hover:text-green-800" title="Adjust Stock">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(row.id, row.name)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                </div>
            ),
        },
    ];

    if (loading) return <Layout><div className="p-8 text-center">Loading inventory...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Inventory Management</h1>
                    <button onClick={() => setIsAddModalOpen(true)} className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white flex items-center gap-2">
                        <Plus size={16} /> Add Medicine
                    </button>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => <DashboardCard key={i} {...stat} />)}
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm border border-medical-border">
                    <h2 className="text-lg font-semibold mb-4">Medicine Stock with Health Indicator</h2>
                    <Table
                        columns={columns}
                        data={medicines}
                        itemsPerPage={10}
                        searchPlaceholder="Search by medicine name, category..."
                    />
                </div>
            </div>

            {/* Add Medicine Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Medicine">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <FormInput label="Drug Name *" value={newMedicine.name} onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })} required />
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select value={newMedicine.category} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full rounded-lg border border-medical-border px-3 py-2">
                            <option value="liquid">Liquid</option>
                            <option value="powder">Powder</option>
                            <option value="capsules">Capsules</option>
                            <option value="raw_herbs">Raw Herbs</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Unit</label>
                        <select value={newMedicine.unit} onChange={(e) => setNewMedicine({ ...newMedicine, unit: e.target.value })} className="w-full rounded-lg border border-medical-border px-3 py-2">
                            {unitMapping[newMedicine.category].map(unit => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                    </div>
                    <FormInput label="Price per Unit (TZS)" type="number" step="1" value={newMedicine.price_per_unit} onChange={(e) => setNewMedicine({ ...newMedicine, price_per_unit: e.target.value })} />
                    <FormInput label="Initial Stock Quantity" type="number" value={newMedicine.stock_quantity} onChange={(e) => setNewMedicine({ ...newMedicine, stock_quantity: e.target.value })} />
                    <FormInput label="Total Capacity (100% Level) *" type="number" value={newMedicine.total_capacity} onChange={(e) => setNewMedicine({ ...newMedicine, total_capacity: e.target.value })} required />
                    <FormInput label="Reorder Level" type="number" value={newMedicine.reorder_level} onChange={(e) => setNewMedicine({ ...newMedicine, reorder_level: e.target.value })} />
                    <FormInput label="Critical Level" type="number" value={newMedicine.critical_level} onChange={(e) => setNewMedicine({ ...newMedicine, critical_level: e.target.value })} />
                    <FormInput label="Source (Supplier/Farmer)" value={newMedicine.source} onChange={(e) => setNewMedicine({ ...newMedicine, source: e.target.value })} />
                    <FormInput label="Expiry Date (Optional)" type="date" value={newMedicine.expiry_date} onChange={(e) => setNewMedicine({ ...newMedicine, expiry_date: e.target.value })} />
                    <FormInput label="Description" textarea rows={2} value={newMedicine.description} onChange={(e) => setNewMedicine({ ...newMedicine, description: e.target.value })} />
                    <button onClick={handleAddMedicine} className="w-full rounded-lg bg-primary-600 py-2 text-white">Add Medicine</button>
                </div>
            </Modal>

            {/* Edit Medicine Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Medicine">
                {editingItem && (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                        <FormInput label="Drug Name" value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} required />
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select value={editingItem.category} onChange={(e) => handleEditCategoryChange(e.target.value)} className="w-full rounded-lg border border-medical-border px-3 py-2">
                                <option value="liquid">Liquid</option>
                                <option value="powder">Powder</option>
                                <option value="capsules">Capsules</option>
                                <option value="raw_herbs">Raw Herbs</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Unit</label>
                            <select value={editingItem.unit} onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })} className="w-full rounded-lg border border-medical-border px-3 py-2">
                                {unitMapping[editingItem.category]?.map(unit => <option key={unit} value={unit}>{unit}</option>) || <option>pieces</option>}
                            </select>
                        </div>
                        <FormInput label="Price per Unit (TZS)" type="number" step="1" value={editingItem.price_per_unit} onChange={(e) => setEditingItem({ ...editingItem, price_per_unit: e.target.value })} />
                        <FormInput label="Stock Quantity" type="number" value={editingItem.stock_quantity} onChange={(e) => setEditingItem({ ...editingItem, stock_quantity: e.target.value })} />
                        <FormInput label="Total Capacity" type="number" value={editingItem.total_capacity} onChange={(e) => setEditingItem({ ...editingItem, total_capacity: e.target.value })} />
                        <FormInput label="Reorder Level" type="number" value={editingItem.reorder_level} onChange={(e) => setEditingItem({ ...editingItem, reorder_level: e.target.value })} />
                        <FormInput label="Critical Level" type="number" value={editingItem.critical_level} onChange={(e) => setEditingItem({ ...editingItem, critical_level: e.target.value })} />
                        <FormInput label="Source" value={editingItem.source} onChange={(e) => setEditingItem({ ...editingItem, source: e.target.value })} />
                        <FormInput label="Expiry Date" type="date" value={editingItem.expiry_date} onChange={(e) => setEditingItem({ ...editingItem, expiry_date: e.target.value })} />
                        <FormInput label="Description" textarea rows={2} value={editingItem.description} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} />
                        <button onClick={handleUpdate} className="w-full rounded-lg bg-primary-600 py-2 text-white">Update Medicine</button>
                    </div>
                )}
            </Modal>

            {/* Stock Adjustment Modal */}
            <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title="Adjust Stock">
                {stockAdjustItem && (
                    <div className="space-y-4">
                        <p><strong>Medicine:</strong> {stockAdjustItem.name}</p>
                        <p><strong>Current Stock:</strong> {stockAdjustItem.stock_quantity} {stockAdjustItem.unit}</p>
                        <p><strong>Total Capacity:</strong> {stockAdjustItem.total_capacity} {stockAdjustItem.unit}</p>
                        <div>
                            <label className="block text-sm font-medium mb-1">Action</label>
                            <select value={stockAdjustType} onChange={(e) => setStockAdjustType(e.target.value)} className="w-full rounded-lg border border-medical-border px-3 py-2">
                                <option value="add">Add (Increase Stock)</option>
                                <option value="remove">Remove (Decrease Stock)</option>
                            </select>
                        </div>
                        <FormInput label="Quantity" type="number" value={stockAdjustQty} onChange={(e) => setStockAdjustQty(parseInt(e.target.value) || 0)} />
                        <button onClick={confirmStockAdjust} className="w-full rounded-lg bg-primary-600 py-2 text-white">Confirm Adjustment</button>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default Inventory;