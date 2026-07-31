import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">Loading your session...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

export default PublicOnlyRoute;
