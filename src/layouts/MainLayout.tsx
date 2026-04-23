import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ProgressBar } from 'primereact/progressbar';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { semesterService, type Semester } from '../services/semesterService';
import { authService } from '../services/authService';

const SemesterMarquee = () => {
    const [semester, setSemester] = useState<Semester | null>(null);

    useEffect(() => {
        semesterService.getCurrentSemester()
            .then(res => setSemester(res))
            .catch(() => {});
    }, []);

    if (!semester || !semester.midtermLockDate || semester.status !== 'Open') return null;

    const lockDateObj = new Date(semester.midtermLockDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lockDateOnly = new Date(lockDateObj);
    lockDateOnly.setHours(0, 0, 0, 0);
    
    const diffTime = lockDateOnly.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 3) return null;

    const isPast = diffDays < 0;
    const userInfo = authService.getUser();

    // Nếu quá hạn thì chỉ HOD mới được thấy
    if (isPast && userInfo?.roleName !== 'HOD') return null;

    const formattedDate = lockDateObj.toLocaleDateString('vi-VN');

    const message = isPast 
        ? (<>Học kỳ <span className="font-extrabold text-yellow-200 mx-1">{semester.semesterCode}</span> đã quá hạn chốt lịch (<span className="font-bold border-b border-yellow-200 mx-1">{formattedDate}</span>). Quản lý vui lòng khóa hệ thống để tiến hành Review Giữa Kỳ!</>)
        : (<>Học kỳ <span className="font-extrabold text-yellow-200 mx-1">{semester.semesterCode}</span> sẽ chốt danh sách vào ngày <span className="font-bold border-b border-yellow-200 mx-1">{formattedDate}</span>. Vui lòng hoàn tất cập nhật dữ liệu!</>);

    return (
        <div className={`relative flex items-center overflow-hidden py-2 shadow-sm border-b ${isPast ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 border-red-700' : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 border-orange-600'} text-white`}>
            {/* Fade effect left */}
            <div className={`absolute left-0 top-0 bottom-0 w-8 sm:w-16 z-10 bg-gradient-to-r ${isPast ? 'from-red-600' : 'from-orange-500'} to-transparent`}></div>
            
            {/* Sliding Content */}
            <div className="animate-marquee whitespace-nowrap text-[13px] sm:text-sm tracking-wide font-medium">
                <span className="inline-flex items-center justify-center mx-8">
                    <span className="material-symbols-outlined text-[18px] mr-2 text-yellow-200 animate-pulse">
                        {isPast ? 'warning' : 'campaign'}
                    </span>
                    {message}
                </span>
            </div>

            {/* Fade effect right */}
            <div className={`absolute right-0 top-0 bottom-0 w-8 sm:w-16 z-10 bg-gradient-to-l ${isPast ? 'from-red-600' : 'from-orange-500'} to-transparent`}></div>
        </div>
    );
};

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
            <SemesterMarquee />
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


