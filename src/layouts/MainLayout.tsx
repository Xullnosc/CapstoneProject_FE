import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ProgressBar } from 'primereact/progressbar';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

const MainLayout = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setLoading(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setLoading(false), 800);
                    return 100;
                }
                return prev + 20; // Increment
            });
        }, 100); // Speed of updates

        return () => clearInterval(interval);
    }, [location]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <div className="sticky top-0 z-[100] flex flex-col">
                <Header />
                {loading && <ProgressBar value={progress} showValue={false} style={{ height: '4px' }} className="w-full rounded-none bg-orange-100" color="#f97316" />}
            </div>
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;


