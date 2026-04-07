import { useState, useEffect } from 'react';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { useNavigate } from 'react-router-dom';
import { teamService } from '../../services/teamService';
import { authService } from '../../services/authService';
import { thesisService } from '../../services/thesisService';
import notificationService from '../../services/notificationService';
import type { Team, TeamMember } from '../../types/team';
import type { Thesis } from '../../types/thesis';
import type { NotificationDTO } from '../../types/notification';
import InviteMemberModal from '../../components/team/InviteMemberModal';
import AdminDashboard from './AdminDashboard';
import LecturerDashboard from './LecturerDashboard';

const Homepage = () => {
    const navigate = useNavigate();
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [myThesis, setMyThesis] = useState<Thesis | null>(null);
    const [recentNotifs, setRecentNotifs] = useState<NotificationDTO[]>([]);
    const [showCoachCard, setShowCoachCard] = useState(true);
    const [currentUser, setCurrentUser] = useState(() => authService.getUser());
    const isHODOrAdmin = currentUser?.roleName === 'HOD' || currentUser?.roleName === 'Head of Department' || currentUser?.roleName === 'Admin';
    const isLecturer = currentUser?.roleName === 'Lecturer';
    const getThesisProgress = (status?: string) => {
        if (!status) return 0;
        switch (status) {
            case 'Registered':
                return 100;
            case 'HOD Reviewing':
                return 80;
            case 'Reviewing':
                return 60;
            case 'On Mentor Inviting':
                return 40;
            case 'Need Update':
                return 30;
            default:
                return 20;
        }
    };

    useEffect(() => {
        const syncUser = () => setCurrentUser(authService.getUser());
        // Keep in sync when auth changes in another tab/window.
        window.addEventListener('storage', syncUser);
        // Also sync on focus (some browsers don't fire storage in same tab).
        window.addEventListener('focus', syncUser);
        return () => {
            window.removeEventListener('storage', syncUser);
            window.removeEventListener('focus', syncUser);
        };
    }, []);

    useEffect(() => {
        if (isHODOrAdmin || isLecturer) {
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            try {
                const [myTeamResult, thesesResult, notifsResult] = await Promise.allSettled([
                    teamService.getMyTeam(),
                    thesisService.getMyTheses(),
                    notificationService.getNotifications(1, 5),
                ]);
                if (myTeamResult.status === 'fulfilled') setTeam(myTeamResult.value);
                if (thesesResult.status === 'fulfilled' && thesesResult.value.length > 0) {
                    setMyThesis(thesesResult.value[0]);
                }
                if (notifsResult.status === 'fulfilled') {
                    setRecentNotifs(notifsResult.value.items ?? []);
                }
            } catch (error) {
                console.error('Failed to fetch homepage data', error);
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [isHODOrAdmin, isLecturer, currentUser?.email]);

    // Generate Team Display Data
    const getTeamDisplay = () => {
        const maxMembers = 5;
        const members: (TeamMember | { isEmpty: true })[] = [];

        if (team) {
            // Add existing members
            team.members.forEach(member => {
                members.push(member);
            });
        }

        // Fill remaining slots
        while (members.length < maxMembers) {
            members.push({ isEmpty: true });
        }

        return members;
    };

    const displayMembers = getTeamDisplay();
    const thesisProgress = getThesisProgress(myThesis?.status);
    const unreadNotifCount = recentNotifs.filter((x) => !x.isRead).length;
    const hasFullTeam = Boolean(team && team.memberCount >= 5);
    const hasMentor = Boolean(team && (team.mentorId || team.mentorEmail || team.mentorId2 || team.mentor2Email));
    const hasTeamThesis = Boolean(myThesis || team?.topicId);
    const isThesisRegistered = myThesis?.status === 'Registered';
    const journeyMilestones = [
        {
            id: 'login',
            title: 'Login to system',
            desc: 'Account access is active and ready.',
            done: Boolean(currentUser),
        },
        {
            id: 'team',
            title: 'Team has enough members',
            desc: 'Your team reached 5/5 members.',
            done: hasFullTeam,
        },
        {
            id: 'mentor-thesis',
            title: 'Team has mentor and thesis',
            desc: 'Mentor assignment and thesis proposal are available.',
            done: hasMentor && hasTeamThesis,
        },
        {
            id: 'registered',
            title: 'Thesis registered',
            desc: 'Proposal is fully registered in workflow.',
            done: isThesisRegistered,
        },
    ];
    const doneMilestones = journeyMilestones.filter((m) => m.done).length;
    const allJourneyDone = doneMilestones === journeyMilestones.length;
    const nextMilestone = journeyMilestones.find((m) => !m.done);


    if (isHODOrAdmin) {
        return <AdminDashboard />;
    }

    if (isLecturer) {
        return <LecturerDashboard />;
    }

    return (
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-2 pb-8 pt-6 lg:grid-cols-12 fadein animation-duration-500">
            {/* Main Content Column */}
            <div className="space-y-8 lg:col-span-8 xl:col-span-9">
                {/* Thesis Progress - real API data */}
                <div className="animate-fadein rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:p-7">
                    <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
                    <div className="relative mx-auto h-36 w-36 shrink-0 md:mx-0 md:h-40 md:w-40">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.6" />
                            {(() => {
                                return <path className="text-orange-500" strokeDasharray={`${thesisProgress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />;
                            })()}
                        </svg>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            {myThesis ? (
                                <>
                                    <span className="text-3xl font-bold text-gray-800">
                                        {`${thesisProgress}%`}
                                    </span>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Complete</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-2xl font-bold text-gray-400">—</span>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">No Thesis</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="w-full">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-xl font-bold text-gray-900">Thesis Progress</h2>
                            {myThesis && (
                                <Tag
                                    value={myThesis.status}
                                    severity="warning"
                                    className="rounded-full px-3 py-1 text-[10px] tracking-wide shadow-sm"
                                />
                            )}
                        </div>
                        {myThesis ? (
                            <>
                                <p className="mb-4 max-w-2xl truncate text-sm text-gray-600" title={myThesis.title}>{myThesis.title}</p>
                                <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-semibold text-gray-600">Status</span>
                                            <span className="font-bold text-orange-600">{`${thesisProgress}%`}</span>
                                        </div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200/80">
                                            <div className="h-full rounded-full bg-linear-to-r from-orange-400 via-orange-500 to-amber-500 transition-all duration-500" style={{ width: `${thesisProgress}%` }} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 text-sm md:grid-cols-2">
                                        <span className="font-semibold text-gray-600">Mentor 1</span>
                                        <span className="font-bold text-gray-700 md:text-right">{myThesis.mentorEmail1 ?? 'Not assigned'}</span>
                                    </div>
                                    <div className="grid gap-2 text-sm md:grid-cols-2">
                                        <span className="font-semibold text-gray-600">Mentor 2</span>
                                        <span className="font-bold text-gray-700 md:text-right">{myThesis.mentorEmail2 ?? 'Not assigned'}</span>
                                    </div>
                                </div>
                                <Button label="View Thesis" icon="pi pi-arrow-right" iconPos="right" size="small" severity="warning" className="mt-5 rounded-xl px-5 font-semibold shadow-sm" onClick={() => navigate('/my-thesis')} />
                            </>
                        ) : (
                            <div className="mt-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4">
                                <p className="text-sm text-gray-500">You do not have a thesis yet.</p>
                                <Button label="Propose a Thesis" icon="pi pi-plus" size="small" severity="warning" className="mt-3 w-fit rounded-xl px-4 font-semibold shadow-sm" onClick={() => navigate('/propose-thesis')} />
                            </div>
                        )}
                    </div>
                </div>
                </div>

                {/* My Team Section */}
                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                                <i className="pi pi-users text-orange-500"></i> My Team {team && <span className="text-sm font-normal text-gray-400">({team.teamName})</span>}
                            </h3>
                            <span className="text-sm font-medium text-gray-500">{team ? team.memberCount : 0} / 5 Members</span>
                        </div>
                        <Button
                            label="Open Team Space"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            size="small"
                            outlined
                            severity="warning"
                            className="rounded-xl"
                            onClick={() => navigate('/teams/team')}
                        />
                    </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {loading ? (
                        // Loading Skeletons
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 h-48 animate-pulse flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-gray-200 rounded-full mb-3"></div>
                                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                            </div>
                        ))
                    ) : !team ? (
                        // No Team State
                        <div className="col-span-full bg-orange-50 rounded-2xl p-8 text-center border border-dashed border-orange-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-orange-500 mx-auto mb-4 shadow-sm">
                                <i className="pi pi-users text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">You haven't joined a team yet</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">Join an existing team or create your own to start your capstone journey.</p>
                            <div className="flex justify-center gap-4">
                                <Button label="Create Team" icon="pi pi-plus" className="p-button-warning" onClick={() => navigate('/teams')} />
                                <Button label="Find Team" icon="pi pi-search" outlined severity="warning" />
                            </div>
                        </div>
                    ) : (
                        displayMembers.map((member, index) => {
                            // Check if it's a real member or empty slot
                            if ('isEmpty' in member) {
                                return (
                                    <div key={`empty-${index}`} className="bg-white/95 p-4 rounded-2xl border border-dashed border-gray-300 hover:border-orange-300 hover:bg-orange-50/50 flex flex-col items-center justify-center text-center h-48 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md"
                                        onClick={() => setIsInviteModalOpen(true)}>
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-500 transition-colors">
                                            <i className="pi pi-plus text-xl"></i>
                                        </div>
                                        <div className="font-bold text-gray-400 text-sm mb-3 group-hover:text-gray-600">Available</div>
                                        <Button
                                            label="Invite"
                                            size="small"
                                            outlined
                                            severity="warning"
                                            className="w-full text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsInviteModalOpen(true);
                                            }}
                                        />
                                    </div>
                                );
                            } else {
                                // Render Real Member
                                const isMe = member.email === currentUser?.email;
                                return (
                                    <div key={member.studentId} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center h-48 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                                        onClick={() => navigate('/teams/team')}>
                                        <Avatar
                                            image={member.avatar || "https://cdn.haitrieu.com/wp-content/uploads/2021/10/Logo-Dai-hoc-FPT.png"}
                                            size="large"
                                            shape="circle"
                                            className="mb-3 border-2 border-orange-100"
                                        />
                                        <div className="font-bold text-gray-800 text-sm mb-1 line-clamp-1 w-full" title={member.fullName}>
                                            {member.fullName} {isMe && <span className="text-orange-500">(You)</span>}
                                        </div>
                                        <Tag value={member.role} severity={member.role === 'Leader' ? 'warning' : 'info'} className="text-[10px] px-2 py-0.5" rounded></Tag>
                                    </div>
                                );
                            }
                        })
                    )}
                </div>
                </section>

                {/* Project Topics Section */}
                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="pi pi-briefcase text-orange-500"></i> Workspace
                    </h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Team Topic / Thesis List */}
                        <div onClick={() => navigate(hasTeamThesis ? '/my-thesis' : '/thesis')} className="group flex min-h-[220px] flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                <i className={`pi ${hasTeamThesis ? 'pi-bookmark' : 'pi-search'} text-xl`}></i>
                            </div>
                            <h4 className="font-bold text-gray-800 mb-2">{hasTeamThesis ? 'View Team Topic' : 'Browse Thesis List'}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {hasTeamThesis
                                    ? 'Open your current team thesis and review the latest progress.'
                                    : 'Explore available thesis topics and choose one that fits your team.'}
                            </p>
                            <Tag
                                value={hasTeamThesis ? 'ACTIVE TOPIC' : 'DISCOVER'}
                                severity={hasTeamThesis ? 'success' : 'info'}
                                className="mt-auto text-[10px] px-2 py-0.5 rounded-full"
                            />
                        </div>

                        {/* Team Workspace */}
                        <div onClick={() => navigate(team ? '/teams/team' : '/teams')} className="group relative flex min-h-[220px] flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                <i className="pi pi-users text-xl"></i>
                            </div>
                            <h4 className="font-bold text-gray-800 mb-2">{team ? 'Team Workspace' : 'Create or Join Team'}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {team
                                    ? 'Manage members, invitations, and collaboration inside your team space.'
                                    : 'Create a new team or join an existing one to start your project journey.'}
                            </p>
                            <Tag
                                value={team ? `${team.memberCount}/5 MEMBERS` : 'TEAM REQUIRED'}
                                severity={team ? 'warning' : 'secondary'}
                                className="mt-auto text-[10px] px-2 py-0.5 rounded-full"
                            />
                        </div>

                        {/* Notifications Center */}
                        <div onClick={() => navigate('/notifications')} className="group relative flex min-h-[220px] flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                            <div className="absolute top-6 right-6">
                                <Badge value={String(unreadNotifCount)} severity={unreadNotifCount > 0 ? 'danger' : 'info'} className="text-xs" />
                            </div>
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                <i className="pi pi-bell text-xl"></i>
                            </div>
                            <h4 className="font-bold text-gray-800 mb-2">Notification Center</h4>
                            <p className="text-sm text-gray-500 leading-relaxed mb-3">
                                Track approvals, team updates, and mentor responses in one place.
                            </p>
                            <Tag value={unreadNotifCount > 0 ? 'NEW UPDATES' : 'UP TO DATE'} severity={unreadNotifCount > 0 ? 'danger' : 'success'} className="mt-auto text-[10px] px-2 py-0.5 rounded-full" />
                        </div>
                    </div>
                </section>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-8 lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 lg:self-start">
                {/* Progress Journey */}
                <div className="rounded-3xl border border-gray-100 bg-linear-to-b from-slate-50 to-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-gray-800">Progress Journey</h3>
                        <Tag
                            value={allJourneyDone ? 'All Done' : `${doneMilestones}/4 Done`}
                            severity={allJourneyDone ? 'success' : 'warning'}
                            className="rounded-full px-3 py-1 text-[10px]"
                        />
                    </div>
                    <div className="relative space-y-4">
                        <span className="absolute bottom-5 left-[11px] top-3 block w-px bg-gray-200" />
                        {journeyMilestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-start gap-3">
                                <div className="relative z-10 mt-0.5 bg-slate-50">
                                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${milestone.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 bg-white text-gray-400'}`}>
                                        <i className={`pi ${milestone.done ? 'pi-check' : 'pi-circle'}`} />
                                    </div>
                                </div>
                                <div className="flex-1 pb-3">
                                    <p className={`text-sm font-semibold ${milestone.done ? 'text-gray-800' : 'text-gray-600'}`}>{milestone.title}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">{milestone.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button
                        label={allJourneyDone ? 'View Thesis Detail' : 'Continue Journey'}
                        className="mt-4 w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => navigate(allJourneyDone ? '/my-thesis' : '/teams')}
                    />
                </div>

                {/* Focus Card */}
                {showCoachCard && (
                    <div className="rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 via-indigo-50 to-white p-6 shadow-sm">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 font-bold text-blue-700">
                                <i className="pi pi-compass text-lg"></i>
                                <span>Focus Recommendation</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCoachCard(false)}
                                className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-white hover:text-gray-700"
                            >
                                Dismiss
                            </button>
                        </div>
                        {allJourneyDone ? (
                            <p className="text-sm leading-relaxed text-gray-600">
                                Great job. All milestone gates are complete. Keep monitoring notifications for reviewer feedback and final updates.
                            </p>
                        ) : (
                            <p className="text-sm leading-relaxed text-gray-600">
                                Next best action: <span className="font-semibold text-gray-800">{nextMilestone?.title}</span>. Complete this step to unlock the next stage faster.
                            </p>
                        )}
                    </div>
                )}
            </div>
            {team && (
                <InviteMemberModal
                    isOpen={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                    teamId={team.teamId}
                />
            )}
        </div>
    );
};

export default Homepage;
