import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatMessages, useSendMessage, useMarkMessagesRead } from '@/hooks/useChat';
import { Send, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  userId: string;
  otherPartyName?: string;
}

export default function ChatDialog({ open, onOpenChange, bookingId, userId, otherPartyName = 'Other Party' }: ChatDialogProps) {
  const { data: messages = [], isLoading } = useChatMessages(open ? bookingId : undefined);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark messages as read when opening
  useEffect(() => {
    if (open && bookingId && userId) {
      markRead.mutate({ bookingId, userId });
    }
  }, [open, bookingId, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate({ bookingId, senderId: userId, message: trimmed });
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col h-[70vh] max-h-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5 text-primary" />
            Chat with {otherPartyName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
          <div className="py-4 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading messages…</p>}
            {!isLoading && messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
            )}
            {messages.map((msg: any) => {
              const isMine = msg.sender_id === userId;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="px-4 pb-4 pt-2 border-t flex gap-2">
          <Input
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!text.trim() || sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
