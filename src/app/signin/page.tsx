/* eslint-disable react/require-default-props */
// src/app/signin/page.tsx
import { Suspense } from 'react';
import SignInForm from './SignInForm';

interface SignInPageProps {
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  const callbackUrlParam = searchParams?.callbackUrl;
  const errorParam = searchParams?.error;

  const callbackUrl = Array.isArray(callbackUrlParam)
    ? callbackUrlParam[0]
    : callbackUrlParam;

  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  return (
    <Suspense
      fallback={(
        <div className="d-flex justify-content-center align-items-center py-5">
          <span>Loading…</span>
        </div>
      )}
    >
      <SignInForm
        callbackUrl={callbackUrl ?? '/recipes'}
        errorParam={error ?? null}
      />
    </Suspense>
  );
}
