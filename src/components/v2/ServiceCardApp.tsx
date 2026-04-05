import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceCardAppProps {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  discountPrice?: number;
  tag?: string;
  onAddClick?: (id: string) => void;
}

export default function ServiceCardApp({ id, name, imageUrl, price, tag, onAddClick }: ServiceCardAppProps) {
  return (
    <div className="flex flex-col relative w-full group">
      <Link to={`/service/${id}`} className="block">
        <div className="w-full aspect-square rounded-2xl bg-[#F7F8F9] overflow-hidden relative mb-2">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-[#E2E8F0] flex items-center justify-center">
              <span className="text-[#A0AEC0] text-xs font-medium">No image</span>
            </div>
          )}

          {tag && (
            <div className="absolute top-1.5 left-1.5 bg-[#FF5722] text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">
              {tag}
            </div>
          )}
        </div>
      </Link>

      <button
        className="absolute bottom-[26px] right-0 w-7 h-7 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#1DA653] z-10 hover:bg-[#1DA653] hover:text-white transition-colors active:scale-95"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddClick?.(id);
        }}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <div className="px-0.5">
        <h3 className="text-[11px] sm:text-xs font-bold text-[#1F2937] leading-tight line-clamp-2">
          {name}
        </h3>
        {price != null && price > 0 && (
          <p className="text-[10px] sm:text-[11px] font-semibold text-[#1DA653] mt-0.5">
            ₹{price.toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </div>
  );
}
