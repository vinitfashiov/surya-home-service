import { Headset } from 'lucide-react';

const SUPPORT_PHONE = '+916205178716';

// Always-visible support button for the partner app; sits above the mobile bottom nav
export default function ProviderHelpFab() {
  return (
    <a
      href={`tel:${SUPPORT_PHONE}`}
      aria-label="मदद चाहिए? सपोर्ट को कॉल करें"
      className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 z-50 flex items-center gap-2 rounded-full bg-primary pl-3.5 pr-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform hover:scale-105 active:scale-95"
    >
      <Headset className="h-5 w-5" />
      मदद चाहिए?
    </a>
  );
}
