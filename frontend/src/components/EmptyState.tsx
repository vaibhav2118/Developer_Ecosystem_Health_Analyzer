import { FolderPlus } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onActionClick?: () => void;
  actionLabel?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Repository Selected",
  description = "Please select a repository from the topbar or register a new repository to view detailed developer ecosystem insights.",
  onActionClick,
  actionLabel = "Add First Repository",
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="glass-panel p-10 max-w-lg flex flex-col items-center gap-6 shadow-xl border border-[var(--glass-border)] rounded-2xl bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="p-4 rounded-full bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--accent-purple)] text-white shadow-lg shadow-indigo-500/20">
          {icon || <FolderPlus size={32} />}
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold font-title text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm">
            {description}
          </p>
        </div>

        {onActionClick && (
          <button
            onClick={onActionClick}
            className="mt-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent-purple)] hover:opacity-90 shadow-md shadow-indigo-500/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
