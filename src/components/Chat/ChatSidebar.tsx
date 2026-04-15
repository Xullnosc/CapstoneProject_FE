import React, { useState } from 'react';
import { Search, Users, User } from 'lucide-react';
import { type ConversationDto, type TeamChatInfoDto } from '../../types/studentInteraction';
import { useChat } from '../../contexts/useChat';

interface ChatSidebarProps {
  conversations: ConversationDto[];
  teams: TeamChatInfoDto[];
  activeConv?: { id?: number; teamId?: number };
  onSelect: (conv: { id?: number; teamId?: number }) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ conversations, teams, activeConv, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { onlineUsers } = useChat();

  const safeGetTime = (dateStr?: string) => {
    if (!dateStr) return 0;
    const time = Date.parse(dateStr);
    return isNaN(time) ? 0 : time;
  };

  const sortedTeams = React.useMemo(() => {
    return [...teams]
      .filter(t => t.teamName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => safeGetTime(b.lastMessageAt) - safeGetTime(a.lastMessageAt));
  }, [teams, searchTerm]);

  const sortedConvs = React.useMemo(() => {
    return [...conversations]
      .filter(c => c.otherUserName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => safeGetTime(b.lastMessageAt) - safeGetTime(a.lastMessageAt));
  }, [conversations, searchTerm]);

  return (
    <aside className="w-full h-full bg-gray-50 flex flex-col border-r border-gray-200/60 shadow-inner">
      {/* Sidebar Header */}
      <div className="p-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Messages</h2>
        </div>
        
        {/* Search Bar */}
        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F27123] transition-colors" size={16} />
            <input 
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100/80 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-[#F27123]/20 transition-all outline-none"
            />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
        {/* Teams Section */}
        {sortedTeams.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400/80">
                <span>Team Hubs</span>
                <span className="bg-gray-200/50 px-1.5 py-0.5 rounded text-[10px]">{sortedTeams.length}</span>
            </div>
            {sortedTeams.map((team) => (
              <button
                key={team.teamId}
                onClick={() => onSelect({ teamId: team.teamId })}
                className={`w-full group flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ${
                  activeConv?.teamId === team.teamId 
                  ? 'bg-white shadow-md shadow-gray-200/50 ring-1 ring-gray-100' 
                  : 'hover:bg-blue-50/50'
                }`}
              >
                <div className="relative">
                    {team.teamAvatar ? (
                        <img src={team.teamAvatar} alt={team.teamName} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-[#F27123] shadow-sm">
                            <Users size={22} />
                        </div>
                    )}
                    {/* For Teams, we could show if there's active activity, or just a static design */}
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`text-[14px] truncate transition-colors ${activeConv?.teamId === team.teamId ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {team.teamName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                        {team.lastMessageAt ? new Date(team.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[12px] truncate flex-1 ${activeConv?.teamId === team.teamId ? 'text-gray-500 py-0.5' : 'text-gray-400'}`}>
                        {team.lastMessage || 'Start a team huddle...'}
                    </p>
                    {team.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] rounded-full bg-[#F27123] text-white px-1.5 font-bold ml-2 shadow-sm shadow-orange-200">
                            {team.unreadCount}
                        </span>
                    )}
                  </div>
                </div>
                {activeConv?.teamId === team.teamId && (
                    <div className="w-1.5 h-6 bg-[#F27123] rounded-full ml-1 shadow-sm"></div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Direct Messages Section */}
        <div className="space-y-1">
          <div className="px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400/80">
              <span>Direct Chats</span>
              <span className="bg-gray-200/50 px-1.5 py-0.5 rounded text-[10px]">{sortedConvs.length}</span>
          </div>
          {sortedConvs.map((conv) => {
            const isOnline = onlineUsers.includes(conv.otherUserId);
            
            return (
              <button
                key={conv.conversationId}
                onClick={() => onSelect({ id: conv.conversationId })}
                className={`w-full group flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ${
                  activeConv?.id === conv.conversationId 
                  ? 'bg-white shadow-md shadow-gray-200/50 ring-1 ring-gray-100' 
                  : 'hover:bg-blue-50/50'
                }`}
              >
                <div className="relative">
                    {conv.otherUserAvatar ? (
                      <img className="w-12 h-12 rounded-xl object-cover shadow-sm" src={conv.otherUserAvatar} alt={conv.otherUserName} />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 shadow-sm">
                        <User size={22} />
                      </div>
                    )}
                    {/* Real-time Status Indicator */}
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                </div>

                <div className="ml-0.5 flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`text-[14px] truncate transition-colors ${activeConv?.id === conv.conversationId ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {conv.otherUserName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                      {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[12px] truncate flex-1 ${activeConv?.id === conv.conversationId ? 'text-gray-500 py-0.5' : 'text-gray-400'}`}>
                      {conv.lastMessage || 'Say hello...'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F27123] ml-2 shadow-sm shadow-orange-200 animate-pulse"></div>
                    )}
                  </div>
                </div>
                {activeConv?.id === conv.conversationId && (
                  <div className="w-1.5 h-6 bg-[#F27123] rounded-full ml-1 shadow-sm"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};


export default ChatSidebar;
