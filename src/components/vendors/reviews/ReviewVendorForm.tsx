'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Form, Button, Alert } from 'react-bootstrap';

interface ReviewVendorFormProps {
  storeId: string;
}

type ReviewFormValues = {
  rating: string;
  review: string;
};

export default function ReviewVendorForm({ storeId }: ReviewVendorFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<ReviewFormValues>({ mode: 'onChange' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (data: ReviewFormValues) => {
    setError(null);
    setSuccess(null);

    try {
      const ratingNum = Number(data.rating);

      if (ratingNum < 1 || ratingNum > 5) {
        setError('Rating must be between 1 and 5.');
        return;
      }

      const res = await fetch('/api/reviews/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          rating: ratingNum,
          review: data.review,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit review');
      }

      setSuccess('Review submitted successfully!');
      reset();
      router.push(`/vendors/${storeId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your review.');
    }
  };

  return (
    <div className="review-vendor-form">
      <h3>Write a Review</h3>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Group className="mb-3" controlId="rating">
          <Form.Label>Rating (1-5)</Form.Label>
          <Form.Control
            type="number"
            min="1"
            max="5"
            step="1"
            placeholder="Enter rating (1-5)"
            {...register('rating', {
              required: 'Rating is required',
              min: { value: 1, message: 'Rating must be at least 1' },
              max: { value: 5, message: 'Rating must be at most 5' },
            })}
            isInvalid={!!errors.rating}
          />
          <Form.Control.Feedback type="invalid">
            {errors.rating?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="review">
          <Form.Label>Review</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Share your thoughts about this vendor..."
            {...register('review', {
              required: 'Review text is required',
              minLength: { value: 10, message: 'Review must be at least 10 characters' },
            })}
            isInvalid={!!errors.review}
          />
          <Form.Control.Feedback type="invalid">
            {errors.review?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </Form>
    </div>
  );
}
