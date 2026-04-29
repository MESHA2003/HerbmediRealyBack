import { motion } from 'framer-motion';

const FormInput = ({ label, type = 'text', placeholder, value, onChange, required = false }) => {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-medical-text">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <motion.input
                whileFocus={{ scale: 1.01 }}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full rounded-lg border border-medical-border px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
            />
        </div>
    );
};

export default FormInput;