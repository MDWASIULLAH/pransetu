import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import type { Role } from '../../types/role';

interface LoginProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onNavigateToRegister
}) => {
  const { login } = useAuth();
  const { playSuccess } = useSound();

  const [role, setRole] = useState<string>('officer');
  const [badgeId, setBadgeId] = useState('OP-8492');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const roleMapping: Record<string, Role> = {
    super_admin: 'SUPER_ADMIN',
    officer: 'DISASTER_MANAGEMENT_OFFICER',
    operator: 'EOC_OPERATOR',
    coordinator: 'RESCUE_COORDINATOR',
    observer: 'OBSERVER'
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    const targetRole = roleMapping[role] || 'DISASTER_MANAGEMENT_OFFICER';

    setTimeout(() => {
      login(targetRole);
      playSuccess();
      setIsAuthenticating(false);
      onLoginSuccess();
    }, 1000);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center relative overflow-hidden selection:bg-primary selection:text-on-primary font-sans w-full p-4">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subdued tech background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          data-alt="Technical digital command center network map"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC4vcUS8ADbiwpilytsIf5yz5CcTILmTqR80qoAQbnquD9_NV02EcIrGMY0ryGC0PapJEua4JhEkRmTEDiqSiiGIBf4AsfkK-6-TDwcp4EX6J-nHQHYfNl5O6_ZaSPh-2KbkSzScWXJOjW_qJskAiBEifrHUEsv8poBLqQ_mgGXHTvya6Bzc7HmUr4PRqDKIaBoB7EaWYJret1dk0wz-wQ4TCZPD7sFXzq8gF1_l1G7Pn0V6ACmdpfLwg')"
          }}
        ></div>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundSize: '40px 40px',
            backgroundImage:
              'linear-gradient(to right, rgba(69, 70, 77, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(69, 70, 77, 0.1) 1px, transparent 1px)'
          }}
        ></div>
        {/* Radial gradient to focus on the center */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#051424_70%)] z-10"></div>
      </div>

      {/* Main Content Container */}
      <main className="relative z-20 w-full max-w-[420px] px-margin-mobile md:px-0 py-8">
        {/* Login Card */}
        <div className="bg-[#1c2b3c]/85 backdrop-blur-xl border border-outline-variant rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Top Accent Bar */}
          <div className="h-1 w-full bg-primary"></div>
          <div className="p-6 md:p-8 flex flex-col gap-5">
            {/* Header / Brand */}
            <div className="text-center flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-lg bg-surface-container-lowest border border-outline-variant flex items-center justify-center mb-2 shadow-inner">
                <span className="material-symbols-outlined text-[28px] text-primary icon-fill">
                  security
                </span>
              </div>
              <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-primary tracking-tight">
                PRANSETU S
              </h1>
              <p className="font-body-sm text-xs text-on-surface-variant uppercase tracking-widest">
                EOC Access Gateway
              </p>
            </div>

            {/* Warning Banner */}
            <div className="bg-error-container/20 border border-error-container/50 rounded-lg p-3 flex items-start gap-3">
              <span className="material-symbols-outlined text-error mt-0.5 icon-fill text-[20px] shrink-0">
                warning
              </span>
              <p className="font-body-sm text-xs text-on-error-container leading-relaxed">
                <strong>Restricted Area.</strong> Authorized EOC personnel only. All access attempts are logged and monitored.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              {/* Access Role Input */}
              <div className="flex flex-col gap-1">
                <label
                  className="font-data-label text-xs text-on-surface-variant uppercase font-mono"
                  htmlFor="access_role"
                >
                  Access Level / Role
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-[18px]">
                    admin_panel_settings
                  </span>
                  <select
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-3 font-data-value text-xs sm:text-sm text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                    id="access_role"
                    name="access_role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="officer">Disaster Management Officer</option>
                    <option value="operator">EOC Operator</option>
                    <option value="coordinator">Rescue Coordinator</option>
                    <option value="observer">Observer</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Badge ID Input */}
              <div className="flex flex-col gap-1">
                <label
                  className="font-data-label text-xs text-on-surface-variant uppercase font-mono"
                  htmlFor="badge_id"
                >
                  Badge ID / Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-[18px]">
                    badge
                  </span>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-3 font-data-value text-xs sm:text-sm text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    id="badge_id"
                    name="badge_id"
                    placeholder="e.g. OP-8492"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    required
                    type="text"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1">
                <label
                  className="font-data-label text-xs text-on-surface-variant uppercase flex justify-between font-mono"
                  htmlFor="password"
                >
                  <span>Security Key</span>
                  <button
                    type="button"
                    onClick={() => alert('Password reset protocol initiated. Contact EOC SysAdmin: +91 674-2534177')}
                    className="text-primary hover:text-tertiary-fixed transition-colors font-medium cursor-pointer"
                  >
                    Forgot?
                  </button>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-[18px]">
                    key
                  </span>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-10 font-data-value text-xs sm:text-sm text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me & Submit */}
              <div className="pt-2 flex flex-col gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer appearance-none w-4 h-4 border border-outline-variant rounded bg-surface-container-lowest checked:bg-primary checked:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer"
                      type="checkbox"
                    />
                    <span className="material-symbols-outlined absolute text-[14px] text-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none icon-fill">
                      check
                    </span>
                  </div>
                  <span className="font-body-sm text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">
                    Maintain secure session
                  </span>
                </label>

                <button
                  disabled={isAuthenticating}
                  className="w-full bg-primary hover:bg-primary-fixed border border-transparent text-on-primary font-headline-sm text-sm font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(190,198,224,0.15)] hover:shadow-[0_0_20px_rgba(190,198,224,0.3)] cursor-pointer disabled:opacity-75"
                  type="submit"
                >
                  {isAuthenticating ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">
                        progress_activity
                      </span>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Secure Login</span>
                      <span className="material-symbols-outlined text-[20px]">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer Area */}
          <div className="bg-surface-container border-t border-outline-variant p-4 text-center">
            <p className="font-body-sm text-xs text-on-surface-variant">
              No active credentials?{' '}
              <button
                onClick={onNavigateToRegister}
                className="text-primary hover:text-tertiary-fixed underline underline-offset-2 transition-colors font-medium cursor-pointer ml-1"
              >
                Request Access
              </button>
            </p>
          </div>
        </div>

        {/* Environmental Context / Footer text outside card */}
        <div className="mt-6 text-center opacity-60 flex flex-col items-center gap-1">
          <p className="font-data-label text-[11px] text-on-surface-variant uppercase font-mono">
            J-NET Node: Alpha-Prime // SysStatus: Optimal
          </p>
          <p className="font-body-sm text-[11px] text-on-surface-variant">
            © 2026 Odisha State Disaster Management Authority.
          </p>
        </div>
      </main>
    </div>
  );
};
