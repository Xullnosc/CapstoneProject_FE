import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { authService } from '../../services/authService';
import { semesterService, type Semester } from '../../services/semesterService';
import ReviewBreadcrumb from '../../components/Review/ReviewBreadcrumb';

const ReviewDashboardPage = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const [semester, setSemester] = useState<Semester | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTip, setShowTip] = useState(true);
    
    const isHOD = user?.roleName === 'HOD' || user?.roleName === 'Head of Department';
    const isLecturer = user?.roleName === 'Lecturer';
    const isStudent = user?.roleName === 'Student';

    useEffect(() => {
        loadSemester();
        const hidden = localStorage.getItem('hide_midterm_tip');
        if (hidden) setShowTip(false);
    }, []);

    const loadSemester = async () => {
        try {
            const current = await semesterService.getCurrentSemester();
            setSemester(current);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const dismissTip = () => {
        setShowTip(false);
        localStorage.setItem('hide_midterm_tip', 'true');
    };

    const isLocked = semester?.status === 'In Progress' || semester?.status === 'Review Middle Semester' || semester?.status === 'Review Thesis' || semester?.status === 'Closed';
    const canAccess = isLocked;

    interface ActionCardProps {
        title: string;
        description: string;
        icon: string;
        path: string;
        color: string;
        disabled: boolean;
    }

    const ActionCard = ({ title, description, icon, path, color, disabled }: ActionCardProps) => (
        <div 
            className={`group relative overflow-hidden rounded-[24px] p-0.5 transition-all duration-300 ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}`}
            onClick={() => !disabled && navigate(path)}
        >
            <div className={`h-full w-full rounded-[22px] bg-white p-6 shadow-sm border border-gray-100 transition-all duration-300 ${!disabled && 'hover:shadow-md hover:border-transparent'}`}>
                <div className="relative z-10">
                    <div 
                        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
                        style={{ backgroundColor: `${color}10`, color: color }}
                    >
                        <i className={`pi ${icon} text-lg`}></i>
                    </div>
                    
                    <h3 className="mb-1 text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
                    <p className="text-[11px] leading-relaxed text-gray-500">{description}</p>
                    
                    {!disabled && (
                        <div className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider opacity-0 transform translate-x-[-5px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" style={{ color }}>
                            <span>Access</span>
                            <i className="pi pi-arrow-right text-[8px]"></i>
                        </div>
                    )}

                    {disabled && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-2 py-1 text-[9px] font-bold text-red-500 uppercase tracking-tighter">
                            <i className="pi pi-lock text-[8px]"></i>
                            <span>Semester Locked Required</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-gray-100 border-t-orange-500 animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <ReviewBreadcrumb
                items={[
                    { label: 'Home', path: '/home' },
                    { label: 'Mid-term Review' }
                ]}
                title="Mid-term Review Portal"
                subtitle="Evaluation cycles, council assignments, and scheduled progress tracking."
                semesterCode={semester?.semesterCode}
            />

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white border-b border-gray-100 pb-12">
                <div className="relative mx-auto max-w-[1200px] px-6 text-center">

                    {!canAccess && (
                        <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <div className="mx-auto max-w-xl rounded-[32px] bg-white p-6 shadow-sm border border-red-50">
                                <div className="mb-4 flex flex-col items-center">
                                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                        <i className="pi pi-lock text-xl font-black"></i>
                                    </div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Access Restricted</h2>
                                </div>
                                <p className="mb-6 text-xs text-gray-500 leading-relaxed">
                                    The review workflow can only be accessed once the semester has been officially <strong>LOCKED</strong>.
                                </p>
                                {isHOD && (
                                    <Button 
                                        label="Lock Semester Now" 
                                        className="p-button-danger p-button-sm rounded-xl px-6 py-2.5 font-bold"
                                        onClick={() => navigate('/semesters')}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <main className="mx-auto -mt-6 max-w-[1200px] px-6 pb-12">
                {showTip && (
                    <div className="mb-10 mx-auto max-w-3xl relative overflow-hidden rounded-[24px] bg-orange-500 p-6 text-white shadow-lg shadow-gray-200 animate-in fade-in zoom-in duration-500">
                        <button 
                            onClick={dismissTip}
                            className="absolute top-4 right-4 h-7 w-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/5"
                        >
                            <i className="pi pi-times text-[9px]"></i>
                        </button>
                        
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                                <i className="pi pi-lightbulb text-xl font-bold"></i>
                            </div>
                            <div>
                                <h4 className="mb-1 text-[11px] font-black uppercase tracking-widest">Department Guidelines</h4>
                                <p className="text-white/80 text-[11px] leading-relaxed max-w-2xl">
                                    Configure review periods before establishing councils. Finalize all team data before the lock date for accurate assessment logic.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {isHOD && (
                        <>
                            <ActionCard 
                                title="Review Periods" 
                                description="Define global assessment windows." 
                                icon="pi-calendar-times" 
                                path="/review/periods" 
                                color="#f59e0b" 
                                disabled={!canAccess}
                            />
                            <ActionCard 
                                title="Council Pool" 
                                description="Reviewer-to-team assignments." 
                                icon="pi-users" 
                                path="/review/councils" 
                                color="#3b82f6" 
                                disabled={!canAccess}
                            />
                            <ActionCard 
                                title="Override" 
                                description="Manual status intervention." 
                                icon="pi-shield" 
                                path="/review/override" 
                                color="#ef4444" 
                                disabled={!canAccess}
                            />
                        </>
                    )}

                    {(isHOD || isLecturer) && (
                        <>
                            <ActionCard 
                                title="Schedules" 
                                description="Coordinate session meeting slots." 
                                icon="pi-clock" 
                                path="/review/schedules" 
                                color="#10b981" 
                                disabled={!canAccess}
                            />
                            <ActionCard 
                                title="Assessment" 
                                description="Submit checklists and results." 
                                icon="pi-check-square" 
                                path="/review/assessment" 
                                color="#8b5cf6" 
                                disabled={!canAccess}
                            />
                        </>
                    )}

                    {(isStudent || isLecturer) && (
                        <>
                            <ActionCard 
                                title="Team Schedule" 
                                description="View session appointments and join Meet." 
                                icon="pi-info-circle" 
                                path="/review/my-schedule" 
                                color="#f97316" 
                                disabled={!canAccess}
                            />
                            <ActionCard 
                                title="Review Feedback" 
                                description="Track progress, comments, and outcomes." 
                                icon="pi-file-pdf" 
                                path="/review/results" 
                                color="#6366f1" 
                                disabled={!canAccess}
                            />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ReviewDashboardPage;
