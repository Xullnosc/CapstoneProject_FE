import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardStats } from '../../services/dashboardService';

const AdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardService.getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { title: 'Total Users', value: stats?.totalUsers || 0, icon: 'pi pi-users', color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-200' },
        { title: 'Total Theses', value: stats?.totalTheses || 0, icon: 'pi pi-book', color: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-200' },
        { title: 'Total Teams', value: stats?.totalTeams || 0, icon: 'pi pi-sitemap', color: 'from-purple-500 to-fuchsia-500', shadow: 'shadow-purple-200' },
        { title: 'Total Semesters', value: stats?.totalSemesters || 0, icon: 'pi pi-calendar', color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-200' }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 h-32 animate-pulse flex flex-col justify-center">
                        <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 pt-6 fadein animation-duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">System Overview</h2>
                <p className="text-gray-500">High-level statistics across the entire FCTMS platform.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${card.color} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ease-in-out`}></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow}`}>
                                <i className={`${card.icon} text-xl`}></i>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-gray-800 tracking-tight">{card.value}</h3>
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">{card.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Placeholder for future admin charts or tables */}
            <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl mt-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                    <i className="pi pi-info-circle text-xl"></i>
                </div>
                <div>
                    <h4 className="font-bold text-orange-800 text-lg mb-1">Administrative Dashboard</h4>
                    <p className="text-orange-700 text-sm">Welcome to the management interface. From here, you can oversee system-wide metrics and navigate to specific management modules.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
