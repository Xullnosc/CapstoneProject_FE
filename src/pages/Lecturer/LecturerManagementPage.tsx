import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { lecturerService, type Lecturer } from '../../services/lecturerService';
import MemberAvatar from '../../components/team/MemberAvatar';
import LecturerModal from './LecturerModal';
import Swal from '../../utils/swal';

const LecturerManagementPage = () => {
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);
    const [campusFilter, setCampusFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchLecturers();
    }, []);

    const fetchLecturers = async () => {
        try {
            setIsLoading(true);
            const data = await lecturerService.getAllLecturers();
            setLecturers(data);
        } catch (error) {
            console.error("Failed to fetch lecturers", error);
            Swal.fire('Error', 'Failed to load lecturers pool', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const campusOptions = [
        { label: 'All Campuses', value: null },
        { label: 'FU-Hòa Lạc', value: 'FU-Hòa Lạc' },
        { label: 'FU-Hồ Chí Minh', value: 'FU-Hồ Chí Minh' },
        { label: 'FU-Đà Nẵng', value: 'FU-Đà Nẵng' },
        { label: 'FU-Cần Thơ', value: 'FU-Cần Thơ' },
        { label: 'FU-Quy Nhơn', value: 'FU-Quy Nhơn' }
    ];

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

    const filteredLecturers = lecturers.filter(l => {
        const matchesSearch = l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.fullName?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCampus = !campusFilter || l.campus === campusFilter;
        return matchesSearch && matchesCampus;
    });

    return (
        <div className="min-h-screen bg-gray-50/50">
            <main className="max-w-[1200px] mx-auto w-full px-6 py-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-8">
                    <Link className="text-gray-500 text-sm font-medium hover:text-orange-600 transition-colors" to="/semesters">Dashboard</Link>
                    <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                    <span className="text-gray-900 text-sm font-semibold">Lecturer Pool</span>
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-gray-900 text-3xl font-black tracking-tight">Lecturer Pool</h1>
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

                {/* Search & Stats Carrier */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto flex-1">
                        <div className="relative w-full md:w-80">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                            />
                        </div>

                        <div className="w-full md:w-60">
                            <Dropdown
                                value={campusFilter}
                                onChange={(e) => setCampusFilter(e.value)}
                                options={campusOptions}
                                optionLabel="label"
                                placeholder="All Campuses"
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                                pt={{
                                    root: { style: { padding: '4px 8px' } },
                                    input: { className: 'text-sm font-medium py-2' },
                                    item: { className: 'text-sm' }
                                }}
                                showClear={!!campusFilter}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:flex-none px-6 py-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-center">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Total Pool</p>
                            <p className="text-xl font-black text-blue-600">{lecturers.length}</p>
                        </div>
                        <div className="flex-1 md:flex-none px-6 py-3 bg-green-50/50 rounded-2xl border border-green-100/50 text-center">
                            <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-0.5">Active</p>
                            <p className="text-xl font-black text-green-600">{lecturers.filter(l => l.isActive).length}</p>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden border-separate">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Lecturer</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Campus</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Active</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-5"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-100 rounded-2xl"></div><div className="h-4 bg-gray-100 rounded w-32"></div></div></td>
                                            <td className="px-8 py-5"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                                            <td className="px-8 py-5"><div className="h-4 bg-gray-100 rounded w-16 mx-auto"></div></td>
                                            <td className="px-8 py-5"><div className="h-8 bg-gray-100 rounded-xl w-24 mx-auto"></div></td>
                                            <td className="px-8 py-5"></td>
                                        </tr>
                                    ))
                                ) : filteredLecturers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <span className="material-symbols-outlined text-6xl">person_search</span>
                                                <p className="font-bold">No lecturers found matching your criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLecturers.map((l) => (
                                        <tr key={l.lecturerId} className="hover:bg-orange-50/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <MemberAvatar
                                                        email={l.email}
                                                        fullName={l.fullName || l.email}
                                                        avatarUrl={l.avatar || undefined}
                                                        className="w-12 h-12 min-w-[3rem] min-h-[3rem] max-w-[3rem] max-h-[3rem] rounded-full object-cover shadow-sm ring-2 ring-white ring-offset-2 ring-offset-gray-50 flex-shrink-0 aspect-square"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900">{l.fullName || 'Unnamed Lecturer'}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lecturer ID: #{l.lecturerId}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 group/email cursor-pointer">
                                                    <span className="material-symbols-outlined text-gray-300 text-lg">mail</span>
                                                    <span className="text-sm font-medium text-gray-600 group-hover/email:text-orange-600 transition-colors">{l.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-black uppercase">{l.campus || 'Global'}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex justify-center">
                                                    <InputSwitch
                                                        checked={l.isActive}
                                                        onChange={() => handleToggleStatus(l)}
                                                        className={l.isActive ? 'orange-switch' : ''}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

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
