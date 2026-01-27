import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { useEffect, useState } from 'react';
import { teamService } from '../../services/teamService';
import { authService } from '../../services/authService';

const Homepage = () => {
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const currentUser = authService.getUser();
                const team = await teamService.getMyTeam();

                let members: any[] = [];

                if (team) {
                    members = team.members.map(member => ({
                        id: member.studentId,
                        name: member.studentCode === currentUser?.studentCode ? `${member.fullName} (You)` : member.fullName,
                        role: member.role === 'Leader' ? 'TEAM LEAD' : 'MEMBER',
                        image: member.avatar || 'https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png',
                        isEmpty: false
                    }));
                }

                // Fill remaining slots
                const totalSlots = 5;
                const emptySlots = totalSlots - members.length;

                for (let i = 0; i < emptySlots; i++) {
                    members.push({
                        id: `empty-${i}`,
                        name: 'Empty Slot',
                        role: 'Invite Member',
                        image: '',
                        isEmpty: true
                    });
                }

                setTeamMembers(members);
            } catch (error) {
                console.error("Failed to fetch team data", error);

                // Fallback to empty slots on error
                const members = Array(5).fill(null).map((_, i) => ({
                    id: `empty-${i}`,
                    name: 'Empty Slot',
                    role: 'Invite Member',
                    image: '',
                    isEmpty: true
                }));
                setTeamMembers(members);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, []);

    // Mock Data for Recent Activity
    const activities = [
        { id: 1, title: 'Mentor Invitation Received', desc: "Dr. Sarah Smith invited you to 'AI in Healthcare'", time: '2 HOURS AGO', color: 'bg-orange-500' },
        { id: 2, title: 'System Update', desc: 'Phase 1 registration is now officially open for all students.', time: '5 HOURS AGO', color: 'bg-gray-400' },
        { id: 3, title: 'Topic Approved', desc: "The topic 'Blockchain for Supply Chain' was just added.", time: 'YESTERDAY', color: 'bg-gray-400' },
        { id: 4, title: 'Welcome', desc: 'You have successfully logged into the Capstone Portal.', time: '2 DAYS AGO', color: 'bg-gray-400' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 fadein animation-duration-500">
            {/* Main Content Column */}
            <div className="lg:col-span-3 space-y-8 pt-10">
                {/* Dashboard Stats Section */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8 animate-fadein">
                    <div className="relative w-40 h-40 shrink-0">
                        {/* Circular Graph Implementation */}
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            {/* Background Circle */}
                            <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />
                            {/* Progress Circle (75%) */}
                            <path className="text-orange-500 drop-shadow-md" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <span className="text-3xl font-bold text-gray-800">75%</span>
                            <span className="block text-[10px] text-gray-400 font-bold tracking-wider uppercase">Complete</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full ">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Thesis Progress</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-semibold text-gray-600">Research Phase</span>
                                    <span className="font-bold text-gray-800">100%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 w-full rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-semibold text-gray-600">Documentation</span>
                                    <span className="font-bold text-gray-800">60%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-400 w-[60%] rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-semibold text-gray-600">Implementation</span>
                                    <span className="font-bold text-gray-800">40%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-300 w-[40%] rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* My Team Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <i className="pi pi-users text-orange-500"></i> My Team
                        </h3>
                        <span className="text-sm text-gray-500 font-medium">{teamMembers.filter(m => !m.isEmpty).length} / 5 Members</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {loading ? (
                            // Loading Skeleton
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm h-48 flex items-center justify-center">
                                    <i className="pi pi-spin pi-spinner text-3xl text-orange-500"></i>
                                </div>
                            ))
                        ) : (
                            teamMembers.map((member) => (
                                <div key={member.id} className={`bg-white p-4 rounded-2xl border ${member.isEmpty ? 'border-dashed border-gray-300 hover:border-orange-300 hover:bg-orange-50/50' : 'border-gray-100 shadow-sm'} flex flex-col items-center justify-center text-center h-48 transition-all duration-300 group cursor-pointer`}>
                                    {member.isEmpty ? (
                                        <>
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-500 transition-colors">
                                                <i className="pi pi-plus text-xl"></i>
                                            </div>
                                            <div className="font-bold text-gray-400 text-sm mb-3 group-hover:text-gray-600">Available</div>
                                            <Button label="Invite" size="small" outlined severity="warning" className="w-full text-xs" />
                                        </>
                                    ) : (
                                        <>
                                            <Avatar image={member.image} size="large" shape="circle" className="mb-3 border-2 border-orange-100" />
                                            <div className="font-bold text-gray-800 text-sm mb-1">{member.name}</div>
                                            <Tag value={member.role} severity="warning" className="text-[10px] px-2 py-0.5" rounded></Tag>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Project Topics Section */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="pi pi-briefcase text-orange-500"></i> Project Topics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Browse Topics */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                <i className="pi pi-search text-xl"></i>
                            </div>
                            <h4 className="font-bold text-gray-800 mb-2">Browse Topics</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">Explore 150+ pre-approved university projects.</p>
                        </div>

                        {/* Mentor Invites */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative">
                            <div className="absolute top-6 right-6">
                                <Badge value="3" severity="danger" className="text-xs"></Badge>
                            </div>
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                <i className="pi pi-envelope text-xl"></i>
                            </div>
                            <h4 className="font-bold text-gray-800 mb-2">Mentor Invites</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">View invitations from potential faculty mentors.</p>
                        </div>

                        {/* Propose Topic */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                <i className="pi pi-plus-circle text-xl"></i>
                            </div>
                            <h4 className="font-bold text-gray-800 mb-2">Propose Topic</h4>
                            <p className="text-sm text-gray-500 leading-relaxed mb-3">Submit your own project idea for approval.</p>
                            <Tag value="PENDING" severity="warning" className="text-[10px] px-2 py-0.5 rounded-full"></Tag>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Column */}
            <div className="col-span-1 space-y-8">
                {/* Recent Activity */}
                <div className="bg-gray-50/50 p-6 rounded-3xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pl-6 pb-2">
                        {activities.map((activity) => (
                            <div key={activity.id} className="relative">
                                <span className={`absolute -left-7.75 top-1 w-3 h-3 rounded-full border-2 border-white ${activity.color} shadow-sm`}></span>
                                <h5 className="font-bold text-sm text-gray-800 mb-1">{activity.title}</h5>
                                <p className="text-xs text-gray-500 mb-2 leading-relaxed">{activity.desc}</p>
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                    <Button label="View All Activity" className="w-full mt-6 bg-gray-200 text-gray-700 border-none hover:bg-gray-300 font-bold text-sm py-3 rounded-xl transition-colors" />
                </div>

                {/* Pro Tip Card */}
                <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-3 text-orange-600 font-bold">
                        <i className="pi pi-lightbulb text-xl"></i>
                        <span>Pro Tip</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Teams with a clear project proposal are <span className="font-bold text-orange-600">40% more likely</span> to get their first-choice mentor. Draft your proposal early!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Homepage;
