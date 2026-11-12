import { useEffect, useRef } from 'react';

declare global {
  interface Window { google?: any }
}

const API = import.meta.env.VITE_API_URL as string;            // e.g. http://localhost:4000
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export interface AppUser { id: string; name: string; email: string; picture: string | null; role: 'STUDENT' | 'ADMIN' }

// Authenticated fetch helper: attaches the JWT issued by our backend.
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  const json = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error(json?.error?.message || 'Request failed');
  return json as T;
}

export default function GoogleLoginButton({ onSuccess, onError }: { onSuccess: (u: AppUser, isNew: boolean) => void; onError?: (e: Error) => void }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }: { credential: string }) => {
          try {
            const r = await api<{ token: string; user: AppUser; isNewUser: boolean }>('/auth/google', {
              method: 'POST',
              body: JSON.stringify({ credential }),
            });
            localStorage.setItem('token', r.token);
            onSuccess(r.user, r.isNewUser);
          } catch (e) {
            onError?.(e as Error);
          }
        },
      });
      window.google.accounts.id.renderButton(box.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 280 });
    };
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return <div ref={box} />;
}
