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
        let isMounted = true;

        // Start loading after the current render cycle to avoid cascading renders warning
        const startTimeout = setTimeout(() => {
            if (isMounted) {
                setLoading(true);
                setProgress(0);
            }
        }, 0);

        // Duration configuration
        const minTime = 1200; // 1.2s minimum visibility
        const timerStart = Date.now();

        const interval = setInterval(() => {
            if (!isMounted) return;
            setProgress((prev) => {
                if (prev >= 98) return 98;
                const remaining = 100 - prev;
                const increment = Math.max(0.2, remaining * 0.1); 
                return Math.min(prev + increment, 98);
            });
        }, 80);

        // Ensure it doesn't disappear too fast
        const finishTimeout = setTimeout(() => {
            const elapsed = Date.now() - timerStart;
            const remaining = Math.max(0, minTime - elapsed);
            
            setTimeout(() => {
                if (isMounted) {
                    setProgress(100);
                    setTimeout(() => {
                        if (isMounted) setLoading(false);
                    }, 400); 
                }
            }, remaining);
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(startTimeout);
            clearInterval(interval);
            clearTimeout(finishTimeout);
        };
    }, [location]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <div className="sticky top-0 z-[100] w-full">
                <Header />
                {/* Horizontal Loading Bar - Positioned right below the header without layout shift */}
                <div className="h-0 relative w-full overflow-visible">
                    <div className="absolute top-0 left-0 w-full h-[4px] z-[120] pointer-events-none overflow-hidden">
                        {loading && (
                            <ProgressBar 
                                value={progress} 
                                showValue={false} 
                                style={{ height: '4px' }} 
                                className="w-full rounded-none bg-transparent border-none animate-fade-in" 
                                color="#f97316" 
                            />
                        )}
                    </div>
                </div>
            </div>
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;


