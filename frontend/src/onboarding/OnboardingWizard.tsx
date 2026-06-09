import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Sparkles, Check, ChevronRight, RefreshCw, X } from 'lucide-react';

interface OnboardingWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [repoName, setRepoName] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('weekly');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.includes('/')) {
      setErrorMsg("Please enter in format 'owner/repo' (e.g. facebook/react)");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/repositories/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ full_name: repoName, frequency })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('selectedRepoId', data.repository_id.toString());
        window.dispatchEvent(new Event('storage')); // trigger navbar update
        setStep(3); // Go to success step
      } else {
        const data = await response.json();
        setErrorMsg(data.detail || 'Failed to submit repository scan.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend server. Ensure API is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="w-full max-w-lg overflow-hidden glass-panel relative bg-slate-950/80 border border-slate-800 rounded-2xl shadow-2xl"
      >
        {/* Skip button */}
        <button 
          onClick={handleFinish}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/55 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-title text-white">Welcome to Ecosystem Intelligence</h2>
                    <p className="text-xs text-slate-400">Let's set up your custom workspace in a few simple steps.</p>
                  </div>
                </div>

                <div className="text-sm text-slate-300 space-y-4">
                  <p>
                    Developer Ecosystem Health Analyzer evaluates the structural viability, security vulnerability metrics, and maintenance velocity of your open-source dependency portfolio.
                  </p>
                  <p>
                    To begin displaying operations intelligence, we need to register and scan at least one target repository.
                  </p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-xl font-bold font-title text-white">Register Your First Repository</h2>
                  <p className="text-xs text-slate-400">Enter a public GitHub project path to initiate scan logs.</p>
                </div>

                {errorMsg && (
                  <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">GitHub Repository Path</label>
                    <div className="relative flex items-center">
                      <GitBranch size={16} className="absolute left-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        placeholder="e.g. owner/repository"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">Analysis Scan Interval</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="daily">Daily scan updates</option>
                      <option value="weekly">Weekly scan updates</option>
                      <option value="monthly">Monthly scan updates</option>
                    </select>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <span>Analyze Repo</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center gap-6"
              >
                <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/15 animate-bounce">
                  <Check size={36} />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold font-title text-white">Repository Scan Scheduled!</h2>
                  <p className="text-sm text-slate-400 max-w-sm">
                    We've registered <b>{repoName}</b> and triggered the initial analysis pipeline in the background. Metrics will populate shortly.
                  </p>
                </div>

                <button
                  onClick={handleFinish}
                  className="mt-2 w-full py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
                >
                  Enter Workspace Console
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
