import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, MapPin, ExternalLink, Hash, Loader2, Mail, GraduationCap } from 'lucide-react';
import { type ConversationDto, type TeamChatInfoDto, type UserSkillDto } from '../../types/studentInteraction';
import { userService, type UserInfo } from '../../services/userService';
import { teamService } from '../../services/teamService';
import { discoveryService } from '../../services/discoveryService';
import type { Team } from '../../types/team';

type SkillsPayload = { skills?: UserSkillDto[] };
const isSkillsPayload = (v: unknown): v is SkillsPayload =>
  typeof v === 'object' && v !== null && 'skills' in v;

interface ChatInfoPanelProps {
  onClose: () => void;
  activeConv: { id?: number; teamId?: number } | null;
  activeInfo: ConversationDto | TeamChatInfoDto | undefined;
}

const ChatInfoPanel: React.FC<ChatInfoPanelProps> = ({ onClose, activeConv, activeInfo }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserInfo | null>(null);
  const [teamDetail, setTeamDetail] = useState<Team | null>(null);
  const [skills, setSkills] = useState<UserSkillDto[]>([]);

  useEffect(() => {
    if (!activeConv || !activeInfo) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeConv.teamId) {
          const detail = await teamService.getTeamById(activeConv.teamId);
          setTeamDetail(detail);
        } else {
          const otherUserId = (activeInfo as ConversationDto).otherUserId;
          const [userProfile, userSkillsData] = await Promise.all([
            userService.getProfileByUserId(otherUserId),
            discoveryService.getUserSkills(otherUserId)
          ]);
          setProfile(userProfile);
          
          // Defensive check for array format
          const finalSkills = Array.isArray(userSkillsData)
            ? userSkillsData
            : (isSkillsPayload(userSkillsData) && Array.isArray(userSkillsData.skills) ? userSkillsData.skills : []);
          setSkills(finalSkills as UserSkillDto[]);
        }
      } catch (error) {
        console.error("Failed to fetch info details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeConv, activeInfo]);

  if (!activeConv || !activeInfo) return null;

  const isTeam = !!activeConv.teamId;

  return (
    <aside className="w-80 h-full bg-white border-l border-gray-100 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 z-30">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0">
        <h2 className="text-lg font-bold text-gray-900">Details</h2>
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
                <Loader2 className="animate-spin text-[#F27123]" size={32} />
                <p className="text-sm font-medium text-gray-400">Syncing database...</p>
            </div>
        ) : (
            <>
                {/* Profile Card */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4 group">
                        <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-xl ring-4 ring-gray-50 transition-transform group-hover:scale-105 duration-300">
                            {isTeam ? (
                                teamDetail?.teamAvatar ? (
                                    <img src={teamDetail.teamAvatar} className="w-full h-full object-cover" alt="Team" />
                                ) : (
                                    <div className="w-full h-full bg-orange-100 flex items-center justify-center text-[#F27123]">
                                        <Users size={48} />
                                    </div>
                                )
                            ) : (
                                profile?.avatar ? (
                                    <img src={profile.avatar} className="w-full h-full object-cover" alt="User" />
                                ) : (
                                    <div className="w-full h-full bg-[#F27123] flex items-center justify-center text-white">
                                        <span className="text-4xl font-bold">{(activeInfo as ConversationDto).otherUserName.charAt(0)}</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {isTeam ? teamDetail?.teamName : profile?.fullName || (activeInfo as ConversationDto).otherUserName}
                    </h3>
                    <p className="text-sm font-medium text-gray-400">
                        {isTeam ? `Team • ${teamDetail?.teamCode || 'FCTMS'}` : (profile?.roleName || 'Student')}
                    </p>
                </div>

                {/* Stats/Info Section */}
                <div className="space-y-4">
                    <div className="bg-gray-50/50 rounded-2xl p-4 space-y-3">
                        {isTeam ? (
                            <>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Hash size={18} className="text-gray-400" />
                                    <span className="text-sm font-semibold">{teamDetail?.teamCode || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Users size={18} className="text-gray-400" />
                                    <span className="text-sm font-semibold">
                                        {teamDetail ? `${teamDetail.members.length} Members` : '---'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                {profile?.email && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Mail size={18} className="text-gray-400" />
                                        <span className="text-sm font-semibold truncate max-w-[200px]">{profile.email}</span>
                                    </div>
                                )}
                                {profile?.major && profile.major !== 'N/A' && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <GraduationCap size={18} className="text-gray-400" />
                                        <span className="text-sm font-semibold">{profile.major}</span>
                                    </div>
                                )}
                                {profile?.campus && profile.campus !== 'N/A' && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <MapPin size={18} className="text-gray-400" />
                                        <span className="text-sm font-semibold">{profile.campus}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Skills/Tags Section */}
                {!isTeam && (
                    <div className="space-y-3">
                        <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest px-1">Talent & Skills</h4>
                        <div className="flex flex-wrap gap-2">
                            {skills.length > 0 ? (
                                skills.map(skill => (
                                    <span key={skill.skillId} className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[12px] font-bold text-gray-600 shadow-sm hover:border-[#F27123]/30 hover:text-[#F27123] cursor-pointer transition-all">
                                        {skill.skillTag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-400 italic px-1">User hasn't updated their skills yet</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <button 
                    onClick={() => {
                        if (isTeam && teamDetail) navigate(`/teams/${teamDetail.teamId}`);
                        else if (!isTeam && profile) navigate(`/profile/${profile.userId}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-200 group"
                >
                    <span>View More Details</span>
                    <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="p-6 border-t border-gray-50 text-center">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
            FCTMS Workspace • 2024
        </p>
      </div>
    </aside>
  );
};

export default ChatInfoPanel;
