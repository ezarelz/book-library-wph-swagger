'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { reviewsApi } from '@/lib/api/reviewsApi';

interface GiveReviewModalProps {
  bookId: number;
  open: boolean;
  onClose: () => void;
}

export default function GiveReviewModal({
  bookId,
  open,
  onClose,
}: GiveReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const queryClient = useQueryClient();
  const toast = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: reviewsApi.createReview,
    onSuccess: () => {
      toast.success('Review submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['borrowed-list'] });
      onClose();
      // Reset form
      setRating(0);
      setComment('');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit review');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    mutate({ bookId, star: rating, comment });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold'>Give Review</DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-6 py-4'>
          <div className='flex flex-col items-center gap-2'>
            <h3 className='text-sm font-medium text-gray-700'>Give Rating</h3>
            <div className='flex gap-1'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type='button'
                  className='focus:outline-none transition-transform hover:scale-110'
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder='Please share your thoughts about this book'
            className='min-h-[150px] resize-none rounded-xl border-gray-200 p-4 text-sm focus-visible:ring-blue-500'
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <Button
            className='w-full rounded-full bg-blue-600 py-6 text-base font-semibold hover:bg-blue-700'
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
