import { type FC, type ReactNode, useState, useEffect } from 'react';
import type { Whitelist } from '../../services/semesterService';
import { whitelistService } from '../../services/whitelistService';
import Swal from '../../utils/swal';
import MemberAvatar from '../team/MemberAvatar';
import { Paginator, type PaginatorPageChangeEvent } from 'primereact/paginator';

interface SemesterWhitelistsTableProps {
    whitelists?: Whitelist[];
    isLoading?: boolean;
    headerAction?: ReactNode;
    onUpdate?: () => void;
    onEdit?: (user: Whitelist) => void;
    canEdit?: (user: Whitelist) => boolean;
    onDelete?: (user: Whitelist) => Promise<void> | void;
    showStudentCode?: boolean;
    showSemester?: boolean;
    isEnded?: boolean;
    // Server-side pagination props
    totalCount?: number;
    page?: number; // 0-indexed for PrimeReact
    onPageChange?: (page: number) => void;
    rowsPerPage?: number;
}

const SemesterWhitelistsTable: FC<SemesterWhitelistsTableProps> = ({
    whitelists = [],
    isLoading = false,
    headerAction,
    onUpdate,
    onEdit,
    canEdit,
    onDelete,
    showStudentCode = false,
    showSemester = false,
    isEnded = false,
    totalCount,
    page = 0,
    onPageChange,
    rowsPerPage = 10
}) => {
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    // For client-side pagination (if totalCount/onPageChange not provided)
    const isServerSide = totalCount !== undefined && onPageChange !== undefined;
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(rowsPerPage);

    useEffect(() => {
        if (isServerSide) {
            setFirst(page * rowsPerPage);
        }
    }, [page, rowsPerPage, isServerSide]);

    const onLocalPageChange = (event: PaginatorPageChangeEvent) => {
        if (isServerSide) {
            onPageChange!(event.page);
        } else {
            setFirst(event.first);
            setRows(event.rows);
        }
    };

    const displayWhitelists = isServerSide
        ? whitelists
        : whitelists.slice(first, first + rows);

    const handleToggleReviewer = async (user: Whitelist) => {
        try {
            setUpdatingId(user.whitelistId);
            const newStatus = !user.isReviewer;
            await whitelistService.updateReviewerStatus(user.whitelistId, newStatus);

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Reviewer status ${newStatus ? 'assigned' : 'removed'} successfully`,
                timer: 1500,
                showConfirmButton: false
            });

            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to update reviewer status', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteStudent = async (user: Whitelist) => {
        if (onDelete) {
            await onDelete(user);
            return;
        }

        const result = await Swal.fire({
            title: 'Remove Student?',
            text: "This student will be removed from this semester's whitelist.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f26e21',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, remove them!'
        });

        if (result.isConfirmed) {
            try {
                await whitelistService.deleteWhitelist(user.whitelistId);
                Swal.fire('Removed!', 'Student has been removed from whitelist.', 'success');
                if (onUpdate) onUpdate();
            } catch {
                Swal.fire('Error', 'Failed to remove student', 'error');
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 px-6 py-5 bg-white z-10 relative">
                <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1">
                    <button className="px-4 py-1.5 rounded-lg bg-white text-gray-900 text-sm font-bold shadow-sm transition-all border border-gray-200/50">
                        Whitelisted Users <span className="ml-1 text-xs text-orange-600 bg-orange-600/10 px-1.5 py-0.5 rounded-md">
                            {(isServerSide ? totalCount : whitelists.length) ?? 0}
                        </span>
                    </button>
                </div>

                {headerAction && (
                    <div className="w-full sm:w-auto flex justify-end">
                        {headerAction}
                    </div>
                )}
            </div>

            <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[80px] w-20 text-center">Ava</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Info</th>
                            {showStudentCode && (
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
                            )}
                            {showSemester && (
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Semester</th>
                            )}
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Campus</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-full"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                    {showStudentCode && <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>}
                                    {showSemester && <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>}
                                    <td className="px-6 py-4"></td>
                                    <td className="px-4 py-4"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            ))
                        ) : displayWhitelists.length === 0 ? (
                            <tr>
                                <td colSpan={6 + (showStudentCode ? 1 : 0) + (showSemester ? 1 : 0)} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                                        <span className="material-symbols-outlined text-4xl opacity-50">person_off</span>
                                        <span className="text-sm font-medium">No whitelisted users found</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayWhitelists.map((user) => (
                                <tr key={user.whitelistId || user.email} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 min-w-[80px] w-20">
                                        <div className="flex items-center justify-center">
                                            <MemberAvatar
                                                email={user.email}
                                                fullName={user.fullName || user.email}
                                                avatarUrl={user.avatar}
                                                className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] max-w-[2.5rem] max-h-[2.5rem] rounded-full object-cover shadow-sm ring-1 ring-gray-100 flex-shrink-0 aspect-square"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-900 font-medium">{user.email}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-900 font-semibold">{user.fullName || 'N/A'}</span>
                                        </div>
                                    </td>
                                    {showStudentCode && (
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono italic flex items-center gap-1 w-fit">
                                                <span className="material-symbols-outlined text-[12px]">badge</span>
                                                {user.studentCode || '-'}
                                            </span>
                                        </td>
                                    )}
                                    {showSemester && (
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-200 font-mono w-fit tracking-wide">
                                                    {user.semesterCode || '-'}
                                                </span>
                                                {user.semesterName && (
                                                    <span className="text-xs text-gray-600 font-medium">{user.semesterName}</span>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600 font-medium">{user.campus || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${user.roleName?.toLowerCase() === 'student' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                user.roleName?.toLowerCase() === 'lecturer' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    'bg-gray-50 text-gray-700 border-gray-100'
                                                }`}>
                                                {user.roleName || 'Unknown'}
                                            </span>
                                            {user.isReviewer && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-orange-50 text-orange-700 border-orange-100 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">rate_review</span>
                                                    Reviewer
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {!isEnded && (
                                                user.roleName === 'Lecturer' ? (
                                                    <button
                                                        onClick={() => handleToggleReviewer(user)}
                                                        disabled={updatingId === user.whitelistId}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${user.isReviewer
                                                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-orange-600 hover:border-orange-200'
                                                            }`}
                                                    >
                                                        {updatingId === user.whitelistId ? (
                                                            <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1"></span>
                                                        ) : (
                                                            <span className="material-symbols-outlined text-[16px]">
                                                                {user.isReviewer ? 'remove_moderator' : 'add_moderator'}
                                                            </span>
                                                        )}
                                                        {user.isReviewer ? 'Unassign' : 'Assign Reviewer'}
                                                    </button>
                                                ) : user.roleName === 'Student' ? (
                                                    <div className={`flex items-center gap-1 transition-opacity ${onEdit && (canEdit ? canEdit(user) : true) ? 'opacity-100' : 'opacity-100 sm:opacity-0 group-hover:opacity-100'}`}>
                                                        {onEdit && (canEdit ? canEdit(user) : true) && (
                                                            <button
                                                                onClick={() => onEdit(user)}
                                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                                                title="Edit Student"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteStudent(user)}
                                                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                                            title="Delete Student"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                ) : null
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {(isServerSide ? (totalCount || 0) : whitelists.length) > rowsPerPage && (
                <div className="border-t border-gray-100 py-2 bg-gray-50/30">
                    <Paginator
                        first={first}
                        rows={rows}
                        totalRecords={isServerSide ? totalCount : whitelists.length}
                        onPageChange={onLocalPageChange}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                        currentPageReportTemplate="{first} - {last} of {totalRecords}"
                        className="bg-transparent border-none text-xs"
                    />
                </div>
            )}
        </div>
    );
};

export default SemesterWhitelistsTable;
