import React, { useState, useEffect, useCallback } from 'react';
import { discoveryService } from '../../services/discoveryService';
import { semesterService } from '../../services/semesterService';
import { type DiscoveryStudentDto, type DiscoveryTeamDto } from '../../types/studentInteraction';
import DiscoveryCard from '../../components/Discovery/DiscoveryCard';
import TeamDiscoveryCard from '../../components/Discovery/TeamDiscoveryCard';
import Pagination from '../../components/Common/Pagination';
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
  const [currentSemesterId, setCurrentSemesterId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingTeamId, setLoadingTeamId] = useState<number | null>(null); 
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
        const semester = await semesterService.getCurrentSemester();
        if (semester) setCurrentSemesterId(semester.semesterId);
      } catch (error) {
        console.error('Failed to fetch initial discovery data', error);
      }
    };
    fetchInitialData();
  }, []);

  const fetchData = useCallback(async (targetPage = 1) => {
    if (!currentSemesterId) return;

    setLoading(true);

    try {
      if (activeTab === 'students') {
        const data = await discoveryService.getLookingStudents(currentSemesterId, '', debouncedSearch, targetPage, PAGE_SIZE);
        setStudents(data.items);
        setTotalPages(data.totalPages);
      } else {
        const data = await discoveryService.getOpenTeams(currentSemesterId, '', debouncedSearch, targetPage, PAGE_SIZE);
        setTeams(data.items);
        setTotalPages(data.totalPages);
      }
      
      setPage(targetPage);
    } catch (error) {
      console.error('Failed to fetch discovery data', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, currentSemesterId]);

  // Refresh list when tab or search changes
  useEffect(() => {
    if (currentSemesterId) {
      fetchData(1);
    }
  }, [activeTab, debouncedSearch, currentSemesterId, fetchData]);

  const handleJoinTeam = async (teamId: number) => {
    setLoadingTeamId(teamId);
    try {
      await discoveryService.requestJoin(teamId);
      setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, hasPendingJoinRequest: true } : t));
      Swal.fire({
          icon: 'success',
          title: 'Request Sent',
          text: 'Join request sent successfully!',
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

      {!loading && (
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => {
            fetchData(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </main>
  );
};

export default DiscoveryPage;
