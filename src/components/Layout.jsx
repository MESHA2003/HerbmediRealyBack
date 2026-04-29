import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-medical-bg flex flex-col">
            <Sidebar sidebarOpen={sidebarOpen} />
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`pt-20 transition-all duration-300 ${sidebarOpen ? 'md:pl-64' : 'md:pl-20'} px-4 md:px-6 pb-8 flex-1`}
                >
                    {children}
                </motion.main>
            </AnimatePresence>

            {/* Footer with clinic information */}
            <footer className={`transition-all duration-300 ${sidebarOpen ? 'md:pl-64' : 'md:pl-20'} bg-white border-t border-medical-border py-3 px-6 text-center text-sm text-medical-muted`}>
                <p>🌿 <strong>Shekilindi Herbal Clinic & Research</strong> – Owner: Shaaban Shekilindi</p>
                <p>P.O.Box 1249 Dodoma | Phone: 0713184406</p>
            </footer>
        </div>
    );
};

export default Layout;