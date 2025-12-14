'use client';

/* eslint-disable jsx-a11y/label-has-associated-control */
import { FormEvent, useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams?.get('callbackUrl') ?? '/recipes';
  const errorParam = searchParams?.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam ? 'Invalid credentials. Please try again.' : null,
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    setSubmitting(false);

    if (!result || result.error) {
      setError('Invalid email or password.');
      return;
    }

    router.push(callbackUrl);
  };

  return (
    <div className="container my-5" style={{ maxWidth: 480 }}>
      <h2 className="mb-4 text-center">Sign in</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-success w-100 mb-3"
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="text-center">
        <span>Don&apos;t have an account? </span>
        <Link href="/signup">Sign up</Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={(
        <div className="d-flex justify-content-center align-items-center py-5">
          <span>Loading…</span>
        </div>
      )}
    >
      <SignInForm />
    </Suspense>
  );
}
