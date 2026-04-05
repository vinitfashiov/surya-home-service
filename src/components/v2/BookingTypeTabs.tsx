export type BookingType = 'Instant' | 'Schedule' | 'Recurring';

interface BookingTypeTabsProps {
  activeType: BookingType;
  onChange: (type: BookingType) => void;
}

const types: BookingType[] = ['Instant', 'Schedule', 'Recurring'];

export default function BookingTypeTabs({ activeType, onChange }: BookingTypeTabsProps) {
  return (
    <div className="flex p-1 bg-[#F7F8F9] rounded-full border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`relative flex-1 py-3 text-[11px] font-bold rounded-full transition-all duration-200 z-10 ${
            activeType === type ? 'text-white bg-[#24423A] shadow-md' : 'text-[#718096] bg-transparent'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
