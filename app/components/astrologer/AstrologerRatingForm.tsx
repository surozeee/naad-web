'use client';

import { FormEvent, useState } from 'react';
import Swal from 'sweetalert2';
import { HoroscopeRatingSelect } from '@/app/horoscope/components/HoroscopeRatingSelect';
import { astrologerReviewApi } from '@/app/lib/astrologer-review.service';

type Props = {
  astrologerId: string;
  astrologerName: string;
  meetingId?: string;
  onSubmitted?: () => void;
};

export default function AstrologerRatingForm({
  astrologerId,
  astrologerName,
  meetingId,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating == null) {
      await Swal.fire({ icon: 'warning', text: 'Please select a star rating.' });
      return;
    }
    setSubmitting(true);
    try {
      await astrologerReviewApi.create({
        astrologerId,
        rating,
        comment: comment.trim() || undefined,
        meetingId,
      });
      await Swal.fire({
        icon: 'success',
        title: 'Thank you',
        text: `Your review for ${astrologerName} has been submitted.`,
        timer: 2200,
        showConfirmButton: false,
      });
      setRating(undefined);
      setComment('');
      onSubmitted?.();
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        text: err instanceof Error ? err.message : 'Could not submit review.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="naad-astro-rate-form" onSubmit={(e) => void handleSubmit(e)}>
      <HoroscopeRatingSelect
        label="Your rating"
        value={rating}
        onChange={setRating}
        required
        className="!border-0 !py-0"
      />
      <label className="naad-astro-rate-field">
        <span>Your review (optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Share what helped you in this session…"
        />
      </label>
      <button type="submit" className="naad-btn-primary" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
