import { type FC, type ReactNode } from 'react';
import type { Whitelist } from '../../services/semesterService';

interface SemesterWhitelistsTableProps {
    whitelists?: Whitelist[];
    isLoading?: boolean;
    headerAction?: ReactNode;
}

const SemesterWhitelistsTable: FC<SemesterWhitelistsTableProps> = ({ whitelists = [], isLoading = false, headerAction }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 bg-white z-10 relative">
                {/* Toolbar buttons */}
                <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1">
                    <button className="px-4 py-1.5 rounded-lg bg-white text-gray-900 text-sm font-bold shadow-sm transition-all border border-gray-200/50">
                        Whitelisted Users <span className="ml-1 text-xs text-blue-600 bg-blue-600/10 px-1.5 py-0.5 rounded-md">{whitelists.length}</span>
                    </button>
                    {/* Future filters if needed */}
                </div>

                {/* Custom Action (e.g. Reviewer List) */}
                {headerAction && (
                    <div>
                        {headerAction}
                    </div>
                )}
            </div>

            <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            // Skeleton Loading State
                            Array.from({ length: 3 }).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                    <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                                </tr>
                            ))
                        ) : whitelists.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                                        <span className="material-symbols-outlined text-4xl opacity-50">person_off</span>
                                        <span className="text-sm font-medium">No whitelisted users found</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            whitelists.map((user) => (
                                <tr key={user.whitelistId} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-900 font-medium">{user.email}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-500">{user.fullName || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${user.roleName === 'Student' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            user.roleName === 'Lecturer' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                'bg-gray-50 text-gray-700 border-gray-100'
                                            }`}>
                                            {user.roleName || 'Unknown'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SemesterWhitelistsTable;
