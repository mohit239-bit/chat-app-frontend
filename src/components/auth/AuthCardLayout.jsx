import { MdChatBubbleOutline } from 'react-icons/md';

const FloatingOrbs = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <div className="animate-float-slow absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />
    <div className="animate-float-slow absolute -top-20 -right-24 h-[350px] w-[350px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', animationDelay: '-7s' }} />
    <div className="animate-float-slow absolute -bottom-40 -left-20 h-[380px] w-[380px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #c084fc 0%, transparent 70%)', animationDelay: '-13s' }} />
  </div>
);

const AuthCardLayout = ({ title, subtitle, children }) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-primary-50/40 to-accent-400/10 px-4 py-10">
    <FloatingOrbs />
    <main className="relative z-10 w-full max-w-md animate-fade-in-up">
      <div className="mb-7 text-center">
        <MdChatBubbleOutline className="animate-float mx-auto mb-4 h-15 w-15 text-primary-500 drop-shadow-lg" />
        <h1 className="text-4xl font-black tracking-tight"><span className="bg-gradient-to-r from-primary-700 via-primary-500 to-accent-500 bg-clip-text text-transparent">TALK</span><span className="text-text-primary">HUB</span></h1>
        <h2 className="mt-5 text-2xl font-bold text-text-primary">{title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
      </div>
      <section className="glass-card rounded-2xl p-7 shadow-xl sm:p-9">{children}</section>
    </main>
  </div>
);

export default AuthCardLayout;
