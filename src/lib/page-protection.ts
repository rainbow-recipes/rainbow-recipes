import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';

/**
 * Redirects to the login page if the user is not logged in.
 */
export const loggedInProtectedPage = (session: { user: { email: string; id: string; randomKey: string } } | null) => {
  if (!session) {
    redirect('/auth/signin');
  }
};

/**
 * Redirects to the login page if the user is not logged in.
 * Redirects to the not-authorized page if the user is not an admin.
 */
export const adminProtectedPage = (session: { user: { email: string; id: string; randomKey: string } } | null) => {
  loggedInProtectedPage(session);
  if (session && session.user.randomKey !== Role.ADMIN) {
    redirect('/not-authorized');
  }
};

/**
 * Redirects to the login page if the user is not logged in.
 * Redirects to the not-authorized page if the user is not a vendor.
 */
export const vendorProtectedPage = (session: { user: { email: string; id: string; randomKey: string } } | null) => {
  loggedInProtectedPage(session);
  if (session && session.user.randomKey !== Role.VENDOR) {
    redirect('/not-authorized');
  }
};
