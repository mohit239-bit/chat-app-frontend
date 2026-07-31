import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdPersonOutline } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import AuthCardLayout from './AuthCardLayout';
import GoogleLoginButton from './GoogleLoginButton';

const errorMessage = (error, fallback) => error.response?.data?.message || error.response?.data || fallback;

const Register = () => {
  const [details, setDetails] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(details);
      toast.success('Your account is ready');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, 'Unable to create your account.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(async (credential) => {
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success('Account created with Google');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, 'Google sign-in failed.'));
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle, navigate]);

  return (
    <AuthCardLayout title="Create your account" subtitle="Set up your profile, then start chatting.">
      <form onSubmit={submit} className="space-y-5">
        <label className="block space-y-1.5"><span className="text-sm font-semibold text-text-primary">Name</span><span className="relative block"><MdPersonOutline className="absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" size={19} /><input required minLength="2" maxLength="80" value={details.name} onChange={(event) => setDetails((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" autoComplete="name" className="focus-ring w-full rounded-xl border border-primary-100 bg-white/80 py-3.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-primary-400" /></span></label>
        <label className="block space-y-1.5"><span className="text-sm font-semibold text-text-primary">Email</span><span className="relative block"><MdEmail className="absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" size={19} /><input required type="email" value={details.email} onChange={(event) => setDetails((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" autoComplete="email" className="focus-ring w-full rounded-xl border border-primary-100 bg-white/80 py-3.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-primary-400" /></span></label>
        <label className="block space-y-1.5"><span className="text-sm font-semibold text-text-primary">Password</span><span className="relative block"><MdLock className="absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" size={19} /><input required type="password" minLength="8" maxLength="72" value={details.password} onChange={(event) => setDetails((current) => ({ ...current, password: event.target.value }))} placeholder="At least 8 characters" autoComplete="new-password" className="focus-ring w-full rounded-xl border border-primary-100 bg-white/80 py-3.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-primary-400" /></span><span className="block text-xs text-text-muted">Use at least one letter and one number.</span></label>
        <button disabled={loading} type="submit" className="focus-ring w-full rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60">{loading ? 'Creating account...' : 'Create account'}</button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-text-muted"><span className="h-px flex-1 bg-primary-100" />or continue with<span className="h-px flex-1 bg-primary-100" /></div>
      <GoogleLoginButton onCredential={handleGoogleCredential} disabled={loading} />
      <p className="mt-7 text-center text-sm text-text-secondary">Already have an account? <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Sign in</Link></p>
    </AuthCardLayout>
  );
};

export default Register;
