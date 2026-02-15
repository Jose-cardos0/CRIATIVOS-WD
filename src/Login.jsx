import { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-credential': 'Email ou senha incorretos.',
        'auth/invalid-email': 'Email inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      };
      setError(messages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Digite seu email acima para recuperar a senha.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'Nenhuma conta com este email.',
        'auth/invalid-email': 'Email inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      };
      setError(messages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h1.5m0 0V8.25m0 3.75v3.75M6 12h1.5m0 0V6m0 6v6m3-6h1.5m0 0V9m0 3v3m3-3h1.5m0 0V7.5m0 4.5v4.5m3-4.5h1.5m0 0V9.75m0 2.25v2.25M21 12h1.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Criativos WD</h1>
          <p className="text-sm text-dark-400 mt-1">Phase Inverter + Audio White</p>
        </div>

        {/* Card de login */}
        <div className="glass-card p-8">
          {!showReset ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-6 text-center">Entrar</h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-dark-300">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="input-field text-sm"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-dark-300">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="input-field text-sm"
                    required
                    minLength={6}
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setShowReset(true); setError(''); setResetSent(false); }}
                  className="text-xs text-dark-400 hover:text-indigo-400 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-2 text-center">Recuperar senha</h2>
              <p className="text-xs text-dark-400 text-center mb-6">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>

              {resetSent ? (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-center">
                    <p className="text-sm text-green-400 font-medium">Email enviado!</p>
                    <p className="text-xs text-dark-400 mt-1">Verifique sua caixa de entrada e spam.</p>
                  </div>
                  <button
                    onClick={() => { setShowReset(false); setResetSent(false); setError(''); }}
                    className="btn-primary w-full py-3 text-sm font-semibold"
                  >
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-dark-300">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="input-field text-sm"
                      required
                      autoComplete="email"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      'Enviar link de recuperacao'
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setShowReset(false); setError(''); }}
                      className="text-xs text-dark-400 hover:text-indigo-400 transition-colors"
                    >
                      Voltar ao login
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-dark-600 mt-6">
          Criativos WD - Phase Inverter + Audio White Generator
        </p>
      </div>
    </div>
  );
}
