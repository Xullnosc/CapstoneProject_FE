import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSeasonGradient } from '../../utils/semesterHelpers';
import { SEMESTER_STATUS_COLORS } from '../../constants/semesterConstants';
import { semesterService } from '../../services/semesterService';
import Swal from 'sweetalert2';

interface SemesterCardProps {
    semester: {
        id: number;
        code: string;
        name: string;
        startDate: string;
        endDate: string;
        status: 'Ongoing' | 'Upcoming' | 'Ended';
        isArchived: boolean;
        totalTeams: number;
        totalWhitelists: number;
        season: string;
        seasonColor: string; // e.g., 'orange', 'green', 'yellow'
    };
    onRefresh?: () => void;
}

const SemesterCard: FC<SemesterCardProps> = ({ semester, onRefresh }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const statusColors = SEMESTER_STATUS_COLORS[semester.status] || SEMESTER_STATUS_COLORS.Ended;

    const handleStartSemester = async () => {
        const result = await Swal.fire({
            title: `Start <span class="text-orange-600">${semester.name}</span>?`,
            html: "This will start the new semester and <b class='text-red-500'>automatically END</b> any current ongoing semester.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f97316', // orange-500 (Brand Color)
            cancelButtonColor: '#6b7280', // gray-500 (Neutral)
            confirmButtonText: 'Yes, Start Semester',
            cancelButtonText: 'Cancel',
            focusCancel: true,
            customClass: {
                popup: 'rounded-2xl',
                confirmButton: 'rounded-xl px-4 py-2 font-bold',
                cancelButton: 'rounded-xl px-4 py-2 font-bold'
            }
        });

        if (!result.isConfirmed) return;

        try {
            setIsLoading(true);
            await semesterService.startSemester(semester.id);

            await Swal.fire({
                title: 'Started!',
                text: 'The semester has been started successfully.',
                icon: 'success',
                confirmButtonColor: '#f97316' // orange-500
            });

            if (onRefresh) {
                onRefresh();
            }
        } catch (error: unknown) {
            console.error('Failed to start semester:', error);

            // Extract error message safely without using 'any'
            let message = 'Failed to start semester';
            if (error && typeof error === 'object' && 'response' in error) {
                const responseData = (error as { response: { data: { detail?: string; message?: string } } }).response?.data;
                message = responseData?.detail || responseData?.message || message;
            } else if (error instanceof Error) {
                message = error.message;
            }

            Swal.fire({
                title: 'Error!',
                text: message,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="group relative rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-h-[320px] flex flex-col bg-white">
            {/* Background Pattern */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getSeasonGradient(semester.season as 'Spring' | 'Summer' | 'Fall')}`}></div>

            <div className="relative h-full flex flex-col justify-between p-4 z-10">
                <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-white/60 shadow-sm mb-auto">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusColors.bg} ${statusColors.text} ${statusColors.border} text-xs font-bold shadow-sm border`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot} ${semester.status === 'Ongoing' ? 'animate-pulse' : ''}`}></span>
                                {semester.status}
                            </span>
                        </div>
                        <span className="material-symbols-outlined text-gray-500 bg-white p-1 rounded-lg shadow-sm">calendar_month</span>
                    </div>

                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{semester.name}</h4>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4 font-medium">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        {semester.startDate} — {semester.endDate}
                    </div>

                    <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Teams</span>
                            <span className="text-xl font-bold text-gray-800">{semester.totalTeams}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-gray-200"></div>
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Students</span>
                            <span className="text-xl font-bold text-gray-800">{semester.totalWhitelists}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-gray-200"></div>
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Season</span>
                            <span className={`text-sm font-bold capitalize text-${semester.seasonColor}-600`}>{semester.season}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 bg-white/80 backdrop-blur-md rounded-xl p-2 border border-white/60 shadow-sm">
                    <button onClick={() => navigate(`/semesters/semester?id=${semester.id}`)} className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors">
                        <span className="material-symbols-outlined text-[18px]">visibility</span> View
                    </button>
                    {semester.status !== 'Ended' && (
                        <button onClick={() => navigate(`/semesters/semester?id=${semester.id}`)} className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors">
                            <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                        </button>
                    )}

                    {semester.status === 'Upcoming' && (
                        <button
                            onClick={handleStartSemester}
                            disabled={isLoading}
                            className={`cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 text-green-600 text-xs font-bold transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">play_circle</span> Start
                        </button>
                    )}

                    {semester.status === 'Ongoing' && (
                        <button onClick={() => navigate(`/semesters/semester?id=${semester.id}`)} className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-orange-50 text-orange-600 text-xs font-bold transition-colors">
                            <span className="material-symbols-outlined text-[18px]">stop_circle</span> End
                        </button>
                    )}

                    {semester.status === 'Ended' && (
                        <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-400 text-xs font-bold cursor-default">
                            <span className="material-symbols-outlined text-[18px]">lock</span> Closed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SemesterCard;
