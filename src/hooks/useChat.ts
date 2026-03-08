import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export function useChatMessages(bookingId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chat-messages', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `booking_id=eq.${bookingId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', bookingId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, senderId, message }: { bookingId: string; senderId: string; message: string }) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ booking_id: bookingId, sender_id: senderId, message })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.booking_id] });
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, userId }: { bookingId: string; userId: string }) => {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('booking_id', bookingId)
        .neq('sender_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', vars.bookingId] });
    },
  });
}
