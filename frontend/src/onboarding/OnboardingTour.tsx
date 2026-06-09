import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, ArrowLeft } from 'lucide-react';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: 'right' | 'bottom' | 'left' | 'top';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'sidebar-nav',
    title: 'Workspace Navigation Hub',
    description: 'Use the sidebar to navigate between analytics dashboards. Track dependency heatmaps, security CVEs, contributor networks, and forecast trends.',
    position: 'right'
  },
  {
    targetId: 'navbar-repo-selector',
    title: 'Active Repository Context',
    description: 'Switch the focus of your dashboards by selecting any of your registered GitHub repositories from this dropdown.',
    position: 'bottom'
  },
  {
    targetId: 'navbar-scan-btn',
    title: 'On-Demand Scanner',
    description: 'Trigger immediate background jobs to fetch metadata, analyze commits, audit manifests, and re-calculate ecosystem health metrics.',
    position: 'bottom'
  }
];

export const OnboardingTour: React.FC = () => {
  const [active, setActive] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    // Check if onboarding completed
    const tourDone = localStorage.getItem('tour_completed') === 'true';
    const hasRepo = localStorage.getItem('selectedRepoId');
    if (!tourDone && hasRepo) {
      // Small delay to let DOM elements render completely
      const timer = setTimeout(() => {
        setActive(true);
        updateCoords(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update target element positions
  const updateCoords = (index: number) => {
    const step = TOUR_STEPS[index];
    if (!step) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
      // Scroll into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      // Element not in DOM yet (e.g. page loading)
      setCoords(null);
    }
  };

  useEffect(() => {
    if (!active) return;

    const handleResize = () => updateCoords(stepIndex);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    // Check periodically for target elements (robust fallback)
    const checkElInterval = setInterval(() => {
      if (!coords) {
        updateCoords(stepIndex);
      }
    }, 1000);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      clearInterval(checkElInterval);
    };
  }, [active, stepIndex, coords]);

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      updateCoords(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      const prevIndex = stepIndex - 1;
      setStepIndex(prevIndex);
      updateCoords(prevIndex);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('tour_completed', 'true');
    setActive(false);
  };

  if (!active || !coords) return null;

  const currentStep = TOUR_STEPS[stepIndex];

  // Calculate tooltip placement offsets
  const getTooltipStyle = () => {
    const padding = 12;
    switch (currentStep.position) {
      case 'right':
        return {
          top: coords.top + coords.height / 2 - 100, // rough center
          left: coords.left + coords.width + padding,
        };
      case 'bottom':
        return {
          top: coords.top + coords.height + padding,
          left: coords.left + coords.width / 2 - 160, // center horizontally
        };
      case 'left':
        return {
          top: coords.top + coords.height / 2 - 100,
          left: coords.left - 320 - padding,
        };
      case 'top':
        return {
          top: coords.top - 200 - padding,
          left: coords.left + coords.width / 2 - 160,
        };
    }
  };

  return (
    <div className="absolute inset-0 z-[90] pointer-events-none">
      {/* Dimmed backdrop highlight portal */}
      <div 
        className="fixed inset-0 bg-slate-950/45 mix-blend-multiply transition-opacity duration-300 pointer-events-auto"
        style={{ clipPath: `polygon(
          0% 0%, 
          0% 100%, 
          ${coords.left}px 100%, 
          ${coords.left}px ${coords.top}px, 
          ${coords.left + coords.width}px ${coords.top}px, 
          ${coords.left + coords.width}px ${coords.top + coords.height}px, 
          ${coords.left}px ${coords.top + coords.height}px, 
          ${coords.left}px 100%, 
          100% 100%, 
          100% 0%
        )` }}
        onClick={handleComplete}
      />

      {/* Target outline overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'absolute',
          top: coords.top - 4,
          left: coords.left - 4,
          width: coords.width + 8,
          height: coords.height + 8,
        }}
        className="border-2 border-indigo-500 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] z-[91]"
      />

      {/* Tooltip dialog card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            ...getTooltipStyle(),
          }}
          className="w-[320px] p-5 glass-panel bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[95] pointer-events-auto flex flex-col gap-4 text-white"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-sm font-title text-indigo-400">
              {currentStep.title}
            </h4>
            <button 
              onClick={handleComplete}
              className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Footer Controls */}
          <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-800/60 text-xs">
            <span className="text-slate-500 font-semibold">
              Step {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft size={10} />
                  <span>Back</span>
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer"
              >
                <span>{stepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                <ChevronRight size={10} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
