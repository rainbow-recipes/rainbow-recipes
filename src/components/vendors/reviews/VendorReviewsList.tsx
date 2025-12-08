/* eslint-disable react/require-default-props */

'use client';

import { useState } from 'react';
import { Button } from 'react-bootstrap';
import Link from 'next/link';
import { Star, StarFill, TrashFill } from 'react-bootstrap-icons';

interface VendorReview {
  id: number;
  rating: number;
  review: string;
  owner: string;
  ownerName?: string | null;
  ownerFirstName?: string | null;
  ownerLastName?: string | null;
  ownerUserId?: string | null;
}

interface VendorReviewsListProps {
  reviews: VendorReview[];
  storeId: string;
  isLoggedIn: boolean;
  currentUserEmail?: string | null;
  userRole?: string | null;
  storeOwnerEmail?: string | null;
}

export default function VendorReviewsList({
  reviews,
  storeId,
  isLoggedIn,
  currentUserEmail = null,
  userRole = null,
  storeOwnerEmail = null,
}: VendorReviewsListProps) {
  const [reviewList, setReviewList] = useState(reviews);
  const [deleting, setDeleting] = useState<number | null>(null);

  const canDeleteReview = (reviewOwner: string) => currentUserEmail === reviewOwner || userRole === 'ADMIN';
  const isOwner = storeOwnerEmail && currentUserEmail && storeOwnerEmail === currentUserEmail;

  const handleDeleteReview = async (reviewId: number) => {
    // eslint-disable-next-line no-alert
    const response = window.confirm('Are you sure you want to delete this review?');
    if (!response) {
      return;
    }

    setDeleting(reviewId);
    try {
      const res = await fetch(`/api/reviews/vendor/${reviewId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        // eslint-disable-next-line no-alert
        window.alert(errData.error || 'Failed to delete review');
        return;
      }

      setReviewList(reviewList.filter((r) => r.id !== reviewId));
    } catch (err: any) {
      // eslint-disable-next-line no-alert
      window.alert(err.message || 'An error occurred while deleting the review.');
    } finally {
      setDeleting(null);
    }
  };
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          Reviews (
          {reviewList.length}
          )
        </h5>
        {isLoggedIn && !isOwner && (
          <Link href={`/vendors/${storeId}/review`}>
            <Button variant="primary" size="sm">Add Review</Button>
          </Link>
        )}
      </div>
      {reviewList.length > 0 ? (
        reviewList.map((review) => (
          <div key={review.id} className="border rounded p-3 mb-3">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="text-warning" style={{ display: 'flex', lineHeight: 0 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i}>{i < review.rating ? <StarFill /> : <Star />}</span>
                    ))}
                  </span>
                  <span className="text-muted">
                    {`(${review.rating}/5)`}
                  </span>
                </div>
                {review.ownerUserId ? (
                  <Link href={`/profile/${review.ownerUserId}`} className="text-decoration-none small text-muted">
                    {review.ownerFirstName && review.ownerLastName
                      ? `${review.ownerFirstName} ${review.ownerLastName}`
                      : review.ownerFirstName || review.ownerName || review.owner}
                  </Link>
                ) : (
                  <span className="small text-muted">
                    {review.ownerFirstName && review.ownerLastName
                      ? `${review.ownerFirstName} ${review.ownerLastName}`
                      : review.ownerFirstName || review.ownerName || review.owner}
                  </span>
                )}
              </div>
              {canDeleteReview(review.owner) && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDeleteReview(review.id)}
                  disabled={deleting === review.id}
                  aria-label="Delete review"
                >
                  <TrashFill size={16} />
                </button>
              )}
            </div>
            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{review.review}</p>
          </div>
        ))
      ) : (
        <div className="text-muted">
          {isLoggedIn
            ? 'No reviews yet. Be the first to review!'
            : 'No reviews yet. Sign in and be the first to review!'}
        </div>
      )}
    </>
  );
}
