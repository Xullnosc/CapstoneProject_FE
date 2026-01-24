import Swal from 'sweetalert2';
import type { Team } from '../../types/team';

interface ProjectStatusSectionProps {
    team: Team | null;
    isLeader: boolean;
}

const ProjectStatusSection: React.FC<ProjectStatusSectionProps> = ({ team, isLeader }) => {
    if (!team) return null;
    const hasTopic = !!team.topicId;

    const handleActionClick = (actionName: string) => {
        if (!isLeader) {
            Swal.fire({
                title: 'Restricted Access',
                text: `Only the Team Leader can ${actionName}.`,
                icon: 'warning',
                confirmButtonColor: '#f97415'
            });
            return;
        }
        // TODO: Handle actual navigation/action for Leader
        Swal.fire({
            title: 'Coming Soon',
            text: `Leader function '${actionName}' is under development.`,
            icon: 'info'
        });
    };

    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-[#1c130d] dark:text-white text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f97415]">analytics</span>
                    Project Status
                </h2>
            </div>

            {hasTopic ? (
                <div className="group bg-white dark:bg-[#2d1f14] rounded-2xl border border-[#f4ece6] dark:border-[#3d2a1d] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Cover Image */}
                    <div className="md:w-1/3 min-h-[200px] md:min-h-full bg-cover bg-center relative" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=80")' }}>
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                        <div>
                            {/* Header: Badge & Date */}
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                <span className="bg-[#d1fae5] dark:bg-[#064e3b] text-[#10b981] dark:text-[#34d399] px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                                    Thesis Approved
                                </span>
                                <span className="text-[#9e6b47]/60 text-xs font-medium">
                                    Updated 2 days ago
                                </span>
                            </div>

                            {/* Title & Description */}
                            <h3 className="text-[#1c130d] dark:text-white text-2xl md:text-3xl font-extrabold mb-3 leading-tight tracking-tight">
                                {team.topicName || "Thesis Topic Assigned"}
                            </h3>
                            <p className="text-[#9e6b47] dark:text-[#d4c5bb] text-sm md:text-base leading-relaxed mb-6">
                                Optimizing city flow through decentralized neural networks and real-time sensor data integration.
                            </p>
                        </div>

                        {/* Footer: Mentor & Actions */}
                        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pt-4 mt-auto border-t border-[#f4ece6] dark:border-[#3d2a1d]/50">
                            {/* Primary Mentor */}
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-[#f97415]/10 flex items-center justify-center text-[#f97415]">
                                    <span className="material-symbols-outlined">school</span>
                                </div>
                                <div>
                                    <p className="text-[#9e6b47] text-[10px] font-bold uppercase tracking-wider mb-0.5">Primary Mentor</p>
                                    <p className="text-[#1c130d] dark:text-white font-bold text-sm">Dr. Sarah Jenkins</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex bg-[#f97415] rounded-xl overflow-hidden shadow-sm shadow-[#f97415]/20 w-full md:w-auto">
                                <button className="flex-1 md:flex-none px-6 py-3 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#e66004] transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    View Details
                                </button>
                                <div className="w-px bg-white/20"></div>
                                <button className="px-4 py-3 text-white hover:bg-[#e66004] transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // No Topic - Show Action Buttons
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
                    <button
                        onClick={() => handleActionClick('register a thesis')}
                        className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-8 bg-[#f97415]/10 border-2 border-[#f97415] border-dashed rounded-xl hover:bg-[#f97415]/15 transition-all group cursor-pointer"
                    >
                        <div className="size-10 md:size-12 rounded-full bg-[#f97415] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[20px] md:text-[24px]">fact_check</span>
                        </div>
                        <div className="text-center">
                            <p className="text-[#f97415] text-base md:text-lg font-bold leading-tight">Register Approved Thesis</p>
                            <p className="text-[#f97415]/70 text-xs md:text-sm mt-1">Submit your approved thesis details</p>
                        </div>
                    </button>
                    <button
                        onClick={() => handleActionClick('propose a thesis idea')}
                        className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-8 border-2 border-[#9e6b47]/20 border-dashed rounded-xl hover:border-[#f97415]/50 transition-all group cursor-pointer"
                    >
                        <div className="size-10 md:size-12 rounded-full bg-[#f4ece6] dark:bg-[#3d2a1d] text-[#9e6b47] flex items-center justify-center group-hover:text-[#f97415] transition-colors">
                            <span className="material-symbols-outlined text-[20px] md:text-[24px]">add_circle</span>
                        </div>
                        <div className="text-center">
                            <p className="text-[#1c130d] dark:text-white text-base md:text-lg font-bold leading-tight">Propose Thesis Idea</p>
                            <p className="text-[#9e6b47] text-xs md:text-sm mt-1">Submit a new idea for approval</p>
                        </div>
                    </button>
                </div>
            )}
        </section>
    );
};

export default ProjectStatusSection;
