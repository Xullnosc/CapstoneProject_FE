import React, { useState, useEffect, useCallback } from 'react';
import { discoveryService } from '../../services/discoveryService';
import { semesterService } from '../../services/semesterService';
import { type DiscoveryStudentDto, type DiscoveryTeamDto } from '../../types/studentInteraction';
import DiscoveryCard from '../../components/Discovery/DiscoveryCard';
import TeamDiscoveryCard from '../../components/Discovery/TeamDiscoveryCard';
import SkillFilter from '../../components/Discovery/SkillFilter';
import DiscoveryGrid from '../../components/Discovery/DiscoveryGrid';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const DiscoveryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'teams'>('students');
  const [students, setStudents] = useState<DiscoveryStudentDto[]>([]);
  const [teams, setTeams] = useState<DiscoveryTeamDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [popularSkills, setPopularSkills] = useState<string[]>([]);
  const [currentSemesterId, setCurrentSemesterId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingTeamId, setLoadingTeamId] = useState<number | null>(null); // Fix #14: prevent double-click
  const navigate = useNavigate();
  const PAGE_SIZE = 12;

  // Search Debounce Logic (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [semester, topSkills] = await Promise.all([
          semesterService.getCurrentSemester(),
          discoveryService.getPopularSkills()
        ]);
        
        if (semester) setCurrentSemesterId(semester.semesterId);
        if (topSkills) setPopularSkills(topSkills);
      } catch (error) {
        console.error('Failed to fetch initial discovery data', error);
      }
    };
    fetchInitialData();
  }, []);

  const fetchData = useCallback(async (isLoadMore = false) => {
    if (!currentSemesterId) return;

    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      
      if (activeTab === 'students') {
        const data = await discoveryService.getLookingStudents(currentSemesterId, selectedSkill, debouncedSearch, currentPage, PAGE_SIZE);
        setStudents(prev => isLoadMore ? [...prev, ...data.items] : data.items);
        setHasMore(data.items.length === PAGE_SIZE);
      } else {
        const data = await discoveryService.getOpenTeams(currentSemesterId, selectedSkill, debouncedSearch, currentPage, PAGE_SIZE);
        setTeams(prev => isLoadMore ? [...prev, ...data.items] : data.items);
        setHasMore(data.items.length === PAGE_SIZE);
      }
      
      setPage(currentPage);
    } catch (error) {
      console.error('Failed to fetch discovery data', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, selectedSkill, debouncedSearch, currentSemesterId, page]);

  // Refresh list when tab, skill or search changes - Fix #9: also reset page to 1
  useEffect(() => {
    if (currentSemesterId) {
      setPage(1);
      fetchData(false);
    }
  }, [activeTab, selectedSkill, debouncedSearch, currentSemesterId, fetchData]);

  const handleJoinTeam = async (teamId: number) => {
    setLoadingTeamId(teamId); // Fix #14: disable button while loading
    try {
      await discoveryService.requestJoin(teamId);
      // Fix #2: only update UI AFTER API succeeds (was updating before)
      setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, hasPendingJoinRequest: true } : t));
      Swal.fire({
          icon: 'success',
          title: 'Request Sent',
          text: 'Join request sent successfully! The team leader will be notified.',
          confirmButtonColor: '#F26F21',
          customClass: { confirmButton: 'rounded-xl' }
      });
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : 'Failed to send join request.';
      Swal.fire({
          icon: 'warning',
          title: 'Cannot Send Request',
          text: typeof msg === 'string' ? msg : 'Error sending request',
          confirmButtonColor: '#F26F21'
      });
    } finally {
      setLoadingTeamId(null);
    }
  };

  const handleCancelRequest = async (teamId: number) => {
    try {
      await discoveryService.cancelJoinRequest(teamId);
      // Optimistically update UI
      setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, hasPendingJoinRequest: false } : t));
    } catch {
      Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to cancel the request.',
          confirmButtonColor: '#F26F21'
      });
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-8 py-12">
      <section className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tighter text-slate-900 mb-8">
          Student Discovery Board
        </h1>
        <div className="relative max-w-4xl mb-6 group">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-[#F27123] transition-colors">
            <span className="material-symbols-outlined">search</span>
          </span>
          <input 
            className="w-full bg-white border border-slate-200 py-4 pl-12 pr-6 rounded-xl shadow-sm focus:ring-4 focus:ring-[#F27123]/10 focus:border-[#F27123] outline-none transition-all text-sm" 
            placeholder="Search by name, student code, or team code..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <SkillFilter 
          skills={popularSkills.length > 0 ? popularSkills : ['React', '.NET', 'Design', 'Python', 'Java']} 
          selectedSkill={selectedSkill}
          onSkillSelect={setSelectedSkill}
        />
      </section>

      <nav className="flex gap-12 border-b border-slate-200 mb-10">
        {(['students', 'teams'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative pb-4 text-sm font-bold capitalize transition-colors ${activeTab === tab ? 'text-[#F27123]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#F27123]"></div>}
          </button>
        ))}
      </nav>

      {activeTab === 'students' ? (
        <DiscoveryGrid 
          items={students}
          loading={loading && students.length === 0}
          emptyIcon="person_search"
          emptyMessage="No students found matching your criteria."
          renderItem={(student) => (
            <DiscoveryCard 
              key={student.userId} 
              student={student} 
              onContact={() => navigate(`/chat?targetUserId=${student.userId}`)} 
            />
          )}
        />
      ) : (
        <DiscoveryGrid 
          items={teams}
          loading={loading && teams.length === 0}
          emptyIcon="group_off"
          emptyMessage="No teams are currently seeking for these skills."
          renderItem={(team) => (
            <TeamDiscoveryCard 
              key={team.teamId} 
              team={team} 
              isLoading={loadingTeamId === team.teamId}
              onJoinClick={() => handleJoinTeam(team.teamId)}
              onCancelRequest={() => handleCancelRequest(team.teamId)}
              onContactLeader={(leaderId) => navigate(`/chat?targetUserId=${leaderId}`)}
            />
          )}
        />
      )}

      {!loading && hasMore && (activeTab === 'students' ? students.length > 0 : teams.length > 0) && (
        <div className="py-12 flex justify-center">
          <button 
            onClick={() => fetchData(true)}
            disabled={loadingMore}
            className="group relative bg-white border border-slate-200 text-slate-700 px-10 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-3"
          >
            {loadingMore ? (
              <span className="material-symbols-outlined text-lg animate-spin text-[#F27123]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-lg group-hover:translate-y-0.5 transition-transform">expand_more</span>
            )}
            {loadingMore ? 'Syncing...' : 'Load More Results'}
          </button>
        </div>
      )}

      {!loading && !hasMore && (activeTab === 'students' ? students.length > 0 : teams.length > 0) && (
        <p className="text-center py-12 text-slate-400 text-sm font-medium italic">
          — You've reached the end of the treasure map —
        </p>
      )}
    </main>
  );
};

export default DiscoveryPage;
