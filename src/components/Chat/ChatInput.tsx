import React, { useState, useRef } from 'react';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import { PlusCircle, Smile, Image as ImageIcon, Send } from 'lucide-react';
import GifPicker from './GifPicker';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onSendFile?: (file: File) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSendMessage(text);
    setText('');
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText(prev => prev + emojiData.emoji);
  };

  const handleSendGif = (url: string) => {
    onSendMessage(url); 
    setShowGifPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-0 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
           <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)}></div>
           <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 italic">
             <EmojiPicker 
               onEmojiClick={onEmojiClick} 
               theme={Theme.LIGHT}
               width={320}
               height={400}
               lazyLoadEmojis={true}
             />
           </div>
        </div>
      )}

      {/* GIF Picker Popup */}
      {showGifPicker && (
        <React.Fragment>
          <div className="fixed inset-0 z-40" onClick={() => setShowGifPicker(false)}></div>
          <GifPicker 
            onSelect={handleSendGif} 
            onClose={() => setShowGifPicker(false)} 
          />
        </React.Fragment>
      )}

      <div className="flex items-center gap-4 bg-white rounded-2xl px-5 py-3 shadow-lg shadow-gray-100 border border-gray-100 focus-within:ring-4 focus-within:ring-[#F27123]/5 focus-within:border-[#F27123]/20 transition-all duration-300">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-400 hover:text-[#F27123] transition-colors p-1"
          disabled={isLoading}
          title="Send file"
        >
          <PlusCircle size={22} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={() => {}}
        />
        
        <input 
          className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-[14px] py-1 placeholder:text-gray-400 font-medium" 
          placeholder="Type a message or paste a link..." 
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        <div className="flex items-center gap-1">
          {/* Emoji Button */}
          <button 
            type="button"
            className={`p-2 rounded-xl transition-all ${showEmojiPicker ? 'text-[#F27123] bg-orange-50' : 'text-gray-400 hover:text-[#F27123] hover:bg-gray-50'}`}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowGifPicker(false);
            }}
          >
            <Smile size={20} />
          </button>

          {/* GIF Button */}
          <button 
            type="button"
            className={`p-2 rounded-xl transition-all ${showGifPicker ? 'text-[#F27123] bg-orange-50' : 'text-gray-400 hover:text-[#F27123] hover:bg-gray-50'}`}
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
            }}
          >
            <ImageIcon size={20} />
          </button>

          <div className="w-px h-6 bg-gray-100 mx-2"></div>
          
          <button 
            onClick={handleSend}
            disabled={!text.trim() || isLoading}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all duration-300
              ${text.trim() && !isLoading 
                ? 'bg-[#F27123] hover:bg-[#D95F1A] hover:scale-105 active:scale-95 shadow-orange-200' 
                : 'bg-gray-200 cursor-not-allowed shadow-none'}
            `}
          >
            <Send size={18} strokeWidth={2.5} className={text.trim() ? 'ml-0.5' : ''} />
          </button>
        </div>
      </div>
      
      <div className="mt-3 flex justify-center animate-fade-in">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">Enter</kbd> to transmit your message
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
