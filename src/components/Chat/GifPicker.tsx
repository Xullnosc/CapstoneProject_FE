import React, { useState, useEffect } from 'react';

interface GifPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const GIPHY_API_KEY = "0GYkZUcS1D9rKRTC5wnWL7DoJAFbu3Pq";

type GiphyGif = {
  id: string;
  title: string;
  images: {
    fixed_height_small: { url: string };
    fixed_height: { url: string };
  };
};

type GiphyResponse = {
  data?: GiphyGif[];
};

const GifPicker: React.FC<GifPickerProps> = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGifs = async (query: string) => {
    setLoading(true);
    try {
      const endpoint = query 
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${query}&limit=12&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12&rating=g`;
        
      const response = await fetch(endpoint);
      const result = (await response.json()) as GiphyResponse;
      setGifs(result.data ?? []);
    } catch (error) {
      console.error('Failed to fetch GIFs from Giphy', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGifs(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="absolute bottom-20 left-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 italic">Search GIPHY</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      
      <div className="relative mb-3">
        <input 
          type="text" 
          placeholder="Search Giphy..." 
          className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500/20 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-2 h-60 overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center h-full text-slate-400 text-xs italic">
            Fetching from Giphy...
          </div>
        ) : gifs.length > 0 ? (
          gifs.map((gif) => (
            <img 
              key={gif.id}
              src={gif.images.fixed_height_small.url} 
              alt={gif.title}
              className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity bg-slate-100"
              onClick={() => onSelect(gif.images.fixed_height.url)}
            />
          ))
        ) : (
          <div className="col-span-2 text-center py-10 text-slate-400 text-xs">No GIFs found</div>
        )}
      </div>
      
      <div className="mt-3 flex items-center justify-center gap-1">
         <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Powered By</span>
         <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Giphy-logo.svg/2560px-Giphy-logo.svg.png" 
          alt="Giphy" 
          className="h-3.5 grayscale opacity-50 transition-all hover:grayscale-0 hover:opacity-100"
        />
      </div>
    </div>
  );
};

export default GifPicker;
