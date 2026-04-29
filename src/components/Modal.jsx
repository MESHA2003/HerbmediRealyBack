import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />
                    {/* Modal - perfectly centered */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
                        >
                            {/* Sticky header */}
                            <div className="flex items-center justify-between border-b border-medical-border px-6 py-4 sticky top-0 bg-white rounded-t-2xl z-10">
                                <h2 className="text-xl font-semibold text-medical-text">{title}</h2>
                                <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 transition">
                                    <X size={20} />
                                </button>
                            </div>
                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;