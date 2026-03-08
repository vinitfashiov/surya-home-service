import { useAuthContext } from '@/contexts/AuthContext';
import AddressManager from '@/components/AddressManager';

export default function MyAddressesPage() {
  const { user } = useAuthContext();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Please log in to manage your addresses.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-heading font-bold text-foreground">My Addresses</h1>
      <p className="text-muted-foreground mt-1">Manage your saved addresses</p>
      <div className="mt-8">
        <AddressManager userId={user.id} />
      </div>
    </div>
  );
}
