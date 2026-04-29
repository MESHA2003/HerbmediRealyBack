import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

const Table = ({ columns, data, itemsPerPage = 5, searchPlaceholder = "Search by ticket, patient, phone..." }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Handle both array and paginated API response
    const dataArray = Array.isArray(data) ? data : (data?.results || []);

    // Filter data based on search term (includes ticket_number)
    const filteredData = dataArray.filter(row => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return Object.values(row).some(value => {
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(searchLower);
        });
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(start, start + itemsPerPage);

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-medical-muted" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full rounded-lg border border-medical-border py-2 pl-10 pr-4 text-sm focus:border-primary-400 focus:outline-none"
                    />
                </div>
                {searchTerm && (
                    <div className="text-xs text-medical-muted bg-gray-100 px-2 py-1 rounded-full">
                        <Ticket size={12} className="inline mr-1" />
                        {filteredData.length} result(s) found
                    </div>
                )}
            </div>
            <div className="overflow-x-auto rounded-xl border border-medical-border bg-white">
                <table className="min-w-full divide-y divide-medical-border">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-medical-muted">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-medical-border bg-white">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-medical-muted">
                                    No data found. Try a different search.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, idx) => (
                                <motion.tr
                                    key={idx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="hover:bg-gray-50 transition"
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className="whitespace-nowrap px-6 py-4 text-sm text-medical-text">
                                            {typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 rounded-md border border-medical-border px-3 py-1 text-sm disabled:opacity-50"
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-sm text-medical-muted">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 rounded-md border border-medical-border px-3 py-1 text-sm disabled:opacity-50"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Table;