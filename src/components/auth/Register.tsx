import React, { useState } from 'react';
import { useSound } from '../../context/SoundContext';

interface RegisterProps {
  onNavigateToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigateToLogin }) => {
  const { playSuccess } = useSound();

  const [fullName, setFullName] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [department, setDepartment] = useState('');
  const [accessRole, setAccessRole] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      playSuccess();

      setTimeout(() => {
        setIsSuccess(false);
        onNavigateToLogin();
      }, 2500);
    }, 1500);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center relative overflow-hidden font-sans w-full p-4 selection:bg-primary selection:text-on-primary">
      {/* Ambient Background Layer */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        data-alt="A dark, technical network map"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuClkZI6OCgDjMrorILENLdfTBTSbdvLsPFFJg68hSTjUUNcCAzh8pHVjVQE_XFjc00gx4Yd6-npVDlogIAb7hSbtFi0v0IId7Tvh8kHVj0exnYDSbMKL4OgshGpis4ZQGBbBYt2APudvZ_4XmK0PVF_lZBea8YKApJkLyjWCj0RfkYI68mKCraxCTrMkUjO9AZW9B0ZUOvqCUjv2Gyvr1I6W6brVrLSDu9ooz8OD6WLeeJWs7O_M7kiWA')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-background pointer-events-none"></div>

      {/* Registration Card Container */}
      <main className="relative z-10 w-full max-w-lg px-margin-mobile md:px-0 py-stack-lg flex flex-col gap-4 sm:gap-stack-lg">
        {/* Branding Header */}
        <div className="text-center flex flex-col items-center gap-1">
          <div className="h-16 w-16 bg-surface-container-lowest rounded-full border border-outline-variant/30 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(190,198,224,0.1)]">
            <span
              className="material-symbols-outlined text-[32px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              admin_panel_settings
            </span>
          </div>
          <h1 className="font-sans text-2xl md:text-3xl font-bold text-primary tracking-tight">
            PRANSETU S
          </h1>
          <p className="text-sm text-xs text-on-surface-variant uppercase tracking-widest">
            Operator Registration Protocol
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 md:p-8 shadow-lg backdrop-blur-sm flex flex-col gap-4 sm:gap-6">
          <div className="border-l-2 border-primary pl-3">
            <h2 className="font-sans text-lg md:text-xl font-bold text-on-surface">
              Request Access
            </h2>
            <p className="text-sm text-xs text-on-surface-variant">
              Submit credentials for EOC network authorization.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Personal Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs text-xs text-on-surface-variant uppercase font-sans"
                  htmlFor="fullName"
                >
                  Full Legal Name
                </label>
                <input
                  className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm text-xs sm:text-sm rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  id="fullName"
                  placeholder="e.g. Jane Doe"
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  className="text-xs text-xs text-on-surface-variant uppercase font-sans"
                  htmlFor="badgeId"
                >
                  Gov Badge ID
                </label>
                <input
                  className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm text-xs sm:text-sm rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-data-value"
                  id="badgeId"
                  placeholder="OD-EOC-####"
                  required
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                />
              </div>
            </div>

            {/* Department Dropdown */}
            <div className="flex flex-col gap-1">
              <label
                className="text-xs text-xs text-on-surface-variant uppercase font-sans"
                htmlFor="department"
              >
                Assigned Agency / Department
              </label>
              <div className="relative">
                <select
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm text-xs sm:text-sm rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors appearance-none cursor-pointer"
                  id="department"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option className="text-on-surface-variant" disabled value="">
                    Select operating unit...
                  </option>
                  <option value="odsma">ODSMA (Odisha State Disaster Management Auth)</option>
                  <option value="ndrf">NDRF (National Disaster Response Force)</option>
                  <option value="fire">State Fire &amp; Emergency Services</option>
                  <option value="health">Department of Health &amp; Family Welfare</option>
                  <option value="police">State Police / Traffic</option>
                  <option value="other">Other Appointed Agency</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">
                  arrow_drop_down
                </span>
              </div>
            </div>

            {/* Access Role Dropdown */}
            <div className="flex flex-col gap-1">
              <label
                className="text-xs text-xs text-on-surface-variant uppercase font-sans"
                htmlFor="accessRole"
              >
                Requested Access Role
              </label>
              <div className="relative">
                <select
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm text-xs sm:text-sm rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors appearance-none cursor-pointer"
                  id="accessRole"
                  required
                  value={accessRole}
                  onChange={(e) => setAccessRole(e.target.value)}
                >
                  <option className="text-on-surface-variant" disabled value="">
                    Select access role...
                  </option>
                  <option value="super_admin">Super Admin</option>
                  <option value="dmo">Disaster Management Officer</option>
                  <option value="eoc_operator">EOC Operator</option>
                  <option value="rescue_coordinator">Rescue Coordinator</option>
                  <option value="observer">Observer</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">
                  arrow_drop_down
                </span>
              </div>
            </div>

            {/* Contact Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs text-xs text-on-surface-variant uppercase font-sans"
                  htmlFor="phone"
                >
                  Secure Comm Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    call
                  </span>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm text-xs sm:text-sm rounded-lg pl-9 pr-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-data-value"
                    id="phone"
                    placeholder="+91"
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  className="text-xs text-xs text-on-surface-variant uppercase font-sans"
                  htmlFor="email"
                >
                  Official Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    mail
                  </span>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm text-xs sm:text-sm rounded-lg pl-9 pr-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    id="email"
                    placeholder="user@agency.gov.in"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Verification Notice (Callout) */}
            <div className="mt-1 bg-surface-variant border border-outline-variant/30 rounded-lg p-3 flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                policy
              </span>
              <div>
                <p className="font-data-value text-xs font-bold text-on-surface mb-0.5">
                  Authorization Required
                </p>
                <p className="text-sm text-[11px] text-on-surface-variant leading-relaxed">
                  Submission initiates a rigorous background verification via central dispatch. Account activation is not immediate and requires secondary clearance.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2 flex flex-col gap-3">
              <button
                disabled={isSubmitting}
                className={`w-full font-sans text-sm font-bold rounded-lg py-3 flex justify-center items-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${
                  isSuccess
                    ? 'bg-[#14532d] text-[#86efac]'
                    : isSubmitting
                    ? 'bg-primary opacity-80 pointer-events-none text-on-primary'
                    : 'bg-primary text-on-primary hover:bg-primary-fixed'
                }`}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                    <span>Processing...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span>Request Logged - Redirecting</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                    <span>Initiate Registration</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-xs text-on-surface-variant">
                  Already hold clearance?{' '}
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-primary hover:text-primary-fixed underline decoration-primary/50 underline-offset-4 transition-colors font-data-value font-bold ml-1 cursor-pointer"
                  >
                    Authenticate Here
                  </button>
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer / Meta Info */}
        <div className="text-center text-xs text-xs text-outline flex items-center justify-center gap-2 font-sans">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          SECURE END-TO-END ENCRYPTION (AES-256)
        </div>
      </main>
    </div>
  );
};
