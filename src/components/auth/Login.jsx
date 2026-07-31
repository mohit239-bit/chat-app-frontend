import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdEmail, MdLock } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import AuthCardLayout from './AuthCardLayout';
import GoogleLoginButton from './GoogleLoginButton';

const errorMessage = (error, fallback) => error.response?.data?.message || error.response?.data || fallback;

const Login = () => {
  const [details, setDetails] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname || '/';

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(details);
      toast.success('Welcome back!');
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, 'Unable to sign in.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(async (credential) => {
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success('Signed in with Google');
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, 'Google sign-in failed.'));
    } finally {
      setLoading(false);
    }
  }, [destination, loginWithGoogle, navigate]);

  return (
    <AuthCardLayout title="Welcome back" subtitle="Sign in to join your conversations.">
      <form onSubmit={submit} className="space-y-5">
        <label className="block space-y-1.5"><span className="text-sm font-semibold text-text-primary">Email</span><span className="relative block"><MdEmail className="absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" size={19} /><input required type="email" value={details.email} onChange={(event) => setDetails((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" autoComplete="email" className="focus-ring w-full rounded-xl border border-primary-100 bg-white/80 py-3.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-primary-400" /></span></label>
        <label className="block space-y-1.5"><span className="text-sm font-semibold text-text-primary">Password</span><span className="relative block"><MdLock className="absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" size={19} /><input required type="password" value={details.password} onChange={(event) => setDetails((current) => ({ ...current, password: event.target.value }))} placeholder="Your password" autoComplete="current-password" className="focus-ring w-full rounded-xl border border-primary-100 bg-white/80 py-3.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-primary-400" /></span></label>
        <button disabled={loading} type="submit" className="focus-ring w-full rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-text-muted"><span className="h-px flex-1 bg-primary-100" />or continue with<span className="h-px flex-1 bg-primary-100" /></div>
      <GoogleLoginButton onCredential={handleGoogleCredential} disabled={loading} />
      <p className="mt-7 text-center text-sm text-text-secondary">New to TalkHub? <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">Create an account</Link></p>
    </AuthCardLayout>
  );
};

export default Login;
