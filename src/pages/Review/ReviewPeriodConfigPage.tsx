import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { semesterService, type Semester } from '../../services/semesterService';
import { reviewService } from '../../services/reviewService';
import Swal from '../../utils/swal';
import ReviewBreadcrumb from '../../components/Review/ReviewBreadcrumb';

const ReviewPeriodConfigPage = () => {
    const [semester, setSemester] = useState<Semester | null>(null);
    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSyncTip, setShowSyncTip] = useState(true);

    const [roundDates, setRoundDates] = useState<any>({
        1: { startDate: null, endDate: null },
        2: { startDate: null, endDate: null },
        3: { startDate: null, endDate: null }
    });

    useEffect(() => {
        loadData();
        const hidden = localStorage.getItem('hide_sync_tip');
        if (hidden) setShowSyncTip(false);
    }, []);

    const dismissSyncTip = () => {
        setShowSyncTip(false);
        localStorage.setItem('hide_sync_tip', 'true');
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const current = await semesterService.getCurrentSemester();
            if (current) {
                setSemester(current);
                const existing = await reviewService.getPeriods(current.semesterId);
                setPeriods(existing);
                
                const newDates = { ...roundDates };
                existing.forEach((p: any) => {
                    newDates[p.reviewRound] = {
                        startDate: p.startDate ? new Date(p.startDate) : null,
                        endDate: p.endDate ? new Date(p.endDate) : null
                    };
                });
                setRoundDates(newDates);
            }
        } catch (error) {
            console.error("Failed to load review periods", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (round: number) => {
        if (!semester) return;
        const rd = roundDates[round];
        if (!rd.startDate || !rd.endDate) {
            Swal.fire('Incomplete Range', 'Please specify both start and end dates.', 'warning');
            return;
        }

        try {
            await reviewService.updatePeriod({
                semesterId: semester.semesterId,
                reviewRound: round,
                startDate: rd.startDate.toISOString(),
                endDate: rd.endDate.toISOString()
            });
            Swal.fire({
                title: 'Synchronized',
                text: `Review window for Round ${round} set.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            loadData();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to update period', 'error');
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-gray-100 border-t-orange-500 animate-spin"></div>
        </div>
    );

    if (!semester) return (
        <div className="flex flex-col items-center justify-center p-12 bg-white m-10 rounded-[24px] border border-gray-100 shadow-sm">
            <i className="pi pi-exclamation-triangle text-2xl text-orange-400 mb-2 font-black"></i>
            <h3 className="text-lg font-bold text-gray-900">Semester Missing</h3>
            <p className="text-xs text-gray-400">No active semester detected.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <ReviewBreadcrumb
                items={[
                    { label: 'Home', path: '/home' },
                    { label: 'Mid-term Review', path: '/review' },
                    { label: 'Review Timelines' }
                ]}
                title="Review Timelines"
                subtitle="Set assessment windows for each review round."
                semesterCode={semester?.semesterCode}
            />

            <main className="mx-auto max-w-[1200px] px-6 pb-12 flex flex-col gap-8">
                <div className="rounded-[24px] bg-white p-8 shadow-sm border border-gray-100">
                    <div className="space-y-10">
                        {[1, 2, 3].map(round => (
                            <div key={round} className="group relative">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 font-bold text-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                                            {round}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 tracking-tight">Stage {round}: {round === 1 ? 'Quality Check' : round === 2 ? 'Progress Audit' : 'Final Defense'}</h3>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{round === 3 ? 'Numerical grade (0-10)' : 'Binary checklist only'}.</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-all duration-300">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Start</label>
                                            <Calendar 
                                                value={roundDates[round].startDate} 
                                                onChange={(e) => setRoundDates({ ...roundDates, [round]: { ...roundDates[round], startDate: e.value } })}
                                                showIcon
                                                className="p-inputtext-sm w-36"
                                                dateFormat="dd/mm/yy"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1 text-center font-bold text-gray-300 pt-4 px-1">
                                            <i className="pi pi-arrow-right text-[10px]"></i>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">End</label>
                                            <Calendar 
                                                value={roundDates[round].endDate} 
                                                onChange={(e) => setRoundDates({ ...roundDates, [round]: { ...roundDates[round], endDate: e.value } })}
                                                showIcon
                                                className="p-inputtext-sm w-36"
                                                dateFormat="dd/mm/yy"
                                            />
                                        </div>
                                        <div className="flex items-end self-end">
                                            <Button 
                                                label="Set Stage" 
                                                className="p-button-orange p-button-sm rounded-xl px-4 py-2 font-bold text-[10px] uppercase tracking-widest"
                                                onClick={() => handleSave(round)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {showSyncTip && (
                    <div className="mt-8 mx-auto max-w-2xl p-5 bg-orange-500 rounded-[20px] text-white shadow-lg shadow-gray-200 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <button 
                            onClick={dismissSyncTip}
                            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                        >
                            <i className="pi pi-times text-[9px]"></i>
                        </button>
                        
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                                <i className="pi pi-sync text-lg"></i>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[10px] font-black tracking-widest uppercase">Why synchronize?</h4>
                                <p className="text-white/80 text-[10px] leading-relaxed">
                                    Standardized timelines ensure all students receive feedback within the same quality window. Mandatory for automated grade calculation.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReviewPeriodConfigPage;
