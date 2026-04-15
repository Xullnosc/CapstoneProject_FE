import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Info, MessageSquare, Loader2 } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { type ChatMessageDto, type ConversationDto, type TeamChatInfoDto } from '../../types/studentInteraction';
import ChatSidebar from '../../components/Chat/ChatSidebar';
import ChatMessage from '../../components/Chat/ChatMessage';
import ChatInput from '../../components/Chat/ChatInput';
import ChatInfoPanel from '../../components/Chat/ChatInfoPanel';
import { useChat } from '../../contexts/useChat';
import { jwtUtils } from '../../utils/jwtUtils';

const ChatPage: React.FC = () => {
  const { 
    isConnected, onlineUsers, conversations, teams,
    sendDirectMessage, sendTeamMessage, markAsRead, 
    joinConversation, leaveConversation,
    registerMessageHandler, unregisterMessageHandler, refreshLists
  } = useChat();

  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [activeConv, setActiveConv] = useState<{ id?: number; teamId?: number } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const currentUserId = useMemo(() => jwtUtils.getUserId(), []);

  // Handle incoming messages for history update
  const onMessageReceived = useCallback((message: ChatMessageDto) => {
    const isForActiveConv = 
        (message.conversationId && message.conversationId === activeConv?.id) ||
        (message.teamId && message.teamId === activeConv?.teamId);
    
    if (isForActiveConv) {
        setMessages(prev => {
            if (prev.some(m => m.messageId === message.messageId)) return prev;
            return [message, ...prev]; // Prepend for flex-col-reverse
        });
    }
  }, [activeConv]);

  useEffect(() => {
    registerMessageHandler('ChatPage', onMessageReceived);
    return () => unregisterMessageHandler('ChatPage');
  }, [onMessageReceived, registerMessageHandler, unregisterMessageHandler]);

  // URL Sync
  useEffect(() => {
     const convId = searchParams.get('id');
     const teamId = searchParams.get('teamId');
     if (convId && parseInt(convId) !== activeConv?.id) setActiveConv({ id: parseInt(convId) });
     else if (teamId && parseInt(teamId) !== activeConv?.teamId) setActiveConv({ teamId: parseInt(teamId) });
  }, [activeConv?.id, activeConv?.teamId, searchParams]);

  const handleSelectChat = useCallback((conv: { id?: number; teamId?: number }) => {
      setActiveConv(conv);
      if (conv.id) setSearchParams({ id: conv.id.toString() });
      else if (conv.teamId) setSearchParams({ teamId: conv.teamId.toString() });
  }, [setSearchParams]);

  // Auto-resolve target user from URL (Discovery redirect)
  useEffect(() => {
    const state = location.state as { targetUserId?: string | number } | null;
    const targetUserId = searchParams.get('targetUserId') || state?.targetUserId;
    if (targetUserId) {
        const resolveTarget = async () => {
            try {
                const { semesterService } = await import('../../services/semesterService');
                const sem = await semesterService.getCurrentSemester();
                if (sem) {
                    const conv = await chatService.getOrCreateConversation(parseInt(String(targetUserId), 10), sem.semesterId);
                    setResolvedConv(conv);
                    await refreshLists();
                    handleSelectChat({ id: conv.conversationId });
                }
            } catch (e) { console.error("Failed to resolve target", e); }
        };
        resolveTarget();
    }
  }, [handleSelectChat, location.state, refreshLists, searchParams]);

  // Room management
  useEffect(() => {
    if (!isConnected || !activeConv?.id) return;
    joinConversation(activeConv.id);
    return () => { if (activeConv.id) leaveConversation(activeConv.id); };
  }, [activeConv?.id, isConnected, joinConversation, leaveConversation]);

  // Fetch History
  useEffect(() => {
    if (!activeConv || (!activeConv.id && !activeConv.teamId)) return;
    
    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const history = await chatService.getChatHistory(activeConv.id, activeConv.teamId);
            setMessages(history); // Keep descending order for flex-col-reverse
            await markAsRead(activeConv.id, activeConv.teamId);
        } catch (error) { console.error('Failed to fetch chat history', error); }
        finally { setLoadingHistory(false); }
    };
    fetchHistory();
  }, [activeConv, markAsRead]);

  const handleSendMessage = async (content: string) => {
    if (!activeConv) return;
    try {
      if (activeConv.teamId) await sendTeamMessage(activeConv.teamId, content);
      else if (activeConv.id) await sendDirectMessage(activeConv.id, content);
      
      // Local echo is handled by sending message moving to top in Context
    } catch (error) { console.error('Failed to send message', error); }
  };

  const [resolvedConv, setResolvedConv] = useState<ConversationDto | undefined>(undefined);

  const activeInfo = useMemo(() => {
    if (activeConv?.teamId) {
        return teams.find(t => t.teamId === activeConv.teamId);
    }
    const fromList = conversations.find(c => c.conversationId === activeConv?.id);
    return fromList || (resolvedConv?.conversationId === activeConv?.id ? resolvedConv : undefined);
  }, [activeConv, teams, conversations, resolvedConv]);

  const isOtherUserOnline = useMemo(() => {
    if (!activeConv || activeConv.teamId) return false;
    const otherId = (activeInfo as ConversationDto)?.otherUserId;
    return onlineUsers.includes(otherId);
  }, [activeConv, activeInfo, onlineUsers]);

  return (
    <main className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-white selection:bg-[#F27123]/20">
      <div className="w-[28%] min-w-[340px] h-full flex flex-col">
        <ChatSidebar 
          conversations={conversations} 
          teams={teams}
          activeConv={activeConv || undefined}
          onSelect={handleSelectChat}
        />
      </div>

      <section className="flex-1 flex flex-col h-full bg-white relative">
        {activeConv ? (
          <>
            <header className="h-20 px-8 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer overflow-hidden">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ring-4 ring-orange-50 transition-all hover:scale-105 overflow-hidden ${activeConv.teamId ? 'bg-orange-100 text-[#F27123]' : 'bg-[#F27123]'}`}>
                    {activeConv.teamId ? (
                        (activeInfo as TeamChatInfoDto)?.teamAvatar ? <img src={(activeInfo as TeamChatInfoDto).teamAvatar} className="w-full h-full object-cover" alt="Team" /> : <span className="font-bold text-lg">{(activeInfo as TeamChatInfoDto)?.teamName?.charAt(0) || 'T'}</span>
                    ) : (
                        (activeInfo as ConversationDto)?.otherUserAvatar ? <img src={(activeInfo as ConversationDto).otherUserAvatar} className="w-full h-full object-cover" alt="User" /> : <span className="font-bold text-xl">{(activeInfo as ConversationDto)?.otherUserName?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  {(isOtherUserOnline || activeConv.teamId) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900 leading-tight mb-0.5">
                    {activeConv.teamId ? (activeInfo as TeamChatInfoDto)?.teamName : (activeInfo as ConversationDto)?.otherUserName}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOtherUserOnline || activeConv.teamId ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${isOtherUserOnline || activeConv.teamId ? 'text-green-600' : 'text-gray-400'}`}>
                      {isOtherUserOnline || activeConv.teamId ? 'Active Now' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowInfoPanel(!showInfoPanel)} className={`p-2.5 rounded-xl transition-all border ${showInfoPanel ? 'text-[#F27123] bg-orange-50 border-orange-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-100'}`}>
                <Info size={22} />
              </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col-reverse custom-scrollbar bg-white">
                  {messages.map((msg, index) => (
                      <ChatMessage 
                        key={msg.messageId} 
                        message={msg} 
                        isMe={Number(msg.senderId) === Number(currentUserId)}
                        showAvatar={index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId}
                      />
                    ))}
                  {loadingHistory && <div className="flex justify-center items-center py-6"><Loader2 className="animate-spin text-[#F27123]" size={24} /></div>}
                </div>
                <div className="px-8 pb-6 bg-white"><ChatInput onSendMessage={handleSendMessage} isLoading={loadingHistory} /></div>
              </div>
              {showInfoPanel && <ChatInfoPanel activeConv={activeConv} activeInfo={activeInfo} onClose={() => setShowInfoPanel(false)} />}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/30">
             <div className="p-8 rounded-full bg-white shadow-xl shadow-gray-100 border border-gray-50 mb-8 animate-bounce-slow"><MessageSquare size={80} strokeWidth={1.5} className="text-[#F27123]/20" /></div>
             <h3 className="text-xl font-bold text-gray-400 mb-2">Workspace Messages</h3>
             <p className="text-sm font-medium text-gray-400/80 max-w-[280px] text-center leading-relaxed">Connect with your team members or start a private conversation below.</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default ChatPage;
