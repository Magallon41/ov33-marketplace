import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptsMarketing, setAcceptsMarketing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to page they came from or account page
  const from = location.state?.from?.pathname || '/account';

  const translateAuthError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Este correo electrónico ya está registrado.';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico es inválido.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil. Debe tener al menos 8 caracteres.';
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'El correo electrónico o la contraseña son incorrectos.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Por favor, inténtalo más tarde.';
      default:
        return 'Ha ocurrido un error al autenticar. Por favor verifica tus datos.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isResetMode) {
      if (!email) {
        setError('Por favor ingresa tu correo electrónico.');
        return;
      }
      try {
        setIsSubmitting(true);
        await resetPassword(email);
        setSuccess('¡Instrucciones enviadas! Revisa tu bandeja de entrada para restablecer tu contraseña.');
      } catch (err) {
        console.error(err);
        setError(err.code ? translateAuthError(err.code) : (err.message || 'Error al enviar el correo de recuperación.'));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email || !password || (!isLogin && !name)) {
      setError('Por favor complete todos los campos.');
      return;
    }

    if (!isLogin && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres por seguridad.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isLogin) {
        const user = await login(email, password);
        setSuccess(`¡Bienvenido de vuelta, ${user.name || 'Socio'}!`);
        setTimeout(() => {
          if (user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate(from);
          }
        }, 1000);
      } else {
        await register(name, email, password, acceptsMarketing);
        setSuccess('¡Cuenta creada con éxito! Se ha enviado un correo de verificación. Iniciando sesión...');
        setTimeout(() => {
          navigate(from);
        }, 2500);
      }
    } catch (err) {
      console.error(err);
      setError(err.code ? translateAuthError(err.code) : (err.message || 'Ha ocurrido un error.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="pt-24 min-h-screen flex flex-col md:flex-row bg-[#f9f9f9]">
      {/* Left Column: Marketplace banner */}
      <div className="hidden md:flex md:w-1/2 relative bg-slate-950 items-center justify-center overflow-hidden h-[calc(100vh-96px)] min-h-[600px]">
        <div className="absolute inset-0 z-0 opacity-40 hover:scale-105 transition-transform duration-1000">
          <img 
            className="w-full h-full object-cover brightness-75" 
            alt="OV33 Marketplace Shopping" 
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&auto=format&fit=crop&q=80"
          />
        </div>
        <div className="relative z-10 px-16 text-left max-w-lg text-white">
          <div className="inline-flex items-center gap-2 bg-orange-500 text-white font-black text-xl px-3 py-1 rounded-xl mb-4 shadow-lg shadow-orange-500/30">
            OV33 MARKET
          </div>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-4 tracking-tight">
            Grandes Marcas, Precios Irresistibles
          </h2>
          <div className="w-16 h-1 bg-orange-500 mb-6 rounded-full"></div>
          <p className="text-sm text-slate-200 font-medium leading-relaxed">
            Únete a OV33 para acceder a cupones exclusivos de bienvenida, seguimiento de envíos en tiempo real y ofertas relámpago todos los días.
          </p>
        </div>
      </div>

      {/* Right Column: Elegant Auth Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 h-[calc(100vh-96px)] min-h-[600px] overflow-y-auto">
        <div className="w-full max-w-[420px] bg-white p-10 md:p-12 shadow-sm border border-neutral-100 transition-all duration-500">
          <header className="mb-10 text-center">
            <h1 className="font-display-xl text-[26px] uppercase tracking-wide mb-2">
              {isResetMode ? 'Recuperar Contraseña' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </h1>
            <p className="font-body-md text-xs text-secondary tracking-widest uppercase">
              {isResetMode 
                ? 'Ingresa tu correo para recibir las instrucciones' 
                : (isLogin ? 'Ingresa a tu cuenta exclusiva' : 'Regístrate en la vanguardia')}
            </p>
          </header>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs py-3 px-4 mb-6 border-l-2 border-red-500 font-body-md flex justify-between items-center animate-[shake_0.5s_ease]">
              <span>{error}</span>
              <button onClick={() => setError('')} className="hover:text-red-950 font-bold">×</button>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-800 text-xs py-3 px-4 mb-6 border-l-2 border-emerald-500 font-body-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {!isLogin && !isResetMode && (
              <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-none outline-none py-2 text-sm uppercase font-body-md tracking-wide"
                  placeholder="EJ. JESÚS MARTÍNEZ"
                />
              </div>
            )}

            <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
              <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md tracking-wide"
                placeholder="EJ. USUARIO@EDVICTORY.COM"
                required
              />
            </div>

            {!isResetMode && (
              <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">
                  Contraseña {!isLogin && '(Mínimo 8 caracteres)'}
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md tracking-wide"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            )}

            {!isLogin && !isResetMode && (
              <div className="flex items-start gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="acceptsMarketing"
                  checked={acceptsMarketing}
                  onChange={(e) => setAcceptsMarketing(e.target.checked)}
                  className="mt-1 w-4 h-4 cursor-pointer accent-black border border-neutral-300 rounded focus:ring-black"
                />
                <label htmlFor="acceptsMarketing" className="font-body-md text-[11px] text-neutral-500 cursor-pointer select-none leading-relaxed">
                  Deseo recibir ofertas, lanzamientos y cupones de descuento exclusivos de OV33 Market por correo electrónico.
                </label>
              </div>
            )}

            {isLogin && !isResetMode && (
              <div className="text-right">
                <button 
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setError('');
                    setSuccess('');
                  }} 
                  className="font-label-caps text-[10px] text-neutral-400 hover:text-amber-600 transition-colors underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 font-button text-button uppercase tracking-widest hover:bg-neutral-800 transition-all hover:shadow-lg transform active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting 
                ? 'PROCESANDO...' 
                : (isResetMode ? 'ENVIAR CORREO DE RECUPERACIÓN' : (isLogin ? 'INICIAR SESIÓN' : 'REGISTRARME'))}
            </button>
          </form>

          <footer className="mt-10 border-t border-neutral-100 pt-6 text-center">
            {isResetMode ? (
              <button 
                onClick={() => {
                  setIsResetMode(false);
                  setError('');
                  setSuccess('');
                }}
                className="font-label-caps text-[11px] text-black hover:text-amber-600 transition-colors uppercase tracking-widest font-bold underline"
              >
                Volver al Inicio de Sesión
              </button>
            ) : (
              <>
                <p className="font-body-md text-xs text-secondary mb-2">
                  {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                </p>
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                  }}
                  className="font-label-caps text-[11px] text-black hover:text-amber-600 transition-colors uppercase tracking-widest font-bold underline"
                >
                  {isLogin ? 'Crear Cuenta Nueva' : 'Inicia Sesión Aquí'}
                </button>
              </>
            )}
          </footer>
        </div>
      </div>
    </main>
  );
}

