import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Check, Sparkles } from 'lucide-react';

// Password policy (mirrors/stricter-than UserController::store min:8 so the client can never fire a 422):
// ≥8 chars + at least one uppercase, one number, and one special character.
const pwRules = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
  special: /[^A-Za-z0-9]/.test(pw),
});

// Crypto-strong generator that is GUARANTEED to satisfy every rule above.
const generateStrongPassword = () => {
  const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const L = 'abcdefghijkmnpqrstuvwxyz';
  const N = '23456789';
  const S = '!@#$%^&*-_=+?';
  const all = U + L + N + S;
  const rnd = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const pick = (s) => s[rnd(s.length)];
  const chars = [pick(U), pick(L), pick(N), pick(S)];      // one of each required class
  while (chars.length < 16) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {             // Fisher–Yates shuffle
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

const PwRuleRow = ({ ok, children }) => (
  <li className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
    {ok ? <Check size={12} className="shrink-0" /> : <X size={12} className="shrink-0" />}
    {children}
  </li>
);

export default function UserForm({ mode, data, onClose, onSubmit, onChange, groups, roles }) {
  // Grey out Save until the form's required fields pass native validation.
  const formRef = useRef(null);
  const [canSave, setCanSave] = useState(false);
  const syncValidity = () => setCanSave(!!formRef.current && formRef.current.checkValidity());
  useEffect(() => { syncValidity(); }); // after every render (covers open/prefill)

  // Password is controlled so we can validate complexity in real time + drive the Generate button.
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);

  const checks = pwRules(password);
  const pwComplete = Object.values(checks).every(Boolean);
  // Create: a valid password is mandatory. Edit: blank = keep current; if typed it must still be valid.
  const pwOk = mode === 'add' ? pwComplete : (password === '' || pwComplete);
  // Show the rule checklist upfront on create, or as soon as the admin types/edits on edit.
  const showRules = mode === 'add' || password.length > 0;

  const handleGenerate = () => {
    setPassword(generateStrongPassword());
    setShowPassword(true);
    setPwTouched(true);
    onChange?.({ target: formRef.current }); // flag the unsaved-changes guard
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Hard gate: never let an invalid password reach the backend (no 422 round-trip).
    if (!pwOk) { setPwTouched(true); return; }
    const formData = new FormData(e.target);
    const submitData = Object.fromEntries(formData);
    // The field is named full_name (a control named "name" shadows the form's DOM `form.name`);
    // remap back to the API key the backend expects.
    submitData.name = submitData.full_name;
    delete submitData.full_name;
    // Edit + blank password → omit it so the backend keeps the current one (update() treats it nullable).
    if (!submitData.password) delete submitData.password;
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-modal shadow-modal border border-gray-200 dark:border-theme w-full max-w-[450px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-theme">
          <h3 className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            {mode === 'add' ? '➕ Create User' : '✏️ Edit User'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700">
            <X size={18} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} onChange={(e) => { onChange?.(e); syncValidity(); }} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Full Name</label>
            <input name="full_name" required defaultValue={data?.name} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="e.g. John Doe" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Email</label>
            <input type="email" name="email" required defaultValue={data?.email} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors" placeholder="john@example.com" />
          </div>

          {/* Password — required on create, optional on edit (blank keeps current). */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">
                Password {mode === 'add' && <span className="text-rose-500">*</span>}
              </label>
              <button type="button" onClick={handleGenerate} className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                <Sparkles size={12} /> Generate
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwTouched(true); }}
                required={mode === 'add'}
                autoComplete="new-password"
                placeholder={mode === 'add' ? 'Enter a strong password' : 'Leave blank to keep current'}
                className={`w-full px-3 py-2 pr-10 border bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 transition-colors ${pwTouched && !pwOk ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/40 focus:border-rose-500' : 'border-slate-300 dark:border-theme focus:ring-blue-500/50 focus:border-blue-500'}`}
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {showRules && (
              <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                <PwRuleRow ok={checks.length}>At least 8 characters</PwRuleRow>
                <PwRuleRow ok={checks.upper}>One uppercase letter</PwRuleRow>
                <PwRuleRow ok={checks.number}>One number</PwRuleRow>
                <PwRuleRow ok={checks.special}>One special character</PwRuleRow>
              </ul>
            )}
            {mode === 'edit' && password === '' && (
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">Leave blank to keep the current password.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Group</label>
              <select name="groupId" required defaultValue={data?.groupId} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors">
                <option value="">Select Group</option>
                {groups.filter(g => !g.deletedAt).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Role</label>
              <select name="roleId" required defaultValue={data?.roleId} className="w-full px-3 py-2 border border-slate-300 dark:border-theme bg-white dark:bg-page text-slate-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors">
                <option value="">Select Role</option>
                {roles.filter(r => !r.deletedAt).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300 mb-1">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300 cursor-pointer">
                <input type="radio" name="status" value="Active" defaultChecked={mode === 'add' || data?.status === 'Active'} className="text-blue-600 focus:ring-blue-500 bg-page border-theme" /> Active
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300 cursor-pointer">
                <input type="radio" name="status" value="Disabled" defaultChecked={mode === 'edit' && data?.status === 'Disabled'} className="text-blue-600 focus:ring-blue-500 bg-page border-theme" /> Disabled
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100 dark:border-theme gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-input transition-colors">Cancel</button>
            <button type="submit" disabled={!canSave || !pwOk} className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-input transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600">
              {mode === 'add' ? 'Save' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
