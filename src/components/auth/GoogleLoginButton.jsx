import { useEffect, useRef, useState } from 'react';

let googleScriptPromise;

const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Google sign-in could not be loaded'));
    document.head.appendChild(script);
  });
  return googleScriptPromise;
};

const GoogleLoginButton = ({ onCredential, disabled = false }) => {
  const buttonRef = useRef(null);
  const [loadError, setLoadError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const configurationError = clientId ? '' : 'Google sign-in is not configured.';

  useEffect(() => {
    let active = true;
    if (!clientId) return undefined;

    loadGoogleIdentity()
      .then(() => {
        if (!active || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredential(response.credential),
          ux_mode: 'popup',
          auto_select: false,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: buttonRef.current.clientWidth || 320,
        });
      })
      .catch((error) => active && setLoadError(error.message));

    return () => {
      active = false;
    };
  }, [clientId, onCredential]);

  if (configurationError || loadError) return <p className="text-center text-xs font-medium text-red-500">{configurationError || loadError}</p>;
  return <div ref={buttonRef} className={disabled ? 'pointer-events-none opacity-60' : ''} />;
};

export default GoogleLoginButton;
