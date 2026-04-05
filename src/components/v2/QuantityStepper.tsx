import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  quantity: number;
  label?: string; // e.g. "bathrooms", "staircase"
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function QuantityStepper({ quantity, label, onIncrease, onDecrease }: QuantityStepperProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 mt-1">
      <div className="flex items-center justify-between w-[80px] h-8 bg-white border border-[#E2E8F0] rounded-[10px] px-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <button 
          onClick={onDecrease}
          disabled={quantity <= 0}
          className="w-5 h-5 flex items-center justify-center text-[#1DA653] disabled:text-gray-300"
        >
          <Minus className="h-3 w-3" strokeWidth={3} />
        </button>
        
        <span className="text-[13px] font-bold text-[#1F2937] tabular-nums">
          {quantity}
        </span>
        
        <button 
          onClick={onIncrease}
          className="w-5 h-5 flex items-center justify-center text-[#1DA653]"
        >
          <Plus className="h-3 w-3" strokeWidth={3} />
        </button>
      </div>
      
      {label && (
        <span className="text-[8px] text-[#A0AEC0] font-bold tracking-wide mt-0.5">
          {label}
        </span>
      )}
    </div>
  );
}
