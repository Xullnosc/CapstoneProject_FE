import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InputSwitch } from 'primereact/inputswitch';
import { Paginator, type PaginatorPageChangeEvent } from 'primereact/paginator';
import { Dropdown } from 'primereact/dropdown';
import { lecturerService, type Lecturer } from '../../services/lecturerService';
import MemberAvatar from '../../components/team/MemberAvatar';
import LecturerModal from './LecturerModal';
import { authService } from '../../services/authService';
import Swal from '../../utils/swal';
import PremiumBreadcrumb from '../../components/Common/PremiumBreadcrumb';

const LecturerManagementPage = () => {
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [selectedCampus, setSelectedCampus] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);
    const navigate = useNavigate();
    const currentUser = authService.getUser();
    const isAdmin = currentUser?.roleName === 'Admin';

    const campuses = [
        { label: 'All Campuses', value: null },
        { label: 'FU-Hòa Lạc', value: 1 },
        { label: 'FU-Đà Nẵng', value: 2 },
        { label: 'FU-Hồ Chí Minh', value: 3 },
        { label: 'FU-Cần Thơ', value: 4 },
        { label: 'FU-Quy Nhơn', value: 5 },
    ];

    const fetchLecturers = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await lecturerService.getAllLecturers(page + 1, rows, searchTerm, selectedCampus ?? undefined);

            setLecturers(data.items || []);
            setTotalCount(data.totalCount ?? 0);
        } catch (error) {
            console.error('Failed to fetch lecturers', error);
            Swal.fire('Error', 'Failed to load lecturers pool', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [page, rows, searchTerm, selectedCampus]);

    useEffect(() => {
        fetchLecturers();
    }, [fetchLecturers]);

    const handleToggleStatus = async (lecturer: Lecturer) => {
        try {
            const newStatus = !lecturer.isActive;
            await lecturerService.toggleStatus(lecturer.lecturerId, newStatus);
            setLecturers(prev => prev.map(l =>
                l.lecturerId === lecturer.lecturerId ? { ...l, isActive: newStatus } : l
            ));

            Swal.fire({
                icon: 'success',
                title: 'Status Updated',
                text: `${lecturer.fullName || lecturer.email} is now ${newStatus ? 'Active' : 'Inactive'}`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to update lecturer status', 'error');
        }
    };

    const handleToggleReviewer = async (lecturer: Lecturer) => {
        try {
            const newStatus = !lecturer.isReviewer;
            await lecturerService.toggleReviewerStatus(lecturer.lecturerId, newStatus);
            setLecturers(prev => prev.map(l =>
                l.lecturerId === lecturer.lecturerId ? { ...l, isReviewer: newStatus } : l
            ));

            Swal.fire({
                icon: 'success',
                title: 'Reviewer Set',
                text: `${lecturer.fullName || lecturer.email} is now ${newStatus ? 'a Reviewer' : 'not a Reviewer'}`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to update reviewer status', 'error');
        }
    };

    const handleToggleHod = async (lecturer: Lecturer) => {
        const newStatus = !lecturer.isHod;
        
        // Confirmation for promoting
        if (newStatus) {
            const confirm = await Swal.fire({
                title: 'Assign HOD Role?',
                text: `Are you sure you want to promote ${lecturer.fullName || lecturer.email} to HOD of this campus?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Promote',
                confirmButtonColor: '#f26e21'
            });
            if (!confirm.isConfirmed) return;
        }

        try {
            await lecturerService.toggleHod(lecturer.lecturerId, newStatus);
            setLecturers(prev => prev.map(l =>
                l.lecturerId === lecturer.lecturerId ? { ...l, isHod: newStatus } : l
            ));

            Swal.fire({
                icon: 'success',
                title: 'HOD Status Updated',
                text: `${lecturer.fullName || lecturer.email} is now ${newStatus ? 'HOD' : 'a Lecturer'}`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update HOD status';
            Swal.fire('Conflict', message, 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will remove the lecturer from the pool and all active semester whitelists.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f26e21',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await lecturerService.deleteLecturer(id);
                setLecturers(prev => prev.filter(l => l.lecturerId !== id));
                Swal.fire('Deleted!', 'Lecturer has been removed.', 'success');
            } catch {
                Swal.fire('Error', 'Failed to delete lecturer', 'error');
            }
        }
    };

    // Removed client-side filteredLecturers as we now use server-side pagination/search
    const displayLecturers = lecturers;
    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="bg-white border-b border-gray-200 mb-8">
                <div className="max-w-[1200px] mx-auto w-full px-6 py-5">
                    {/* Breadcrumb */}
                    <div className="mb-4">
                        <PremiumBreadcrumb items={[
                            { label: 'Dashboard', to: '/semesters' },
                            { label: 'Lecturer Pool' }
                        ]} />
                    </div>

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-gray-900 text-2xl font-black tracking-tight">Lecturer Pool</h1>
                            <p className="text-gray-500 text-sm font-medium">Manage the global pool of lecturers available for all semesters</p>
                        </div>

                        <button
                            onClick={() => { setSelectedLecturer(null); setIsModalOpen(true); }}
                            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl text-sm font-black hover:bg-orange-600 shadow-xl shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-xl">person_add</span>
                            Add New Lecturer
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1200px] mx-auto w-full px-6 pb-12 flex flex-col gap-10">

                {/* Search & Stats Carrier */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="relative w-full md:w-96">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                            />
                        </div>

                        {isAdmin && (
                            <div className="w-full md:w-64">
                                <Dropdown
                                    value={selectedCampus}
                                    onChange={(e) => { setSelectedCampus(e.value); setPage(0); }}
                                    options={campuses}
                                    placeholder="Filter by Campus"
                                    className="w-full rounded-2xl border-gray-100 bg-gray-50 text-sm"
                                />
                            </div>
                        )}

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:flex-none px-8 py-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-center">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5" title="Total in current search/pool">Total Found</p>
                            <p className="text-xl font-black text-blue-600">{totalCount}</p>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden border-separate">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">Lecturer</th>
                                    <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                                    <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest text-center">Campus</th>
                                    {isAdmin && <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest text-center">HOD</th>}
                                    <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest text-center">Active</th>
                                    <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest text-center">Reviewer</th>
                                    <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-5"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-100 rounded-2xl"></div><div className="h-4 bg-gray-100 rounded w-32"></div></div></td>
                                            <td className="px-8 py-5"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                                            <td className="px-8 py-5"><div className="h-4 bg-gray-100 rounded w-16 mx-auto"></div></td>
                                            {isAdmin && <td className="px-8 py-5"><div className="h-8 bg-gray-100 rounded-xl w-24 mx-auto"></div></td>}
                                            <td className="px-8 py-5"><div className="h-4 bg-gray-100 rounded w-16 mx-auto"></div></td>
                                        </tr>
                                    ))
                                ) : displayLecturers.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdmin ? 7 : 6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <span className="material-symbols-outlined text-6xl">person_search</span>
                                                <p className="text-lg font-bold">No lecturers found matching your criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayLecturers.map((l) => (
                                        <tr key={l.lecturerId} className="hover:bg-orange-50/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div 
                                                    className={`flex items-center gap-4 ${l.userId ? 'cursor-pointer group/lecturer' : ''}`}
                                                    onClick={() => l.userId && navigate(`/profile/${l.userId}`)}
                                                >
                                                    <div className="relative">
                                                        <MemberAvatar
                                                            email={l.email}
                                                            fullName={l.fullName || l.email}
                                                            avatarUrl={l.avatar || undefined}
                                                            className={`w-12 h-12 min-w-[3rem] min-h-[3rem] max-w-[3rem] max-h-[3rem] rounded-full object-cover shadow-sm ring-2 ring-white ring-offset-2 ring-offset-gray-50 flex-shrink-0 aspect-square transition-all duration-300 ${l.userId ? 'group-hover/lecturer:ring-orange-200 group-hover/lecturer:scale-105' : ''}`}
                                                        />
                                                        {l.userId && (
                                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover/lecturer:opacity-100 transition-opacity">
                                                                <span className="material-symbols-outlined text-[12px] text-orange-600 font-bold">visibility</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        {l.userId ? (
                                                            <button
                                                                className="text-base font-black text-gray-900 group-hover/lecturer:text-orange-600 transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
                                                            >
                                                                {l.fullName || 'Unnamed Lecturer'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-base font-black text-gray-900">{l.fullName || 'Unnamed Lecturer'}</span>
                                                        )}
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover/lecturer:text-gray-500 transition-colors">Lecturer ID: #{l.lecturerId}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div 
                                                    className={`flex items-center gap-2 group/email shadow-xs px-3 py-1.5 rounded-lg border border-transparent transition-all w-fit ${l.userId ? 'cursor-pointer hover:border-orange-100 hover:bg-orange-50/30' : ''}`}
                                                    onClick={() => l.userId && navigate(`/profile/${l.userId}`)}
                                                >
                                                    <span className={`material-symbols-outlined text-lg transition-colors ${l.userId ? 'text-gray-300 group-hover/email:text-orange-400' : 'text-gray-300'}`}>mail</span>
                                                    <div className="flex flex-col">
                                                        {l.userId ? (
                                                            <button
                                                                className="text-sm font-medium text-gray-600 group-hover/email:text-orange-600 transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
                                                            >
                                                                {l.email}
                                                            </button>
                                                        ) : (
                                                            <span className="text-sm font-medium text-gray-600">{l.email}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-black uppercase tracking-wide">{l.campus || 'Global'}</span>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-8 py-5 text-center">
                                                    <div className="flex justify-center">
                                                        <InputSwitch
                                                            checked={l.isHod}
                                                            onChange={() => handleToggleHod(l)}
                                                            disabled={!isAdmin}
                                                            className={l.isHod ? 'orange-switch shadow-[0_0_12px_rgba(249,115,22,0.3)]' : ''}
                                                            tooltip={!isAdmin ? "Only Admin can promote/demote HOD" : ""}
                                                        />
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-8 py-5 text-center">
                                                {!l.isHod && (
                                                    <div className="flex justify-center">
                                                        <InputSwitch
                                                            checked={l.isActive}
                                                            onChange={() => handleToggleStatus(l)}
                                                            className={l.isActive ? 'orange-switch' : ''}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                {!l.isHod && (
                                                    <div className="flex justify-center">
                                                        <InputSwitch
                                                            checked={l.isReviewer}
                                                            onChange={() => handleToggleReviewer(l)}
                                                            className={l.isReviewer ? 'blue-switch' : ''}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!l.isHod && (
                                                        <>
                                                            <button
                                                                onClick={() => { setSelectedLecturer(l); setIsModalOpen(true); }}
                                                                className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                                                title="Edit Details"
                                                            >
                                                                <span className="material-symbols-outlined text-xl">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(l.lecturerId)}
                                                                className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                                                title="Delete Lecturer"
                                                            >
                                                                <span className="material-symbols-outlined text-xl">delete</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalCount > rows && (
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-2">
                            <Paginator
                                first={page * rows}
                                rows={rows}
                                totalRecords={totalCount}
                                onPageChange={(e: PaginatorPageChangeEvent) => {
                                    setPage(e.page ?? 0);
                                    setRows(e.rows);
                                }}
                                template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                                currentPageReportTemplate="{first} - {last} of {totalRecords}"
                                className="bg-transparent border-none"
                            />
                        </div>
                    </div>
                )}
            </main>

            <LecturerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { setIsModalOpen(false); fetchLecturers(); }}
                lecturerData={selectedLecturer}
            />
        </div>
    );
};

export default LecturerManagementPage;
