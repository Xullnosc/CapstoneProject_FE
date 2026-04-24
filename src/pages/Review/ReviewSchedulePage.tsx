import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
// import { Tag } from 'primereact/tag';
import { reviewService } from '../../services/reviewService';
import { semesterService } from '../../services/semesterService';
import { authService } from '../../services/authService';
import { teamService } from '../../services/teamService';
import Swal from '../../utils/swal';
import ReviewBreadcrumb from '../../components/Review/ReviewBreadcrumb';
import type { Semester } from '../../services/semesterService';
import type { ReviewCouncil, ReviewPeriod, ReviewSchedule } from '../../services/reviewService';

interface ScheduleForm {
    round: number;
    date: Date | null;
    startTime: Date | null;
    endTime: Date | null;
    meetLink: string;
}

const ReviewSchedulePage = () => {
    const user = authService.getUser();
    const [semester, setSemester] = useState<Semester | null>(null);
    const [periods, setPeriods] = useState<ReviewPeriod[]>([]);
    const [myCouncils, setMyCouncils] = useState<ReviewCouncil[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedCouncil, setSelectedCouncil] = useState<ReviewCouncil | null>(null);
    const [schedules, setSchedules] = useState<ReviewSchedule[]>([]);
    const [submissions, setSubmissions] = useState<Record<number, any[]>>({});
    const [showEditModal, setShowEditModal] = useState(false);
    
    const [form, setForm] = useState<ScheduleForm>({
        round: 1,
        date: null,
        startTime: null,
        endTime: null,
        meetLink: ''
    });

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const current = await semesterService.getCurrentSemester();
            if (current) {
                setSemester(current);
                const [allPeriods, allCouncils] = await Promise.all([
                    reviewService.getPeriods(current.semesterId),
                    reviewService.getCouncils(current.semesterId)
                ]);
                setPeriods(allPeriods);
                
                if (user?.roleName === 'Lecturer' || user?.roleName === 'HOD' || user?.roleName === 'Head of Department') {
                    const filtered = (allCouncils as ReviewCouncil[]).filter((c) => 
                        c.members.some((m) => m.lecturerId === user.userId)
                    );
                    setMyCouncils(filtered);
                } else if (user?.roleName === 'Student') {
                    const filtered = (allCouncils as ReviewCouncil[]).filter((c) => 
                        c.teams.some((t) => t.team?.teamId) // Simplified for type safety check
                    );
                    setMyCouncils(filtered);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const selectCouncil = async (council: ReviewCouncil) => {
        setSelectedCouncil(council);
        const [list, sub1, sub2, sub3] = await Promise.all([
            reviewService.getSchedules(council.councilId),
            reviewService.getSubmissions(council.councilId, 1, 0), // 0 for all teams in council if lecturer, or specific teamId
            reviewService.getSubmissions(council.councilId, 2, 0),
            reviewService.getSubmissions(council.councilId, 3, 0)
        ]);
        setSchedules(list);
        setSubmissions({ 1: sub1, 2: sub2, 3: sub3 });
    };

    const handleFileUpload = async (round: number, file: File | undefined) => {
        if (!file || !selectedCouncil) return;
        try {
            // Get student's own team
            const myTeam = await teamService.getMyTeam();
            if (!myTeam) {
                Swal.fire('Error', 'No team found for your account.', 'error');
                return;
            }

            await reviewService.uploadSubmission({
                councilId: selectedCouncil.councilId,
                teamId: myTeam.teamId,
                round,
                file
            });
            Swal.fire('Uploaded', 'File submitted successfully.', 'success');
            selectCouncil(selectedCouncil);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            Swal.fire('Error', err.response?.data?.message || 'Failed to upload', 'error');
        }
    };

    const openEditSchedule = (round: number) => {
        const existing = schedules.find(s => s.reviewRound === round);
        const period = periods.find(p => p.reviewRound === round);
        
        if (!period) {
            Swal.fire('Locked', 'HOD has not set the timeframe for this round.', 'warning');
            return;
        }

        setForm({
            round,
            date: existing ? new Date(existing.scheduledDate) : null,
            startTime: existing ? new Date(`1970-01-01T${existing.startTime}`) : null,
            endTime: existing ? new Date(`1970-01-01T${existing.endTime}`) : null,
            meetLink: existing ? existing.meetLink : ''
        });
        setShowEditModal(true);
    };

    const handleSaveSchedule = async () => {
        if (!form.date || !form.startTime || !form.endTime) {
            Swal.fire('Error', 'Fill all temporal fields.', 'error');
            return;
        }

        try {
            await reviewService.updateSchedule({
                councilId: selectedCouncil!.councilId,
                reviewRound: form.round,
                scheduledDate: form.date.toISOString(),
                startTime: form.startTime.toTimeString().split(' ')[0],
                endTime: form.endTime.toTimeString().split(' ')[0],
                meetLink: form.meetLink,
                setByLecturerId: user?.userId || 0
            });
            setShowEditModal(false);
            selectCouncil(selectedCouncil!);
            Swal.fire('Success', 'Schedule updated.', 'success');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            Swal.fire('Error', err.response?.data?.message || 'Failed to update schedule', 'error');
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-gray-100 border-t-green-500 animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <ReviewBreadcrumb
                items={[
                    { label: 'Home', path: '/home' },
                    { label: 'Mid-term Review', path: '/review' },
                    { label: 'Council Schedules' }
                ]}
                title="Council Schedules"
                subtitle="Coordinate session appointments for review assessments."
                semesterCode={semester?.semesterCode}
            />

            <main className="mx-auto max-w-[1200px] px-6 mt-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Menu */}
                    <div className="lg:col-span-4 flex flex-col gap-3">
                        <h2 className="px-2 text-[9px] font-black uppercase tracking-widest text-gray-400">My Councils</h2>
                        {myCouncils.map(c => (
                            <div 
                                key={c.councilId} 
                                onClick={() => selectCouncil(c)}
                                className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedCouncil?.councilId === c.councilId ? 'bg-white border-green-500 shadow-md' : 'bg-white border-gray-50'}`}
                            >
                                <h3 className="text-sm font-bold text-gray-800 leading-tight">{c.councilName}</h3>
                                <div className="mt-2 flex gap-1.5">
                                    <span className="bg-gray-50 px-2 py-0.5 text-[8px] font-bold uppercase text-gray-400 rounded-md">{c.teams?.length || 0} teams</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right View */}
                    <div className="lg:col-span-8">
                        {!selectedCouncil ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-gray-100 bg-white opacity-50">
                                <i className="pi pi-clock text-3xl text-gray-200 mb-2"></i>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select to View Schedule</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {[1, 2, 3].map(round => {
                                    const sched = schedules.find(s => s.reviewRound === round);
                                    const period = periods.find(p => p.reviewRound === round);
                                    
                                    return (
                                        <div key={round} className="rounded-[24px] bg-white p-6 shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                                                <div>
                                                    <h4 className="text-base font-bold text-gray-900 tracking-tight">Round {round}: {round === 1 ? 'Primary' : round === 2 ? 'Audit' : 'Defense'}</h4>
                                                    <p className="text-[9px] text-gray-400 mt-0.5">Window: {period ? `${new Date(period.startDate).toLocaleDateString()} — ${new Date(period.endDate).toLocaleDateString()}` : 'Not set'}</p>
                                                </div>
                                                {user?.roleName !== 'Student' && (
                                                    <Button icon="pi pi-calendar-plus" label="Set Slot" className="p-button-text p-button-sm text-[10px] font-bold text-green-600" onClick={() => openEditSchedule(round)} />
                                                )}
                                            </div>

                                            {!sched ? (
                                                <p className="text-center p-4 text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">Wait for scheduling</p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-50">
                                                        <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><i className="pi pi-calendar text-sm"></i></div>
                                                        <div>
                                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Date</p>
                                                            <p className="text-sm font-bold text-gray-800">{new Date(sched.scheduledDate).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-50">
                                                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><i className="pi pi-clock text-sm"></i></div>
                                                        <div>
                                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Time</p>
                                                            <p className="text-sm font-bold text-gray-800">{sched.startTime.substring(0, 5)} - {sched.endTime.substring(0, 5)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-600 text-white shadow-md">
                                                        <div className="w-9 h-9 rounded-lg bg-white/20 text-white flex items-center justify-center"><i className="pi pi-video text-sm"></i></div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Entry</p>
                                                            <a href={sched.meetLink} target="_blank" rel="noreferrer" className="text-xs font-bold truncate block hover:underline">Join Meeting</a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Student Submission Section */}
                                            {user?.roleName === 'Student' && sched && (
                                                <div className="mt-6 pt-6 border-t border-gray-50">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Submission Assets</h5>
                                                        <input 
                                                            type="file" 
                                                            id={`file-upload-${round}`} 
                                                            className="hidden" 
                                                            onChange={(e) => handleFileUpload(round, e.target.files?.[0])}
                                                        />
                                                        <Button 
                                                            icon="pi pi-upload" 
                                                            label="Upload Files" 
                                                            className="p-button-text p-button-sm text-[10px] font-bold text-blue-600"
                                                            onClick={() => document.getElementById(`file-upload-${round}`)?.click()}
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-3">
                                                        {submissions[round]?.length > 0 ? submissions[round].map(s => (
                                                            <a key={s.submissionId} href={s.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all">
                                                                <i className="pi pi-file text-xs"></i>
                                                                <span className="text-[10px] font-bold">{s.fileName}</span>
                                                            </a>
                                                        )) : (
                                                            <div className="w-full py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                                                                <p className="text-[9px] text-gray-400 font-medium italic">No files submitted for this stage yet.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Dialog header={`Schedule Round ${form.round}`} visible={showEditModal} style={{ width: '400px' }} onHide={() => setShowEditModal(false)} className="rounded-[20px] p-fluid">
                <div className="space-y-4 pt-2">
                    <div className="field">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Date</label>
                        <Calendar value={form.date} onChange={(e) => setForm({ ...form, date: e.value as Date })} showIcon className="rounded-xl p-inputtext-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="field">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Start</label>
                            <Calendar value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.value as Date })} timeOnly className="rounded-xl p-inputtext-sm" />
                        </div>
                        <div className="field">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">End</label>
                            <Calendar value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.value as Date })} timeOnly className="rounded-xl p-inputtext-sm" />
                        </div>
                    </div>
                    <div className="field">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">URL Endpoint</label>
                        <InputText value={form.meetLink} onChange={(e) => setForm({ ...form, meetLink: e.target.value })} placeholder="Meeting URL" className="rounded-xl py-3 text-sm" />
                    </div>
                    <Button label="Save Changes" className="p-button-success rounded-xl py-3 font-bold text-xs uppercase" onClick={handleSaveSchedule} />
                </div>
            </Dialog>
        </div>
    );
};

export default ReviewSchedulePage;
