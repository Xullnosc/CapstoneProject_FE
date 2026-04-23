import React from 'react';
import { type DiscoveryTeamDto } from '../../types/studentInteraction';

interface TeamDiscoveryCardProps {
  team: DiscoveryTeamDto;
  onJoinClick?: (teamId: number) => void;
  onCancelRequest?: (teamId: number) => void;
  onContactLeader?: (leaderId: number) => void;
  isLoading?: boolean; // Fix #14: loading state to prevent double-click
}

const TeamDiscoveryCard: React.FC<TeamDiscoveryCardProps> = ({ team, onJoinClick, onCancelRequest, onContactLeader, isLoading = false }) => {
  const percent = Math.min(100, Math.round((team.currentMemberCount / team.maxMembers) * 100));

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#F27123]/30 hover:shadow-xl transition-all group cursor-pointer shadow-sm flex flex-col h-full">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-4">
          {team.teamAvatar ? (
            <img src={team.teamAvatar} alt={team.teamName} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center border border-slate-100">
              <span className="material-symbols-outlined text-3xl text-slate-400">groups</span>
            </div>
          )}
          {team.teamCode && (
            <span className="text-[10px] font-bold text-[#F27123] uppercase tracking-widest border-2 border-[#F27123]/20 px-3 py-1 rounded-xl bg-orange-50/50 shadow-sm">
              {team.teamCode}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#F27123] transition-colors line-clamp-1 leading-tight">
          {team.teamName}
        </h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 italic italic">
            Found in {team.semesterName || 'Current Semester'}
        </p>

        <div className="mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">
            <span>Formation Progress</span>
            <span className="text-[#F27123]">{team.currentMemberCount}/{team.maxMembers} Members</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-[#F27123] to-[#FF8E53] rounded-full transition-all duration-500" 
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 mb-6">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-3 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">bolt</span>
            Team Skills
          </span>
          <div className="flex flex-wrap gap-2">
            {(team.skills || []).map((skill, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {!team.isUserInTeam && (
        <div className="flex gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onContactLeader?.(team.leaderId);
            }}
            className="flex-1 py-3 bg-white border-2 border-[#F27123]/20 text-[#F27123] font-bold text-sm rounded-2xl hover:bg-orange-50/50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            Contact
          </button>
          {team.hasPendingJoinRequest ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onCancelRequest?.(team.teamId);
              }}
              className="flex-[2] py-3 bg-rose-50 border border-rose-200 text-rose-500 font-bold text-sm rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
              Cancel Request
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoading) onJoinClick?.(team.teamId);
              }}
              disabled={isLoading}
              className={`flex-[2] py-3 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm ${
                isLoading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#F27123] text-white hover:bg-[#D95F1A] hover:shadow-lg hover:shadow-[#F27123]/20'
              }`}
            >
              {isLoading ? (
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-lg">handshake</span>
              )}
              {isLoading ? 'Sending...' : 'Request to Join'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamDiscoveryCard;
