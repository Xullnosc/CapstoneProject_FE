import React from 'react';
import { type ChatMessageDto } from '../../types/studentInteraction';
import { FileText, Download, CheckCheck } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageDto;
  isMe: boolean;
  showAvatar?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMe, showAvatar = true }) => {
  return (
    <div className={`flex items-end gap-3 w-full animate-fade-in mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Container */}
      {!isMe && (
        <div className={`flex-shrink-0 mb-1 w-9 h-9 ${!showAvatar ? 'opacity-0 select-none pointer-events-none' : 'opacity-100'}`}>
          {message.senderAvatar ? (
            <img 
              className="w-9 h-9 rounded-xl object-cover shadow-sm ring-2 ring-white" 
              src={message.senderAvatar} 
              alt={message.senderName} 
            />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm bg-slate-300">
              <span className="text-xs font-bold">{message.senderName.charAt(0)}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Message Content Area */}
      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && showAvatar && (
          <span className="text-[11px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider">
            {message.senderName}
          </span>
        )}
        
        <div className={`
          px-4 py-2.5 shadow-sm text-[14px] leading-relaxed relative
          transition-all duration-200
          ${isMe 
            ? 'bg-[#F27123] text-white rounded-2xl rounded-br-[4px]' 
            : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-[4px]'}
        `}>
          {(() => {
            const isImageUrl = (url: string) => {
                return url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null || 
                       url.includes('media.tenor.com') || 
                       url.includes('giphy.com/media');
            };

            if (isImageUrl(message.content)) {
                return (
                    <div className="my-1 rounded-lg overflow-hidden border border-black/5">
                        <img 
                            src={message.content} 
                            alt="Sent image" 
                            className="max-w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                            loading="lazy"
                            onClick={() => window.open(message.content, '_blank')}
                        />
                    </div>
                );
            }
            return <p className="whitespace-pre-wrap">{message.content}</p>;
          })()}
          
          {message.attachmentUrl && (
            <div className={`mt-2.5 p-2.5 rounded-xl border flex items-center gap-3 ${isMe ? 'bg-white/15 border-white/20' : 'bg-white border-gray-200'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-gray-50'}`}>
                <FileText size={18} className={isMe ? 'text-white' : 'text-gray-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-bold truncate ${isMe ? 'text-white' : 'text-gray-800'}`}>{message.attachmentName || 'Document'}</p>
                <p className={`text-[10px] ${isMe ? 'text-white/70' : 'text-gray-400'}`}>Click to download</p>
              </div>
              <a 
                href={message.attachmentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isMe ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <Download size={18} />
              </a>
            </div>
          )}
        </div>
        
        {/* Metadata */}
        <div className={`flex items-center gap-1.5 mt-1 px-1`}>
          <span className="text-[10px] text-gray-400 font-medium">
            {new Date(
              message.createdAt.endsWith('Z') ? message.createdAt : `${message.createdAt}Z`
            ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMe && <CheckCheck size={14} className="text-[#F27123]" />}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
