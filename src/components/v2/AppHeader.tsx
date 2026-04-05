import { User, ChevronDown } from 'lucide-react';
import { useCityStore } from '@/lib/cityStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AppHeader() {
  const { selectedCityName } = useCityStore();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  return (
    <header className="bg-[#1DA653] pt-12 pb-5 px-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-[42px] h-[42px] bg-white rounded-xl text-[#1DA653] font-bold leading-none shadow-sm pb-0.5">
            <span className="text-[17px] tracking-tight">10</span>
            <span className="text-[8px] uppercase tracking-wider font-extrabold">mins</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-white font-bold text-[16px]">{selectedCityName || 'Select City'}</span>
              <ChevronDown className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-white/80 text-[11px] truncate max-w-[220px] font-medium leading-tight">
              {selectedCityName ? `Serving in ${selectedCityName}` : 'Find services in your area'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-800 shadow-sm overflow-hidden"
        >
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="Profile" />
          ) : (
            <User className="h-[22px] w-[22px]" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </header>
  );
}
