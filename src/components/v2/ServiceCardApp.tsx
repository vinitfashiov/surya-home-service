import { Plus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceCardAppProps {
  id: string;
  name: string;
  imageUrl?: string;
  startingPrice?: number;
  rating?: number;
  tag?: string;
  onAddClick?: (id: string) => void;
}

export default function ServiceCardApp({ id, name, imageUrl, startingPrice, rating, tag, onAddClick }: ServiceCardAppProps) {
  const displayPrice = Number(startingPrice || 0);

  return (
    <div className="flex flex-col relative w-full group">
      <Link to={`/service/${id}`} className="block">
        <div className="w-full aspect-square rounded-2xl bg-[#F7F8F9] overflow-hidden relative mb-2 shadow-sm">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-[#E2E8F0] flex items-center justify-center text-gray-400 font-medium text-[10px]">Vibe</div>
          )}

          {tag && (
            <div className="absolute top-1.5 left-1.5 bg-[#FF5722] text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">
              {tag}
            </div>
          )}

          {rating != null && rating > 0 && (
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm z-10">
              <Star className="w-2.5 h-2.5 text-[#FF9800] fill-current" />
              <span className="text-[9px] font-bold text-[#1F2937]">{rating}</span>
            </div>
          )}
        </div>
      </Link>

      <button
        className="absolute bottom-[28px] right-0 w-7 h-7 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#1DA653] z-10 hover:bg-[#1DA653] hover:text-white transition-colors active:scale-95"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddClick?.(id);
        }}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <div className="px-0.5">
        <h3 className="text-[11px] sm:text-xs font-bold text-[#1F2937] leading-tight line-clamp-2 min-h-[2.4em]">
          {name}
        </h3>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[8px] text-gray-400 font-medium uppercase">From</span>
          <p className="text-[11px] sm:text-[12px] font-bold text-[#1DA653]">
            ₹{displayPrice > 0 ? displayPrice.toLocaleString('en-IN') : '...'}
          </p>
        </div>
      </div>
    </div>
  );
}
