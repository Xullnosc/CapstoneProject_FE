import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { semesterService, type Semester } from '../../services/semesterService';
import { reviewService } from '../../services/reviewService';
import { lecturerService } from '../../services/lecturerService';
import { teamService } from '../../services/teamService';
import { authService } from '../../services/authService';
import Swal from '../../utils/swal';
import ReviewBreadcrumb from '../../components/Review/ReviewBreadcrumb';
import type { ReviewCouncil } from '../../services/reviewService';
import type { Lecturer } from '../../services/lecturerService';
import type { Team } from '../../types/team';

// ─── Helper: normalize council so councilId is always present ───
const normalizeCouncil = (c: any): ReviewCouncil => ({
    ...c,
    councilId: c.councilId ?? c.id,
} as ReviewCouncil);

const ReviewCouncilManagementPage = () => {
    const [semester, setSemester] = useState<Semester | null>(null);
    const [councils, setCouncils] = useState<ReviewCouncil[]>([]);
    const [selectedCouncil, setSelectedCouncil] = useState<ReviewCouncil | null>(null);
    const [loading, setLoading] = useState(true);

    // Create modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCouncilName, setNewCouncilName] = useState('');

    // Auto-generate modal
    const [showAutoModal, setShowAutoModal] = useState(false);
    const [autoParams, setAutoParams] = useState({ reviewersPerCouncil: 2 });
    const [autoLoading, setAutoLoading] = useState(false);

    // Pickers
    const [lecturerPool, setLecturerPool] = useState<Lecturer[]>([]);
    const [teamPool, setTeamPool] = useState<Team[]>([]);
    const [showLecturerPicker, setShowLecturerPicker] = useState(false);
    const [showTeamPicker, setShowTeamPicker] = useState(false);

    useEffect(() => { 
        loadInitial(); 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadInitial = async () => {
        try {
            setLoading(true);
            const current = await semesterService.getCurrentSemester();
            if (current) {
                setSemester(current);
                const list = await reviewService.getCouncils(current.semesterId);
                const normalized = (Array.isArray(list) ? list : list?.items || [])
                    .map(normalizeCouncil)
                    .sort((a: ReviewCouncil, b: ReviewCouncil) => (a.councilName || '').localeCompare(b.councilName || ''));
                setCouncils(normalized);

                // Sync selected council if it exists
                if (selectedCouncil) {
                    const latest = normalized.find((c: any) => c.councilId === selectedCouncil.councilId);
                    setSelectedCouncil(latest || null);
                }
            }
        } catch (error: unknown) {
            console.error('Failed to load councils', error);
        } finally {
            setLoading(false);
        }
    };

    // ─── Refresh selected council from server ────────────────────────────────
    const refreshSelected = async (councilId: number) => {
        try {
            const updated = await reviewService.getCouncilById(councilId);
            const norm = normalizeCouncil(updated);
            setSelectedCouncil(norm);
            // Also update in the list
            setCouncils(prev => prev.map(c => c.councilId === councilId ? norm : c));
        } catch { /* ignore */ }
    };

    // ─── Create ──────────────────────────────────────────────────────────────
    const handleCreateCouncil = async () => {
        if (!newCouncilName.trim() || !semester) return;
        try {
            const user = authService.getUser();
            await reviewService.createCouncil({
                semesterId: semester.semesterId,
                councilName: newCouncilName.trim(),
                createdBy: user?.userId || 0
            });
            setShowAddModal(false);
            setNewCouncilName('');
            await loadInitial();
            Swal.fire({ title: 'Created!', text: 'Council created successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            Swal.fire('Error', err.response?.data?.message || 'Failed to create council', 'error');
        }
    };

    // ─── Auto-Generate ───────────────────────────────────────────────────────
    const handleAutoGenerate = async () => {
        if (!semester) return;
        const result = await Swal.fire({
            title: 'Auto-Generate Councils?',
            html: `This will create councils and distribute all teams automatically.<br/>You can still adjust manually after.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Generate',
            confirmButtonColor: '#f97316',
        });
        if (!result.isConfirmed) return;

        try {
            setAutoLoading(true);
            const res = await reviewService.autoGenerateCouncils(
                semester.semesterId,
                autoParams.reviewersPerCouncil
            );
            setShowAutoModal(false);
            await loadInitial();
            Swal.fire('Done!', (res as any).message || `Councils generated successfully.`, 'success');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            Swal.fire('Error', err.response?.data?.message || 'Auto-generate failed', 'error');
        } finally {
            setAutoLoading(false);
        }
    };

    // ─── Delete ──────────────────────────────────────────────────────────────
    const handleDeleteCouncil = async (id: number) => {
        const result = await Swal.fire({
            title: 'Delete this council?',
            text: 'All member and team assignments will be removed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#ef4444',
        });
        if (!result.isConfirmed) return;
        try {
            await reviewService.deleteCouncil(id);
            setSelectedCouncil(null);
            await loadInitial();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            Swal.fire('Error', err.response?.data?.message || 'Failed to delete', 'error');
        }
    };

    // ─── Member: add/remove ──────────────────────────────────────────────────
    const openLecturerPicker = async () => {
        try {
            const res = await lecturerService.getAllLecturers();
            const all = Array.isArray(res) ? res : (res?.items || []);
            
            // Collect ALL lecturer IDs already assigned to ANY council in this semester
            const assignedIds = new Set<number>();
            if (Array.isArray(councils)) {
                councils.forEach(c => {
                    c.members?.forEach((m: any) => {
                        if (m && m.lecturerId) assignedIds.add(m.lecturerId);
                    });
                });
            }

            // Only show lecturers who are NOT assigned yet
            const filtered = all.filter((l: Lecturer) => l && l.lecturerId && !assignedIds.has(l.lecturerId));
            setLecturerPool(filtered);
            setShowLecturerPicker(true);
        } catch (error: unknown) {
            console.error('Failed to open lecturer picker', error);
        }
    };

    const addLecturer = async (lecturerId: number) => {
        if (!selectedCouncil?.councilId) return;
        try {
            await reviewService.addMemberToCouncil(selectedCouncil.councilId, lecturerId, 'Midterm Reviewer');
            setShowLecturerPicker(false);
            await refreshSelected(selectedCouncil!.councilId);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            Swal.fire('Conflict', err.response?.data?.message || 'Failed to add member', 'error');
        }
    };

    const removeMember = async (lecturerId: number) => {
        if (!selectedCouncil?.councilId) return;
        try {
            await reviewService.removeMemberFromCouncil(selectedCouncil.councilId, lecturerId);
            await refreshSelected(selectedCouncil!.councilId);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            Swal.fire('Error', err.response?.data?.message || 'Failed to remove member', 'error');
        }
    };

    // ─── Team: add/remove ────────────────────────────────────────────────────
    const openTeamPicker = async () => {
        try {
            if (!semester) return;
            const res: any = await teamService.getTeamsBySemester(semester.semesterId);
            const all = Array.isArray(res) ? res : (res?.items || []);
            // Filter out teams already in this council
            const assigned = new Set((selectedCouncil?.teams || []).map((t) => t.teamId));
            setTeamPool(all.filter((t: Team) => !assigned.has(t.teamId)));
            setShowTeamPicker(true);
        } catch (error: unknown) {
            console.error(error);
        }
    };

    const addTeam = async (teamId: number) => {
        if (!selectedCouncil?.councilId) return;
        try {
            await reviewService.addTeamToCouncil(selectedCouncil.councilId, teamId);
            setShowTeamPicker(false);
            await refreshSelected(selectedCouncil!.councilId);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            Swal.fire('Conflict', err.response?.data?.message || 'Failed to add team', 'error');
        }
    };

    const removeTeam = async (teamId: number) => {
        if (!selectedCouncil?.councilId) return;
        try {
            await reviewService.removeTeamFromCouncil(selectedCouncil.councilId, teamId);
            await refreshSelected(selectedCouncil!.councilId);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            Swal.fire('Error', err.response?.data?.message || 'Failed to remove team', 'error');
        }
    };

    // ─── Loading ─────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <div className="h-9 w-9 rounded-full border-2 border-gray-200 border-t-orange-500 animate-spin"></div>
                <p className="text-sm text-gray-400 font-medium">Loading councils...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Breadcrumb Header ── */}
            <ReviewBreadcrumb
                items={[
                    { label: 'Home', path: '/home' },
                    { label: 'Mid-term Review', path: '/review' },
                    { label: 'Council Manager' }
                ]}
                title="Council Manager"
                subtitle="Assign reviewers and project teams to review councils."
                semesterCode={semester?.semesterCode}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAutoModal(true)}
                            className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-100 active:scale-95 transition-all duration-150"
                        >
                            <i className="pi pi-bolt text-xs"></i>
                            Auto-Generate
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 active:scale-95 transition-all duration-150"
                        >
                            <i className="pi pi-plus text-xs"></i>
                            New Council
                        </button>
                    </div>
                }
            />

            {/* ── Main Content ── */}
            <main className="mx-auto max-w-[1200px] px-6 pb-12">
                <div className="grid grid-cols-12 gap-6">

                    {/* ── Council List Sidebar ── */}
                    <div className="col-span-4">
                        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Active Pool</h2>
                                <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-orange-100 px-1.5 text-[10px] font-bold text-orange-600">
                                    {councils.length}
                                </span>
                            </div>
                            <div className="p-3 space-y-1.5 min-h-[460px]">
                                {councils.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                            <i className="pi pi-users text-xl text-gray-300"></i>
                                        </div>
                                        <p className="text-sm font-medium text-gray-400">No councils yet</p>
                                        <p className="mt-1 text-xs text-gray-300">Click "New Council" or "Auto-Generate"</p>
                                    </div>
                                ) : councils.map(c => {
                                    const isActive = !!selectedCouncil && selectedCouncil.councilId === c.councilId;
                                    return (
                                        <div
                                            key={c.councilId}
                                            onClick={() => setSelectedCouncil(c)}
                                            className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 outline-none select-none ${
                                                isActive
                                                    ? 'bg-orange-500 shadow-md shadow-orange-200 border-orange-500'
                                                    : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                                            }`}
                                        >
                                            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                                                isActive ? 'bg-white/20' : 'bg-gray-100'
                                            }`}>
                                                <i className={`pi pi-building text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate leading-tight ${
                                                    isActive ? 'text-white' : 'text-gray-700'
                                                }`}>
                                                    {c.councilName}
                                                </p>
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <span className={`text-xs ${isActive ? 'text-orange-100' : 'text-gray-400'}`}>
                                                        {c.members?.length || 0} members
                                                    </span>
                                                    <span className={`${isActive ? 'text-orange-300' : 'text-gray-200'}`}>·</span>
                                                    <span className={`text-xs ${isActive ? 'text-orange-100' : 'text-gray-400'}`}>
                                                        {c.teams?.length || 0} teams
                                                    </span>
                                                </div>
                                            </div>
                                            {isActive
                                                ? <i className="pi pi-check-circle text-white/80 text-sm flex-shrink-0"></i>
                                                : <i className="pi pi-angle-right text-gray-300 text-sm flex-shrink-0"></i>
                                            }
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Council Detail ── */}
                    <div className="col-span-8">
                        {!selectedCouncil ? (
                            <div className="flex h-full min-h-[480px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 mb-4">
                                    <i className="pi pi-arrow-left text-2xl text-gray-200"></i>
                                </div>
                                <p className="text-base font-semibold text-gray-400">Select a council</p>
                                <p className="mt-1 text-sm text-gray-300">Choose from the list to view details</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* ── Council Banner ── */}
                                <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-md">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Review Council</p>
                                            <h2 className="text-xl font-bold text-white">{selectedCouncil.councilName}</h2>
                                            <div className="mt-3 flex items-center gap-3">
                                                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                                                    selectedCouncil.status === 'Active'
                                                        ? 'bg-green-400/10 text-green-400 ring-green-400/20'
                                                        : 'bg-orange-400/10 text-orange-400 ring-orange-400/20'
                                                }`}>
                                                    {selectedCouncil.status}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {selectedCouncil.members?.length || 0} members · {selectedCouncil.teams?.length || 0} teams
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCouncil(selectedCouncil.councilId)}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                        >
                                            <i className="pi pi-trash text-sm"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* ── Members & Teams Grid ── */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Reviewers */}
                                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <i className="pi pi-user text-sm text-orange-500"></i>
                                                <h3 className="text-sm font-semibold text-gray-800">Reviewers</h3>
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-50 text-[10px] font-bold text-orange-600">
                                                    {selectedCouncil.members?.length || 0}
                                                </span>
                                            </div>
                                            <button
                                                onClick={openLecturerPicker}
                                                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
                                            >
                                                <i className="pi pi-plus text-[10px]"></i> Add
                                            </button>
                                        </div>
                                        <div className="divide-y divide-gray-50 min-h-[200px]">
                                            {(!selectedCouncil.members || selectedCouncil.members.length === 0) ? (
                                                <div className="flex flex-col items-center justify-center py-10">
                                                    <i className="pi pi-user-plus text-2xl text-gray-200 mb-2"></i>
                                                        <p className="text-xs text-gray-300 font-medium">No reviewers yet</p>
                                                </div>
                                            ) : selectedCouncil.members.map((m) => {
                                                // DTO has flat: lecturerName, lecturerEmail, role
                                                const name = m.fullName || 'Unknown';
                                                const initials = (name || '?').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(-2).toUpperCase();
                                                return (
                                                    <div key={m.lecturerId} className="group flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex-shrink-0">
                                                                {initials || 'L'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800">{name}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded uppercase font-bold">
                                                                        {m.role === 'Chairman' ? 'CHAIR' : 'REV'}
                                                                    </span>
                                                                    <p className="text-xs text-gray-400">{m.email || 'No Email'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeMember(m.lecturerId)}
                                                            className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                                        >
                                                            <i className="pi pi-times text-xs"></i>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Teams */}
                                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <i className="pi pi-briefcase text-sm text-orange-500"></i>
                                                <h3 className="text-sm font-semibold text-gray-800">Projects</h3>
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-50 text-[10px] font-bold text-orange-600">
                                                    {selectedCouncil.teams?.length || 0}
                                                </span>
                                            </div>
                                            <button
                                                onClick={openTeamPicker}
                                                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
                                            >
                                                <i className="pi pi-plus text-[10px]"></i> Add
                                            </button>
                                        </div>
                                        <div className="divide-y divide-gray-50 min-h-[200px]">
                                            {(!selectedCouncil.teams || selectedCouncil.teams.length === 0) ? (
                                                <div className="flex flex-col items-center justify-center py-10">
                                                    <i className="pi pi-folder-open text-2xl text-gray-200 mb-2"></i>
                                                    <p className="text-xs text-gray-300 font-medium">No teams assigned</p>
                                                </div>
                                            ) : selectedCouncil.teams.map((t) => {
                                                // DTO has flat: teamCode, teamName, mentorName
                                                const code = t.team?.teamCode || 'N/A';
                                                const mentor = t.team?.mentorName || '—';
                                                return (
                                                    <div key={t.teamId} className="group flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold flex-shrink-0">
                                                                GRP
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800">{code}</p>
                                                                <p className="text-xs text-gray-400">Mentor: {(mentor || '—').trim().split(' ').pop() || '—'}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeTeam(t.teamId)}
                                                            className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                                        >
                                                            <i className="pi pi-times text-xs"></i>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            {/* ── Create Council Dialog ── */}
            <Dialog
                header={<span className="text-base font-bold text-gray-800">Create New Council</span>}
                visible={showAddModal}
                style={{ width: '420px' }}
                onHide={() => { setShowAddModal(false); setNewCouncilName(''); }}
                className="rounded-xl"
            >
                <div className="pt-2 space-y-5">
                    <div>
                        <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Council Name</label>
                        <InputText
                            value={newCouncilName}
                            onChange={e => setNewCouncilName(e.target.value)}
                            placeholder="e.g. Council A — Spring Review"
                            className="w-full rounded-lg border-gray-300 text-sm py-2.5"
                            onKeyDown={e => e.key === 'Enter' && handleCreateCouncil()}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={() => { setShowAddModal(false); setNewCouncilName(''); }}
                            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateCouncil}
                            disabled={!newCouncilName.trim()}
                            className="flex-1 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                        >
                            Create Council
                        </button>
                    </div>
                </div>
            </Dialog>

            {/* ── Auto-Generate Dialog ── */}
            <Dialog
                header={
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                            <i className="pi pi-bolt text-orange-500 text-sm"></i>
                        </div>
                        <span className="text-base font-bold text-gray-800">Auto-Generate Councils</span>
                    </div>
                }
                visible={showAutoModal}
                style={{ width: '480px' }}
                onHide={() => setShowAutoModal(false)}
            >
                <div className="pt-3 space-y-6">
                    <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
                        <p className="text-xs text-orange-700 leading-relaxed">
                            <i className="pi pi-info-circle mr-1.5"></i>
                            System will automatically create councils, distribute teams evenly, and assign reviewers — avoiding mentor-team conflicts.
                        </p>
                    </div>

                    {/* Single input: Reviewers per Council */}
                    <div className="max-w-[200px]">
                        <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Reviewers per Council
                        </label>
                        <input
                            type="number"
                            min={1} max={10}
                            value={autoParams.reviewersPerCouncil}
                            onChange={e => setAutoParams(p => ({ ...p, reviewersPerCouncil: parseInt(e.target.value) || 2 }))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 focus:border-orange-400 focus:ring-1 focus:ring-orange-300 outline-none"
                        />
                        <p className="mt-1 text-[11px] text-gray-400">Assigned per council (round-robin, no mentor conflict)</p>
                    </div>

                    {/* Preview */}
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</p>
                        <p className="text-sm text-gray-700">
                            Teams distributed <span className="font-bold text-orange-600">evenly</span> across councils
                            for semester <span className="font-bold">{semester?.semesterCode}</span>,
                            each council gets <span className="font-bold text-orange-600">{autoParams.reviewersPerCouncil}</span> reviewer(s).
                            Lecturers who mentor a team will <span className="font-bold">not</span> be assigned to that team's council.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAutoModal(false)}
                            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAutoGenerate}
                            disabled={autoLoading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 active:scale-95 transition-all"
                        >
                            {autoLoading
                                ? <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> Generating...</>
                                : <><i className="pi pi-bolt"></i> Generate Now</>
                            }
                        </button>
                    </div>
                </div>
            </Dialog>

            {/* ── Lecturer Picker Dialog ── */}
            <Dialog
                header={<span className="text-base font-bold text-gray-800">Add Midterm Reviewer</span>}
                visible={showLecturerPicker}
                style={{ width: '560px' }}
                onHide={() => setShowLecturerPicker(false)}
            >
                <DataTable
                    value={lecturerPool}
                    paginator
                    rows={6}
                    sortMode="single"
                    className="p-datatable-sm mt-2"
                    emptyMessage="No reviewers available."
                    rowHover
                >
                    <Column field="fullName" header="Name" sortable style={{ fontSize: '13px', fontWeight: 500 }} />
                    <Column field="email" header="Email" sortable style={{ fontSize: '12px', color: '#6b7280' }} />
                    <Column
                        header=""
                        body={(row: Lecturer) => (
                            <button
                                onClick={() => addLecturer(row.lecturerId!)}
                                className="flex items-center gap-1.5 rounded-md bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-colors"
                            >
                                <i className="pi pi-plus text-[10px]"></i> Select
                            </button>
                        )}
                        style={{ width: '100px', textAlign: 'right' }}
                    />
                </DataTable>
            </Dialog>

            {/* ── Team Picker Dialog ── */}
            <Dialog
                header={<span className="text-base font-bold text-gray-800">Assign Project Team</span>}
                visible={showTeamPicker}
                style={{ width: '560px' }}
                onHide={() => setShowTeamPicker(false)}
            >
                <DataTable
                    value={teamPool}
                    paginator
                    rows={6}
                    sortMode="single"
                    className="p-datatable-sm mt-2"
                    emptyMessage="No teams available."
                    rowHover
                >
                    <Column field="teamCode" header="Team Code" sortable style={{ fontSize: '13px', fontWeight: 500 }} />
                    <Column
                        header="Thesis"
                        body={(row) => <span style={{ fontSize: '12px', color: '#6b7280' }}>{row.thesisTitle || row.thesis?.title || '—'}</span>}
                    />
                    <Column
                        header="Mentor"
                        body={(row) => <span style={{ fontSize: '12px', color: '#6b7280' }}>{row.mentor?.fullName || row.mentorName || '—'}</span>}
                    />
                    <Column
                        header=""
                        body={(row: Team) => (
                            <button
                                onClick={() => addTeam(row.teamId!)}
                                className="flex items-center gap-1.5 rounded-md bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-colors"
                            >
                                <i className="pi pi-plus text-[10px]"></i> Assign
                            </button>
                        )}
                        style={{ width: '100px', textAlign: 'right' }}
                    />
                </DataTable>
            </Dialog>
            </main>
        </div>
    );
};

export default ReviewCouncilManagementPage;
