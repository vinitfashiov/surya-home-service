import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ShoppingBag, CheckCircle2, ShoppingCart, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

export default function ProviderShop() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderPlaced, setOrderPlaced] = useState(false);

  const products: Product[] = [
    { id: 'p1', name: 'Surya Branded Uniform (T-Shirt)', price: 299, description: 'Premium cotton yellow uniform T-shirt with logo.', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60' },
    { id: 'p2', name: 'Standard Cleaning Material Kit', price: 599, description: 'Eco-friendly cleaning sprays, microfiber cloths & scrubbers.', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60' },
    { id: 'p3', name: 'Specialized Hand Tool Kit', price: 1299, description: 'Professional screwdrivers, drills, pliers & tester tools.', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60' },
  ];

  const handleQuantity = (id: string, delta: number) => {
    const nextQty = (cart[id] || 0) + delta;
    if (nextQty <= 0) {
      const nextCart = { ...cart };
      delete nextCart[id];
      setCart(nextCart);
    } else {
      setCart({ ...cart, [id]: nextQty });
    }
  };

  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find(p => p.id === id);
    return sum + (product?.price || 0) * qty;
  }, 0);

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) {
      toast.error('Kripya cart me products add karein');
      return;
    }

    toast.success('Ordering kit...');
    setTimeout(() => {
      setOrderPlaced(true);
      setCart({});
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-28">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b h-14 flex items-center px-4 justify-between z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/provider/profile')} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-heading font-bold text-base text-foreground flex items-center gap-1.5">
            <ShoppingBag className="h-5 w-5 text-primary" /> Item Khareedein (Shop)
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {orderPlaced ? (
          <Card className="border shadow-sm py-8 text-center space-y-4">
            <CardContent>
              <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-lg mt-4">Order Placed Successfully!</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto leading-relaxed">
                Your order has been logged. Branded kit tools will be delivered to your hub address within 3 working days.
              </p>
              <Button onClick={() => setOrderPlaced(false)} className="mt-6 text-xs font-semibold">
                Shop More
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const qty = cart[product.id] || 0;
              return (
                <Card key={product.id} className="overflow-hidden border shadow-sm flex">
                  <img src={product.image} alt={product.name} className="w-24 h-24 object-cover shrink-0 border-r" />
                  <div className="p-3 flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-foreground text-xs truncate">{product.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug truncate-2-lines">
                        {product.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-heading font-bold text-primary text-sm">₹{product.price}</span>
                      
                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border">
                          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md" onClick={() => handleQuantity(product.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-bold px-1">{qty}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md" onClick={() => handleQuantity(product.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" className="h-7 text-[10px] px-2.5 font-bold gap-1 rounded-lg" onClick={() => handleQuantity(product.id, 1)}>
                          <ShoppingCart className="h-3 w-3" /> Add to Cart
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Bottom Sheet */}
      {!orderPlaced && Object.keys(cart).length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 border-t backdrop-blur-md flex items-center justify-between z-40 max-w-lg mx-auto shadow-lg">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Amount</p>
            <p className="text-lg font-heading font-black text-foreground">₹{totalAmount}</p>
          </div>
          <Button className="h-11 px-6 text-xs font-bold gap-1.5" onClick={handleCheckout}>
            Place Order (₹{totalAmount})
          </Button>
        </div>
      )}
    </div>
  );
}
