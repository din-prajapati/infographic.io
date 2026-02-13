import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';

export default function AuthCallbackPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      navigate('/auth');
      return;
    }

    window.history.replaceState({}, '', '/auth/callback');

    fetch('/api/v1/auth/google/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Authentication failed');
        return res.json();
      })
      .then((data) => {
        login(data.user, data.token);
        navigate('/templates');
      })
      .catch(() => {
        setError('Sign in failed. Please try again.');
        setTimeout(() => navigate('/auth'), 2000);
      });
  }, [login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        {error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
            <p className="text-white/70 text-sm">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
}
