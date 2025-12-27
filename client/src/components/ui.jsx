import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper to merge Tailwind classes safely
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Badge = ({ status }) => {
  const styles = {
    queued: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    processing: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  // Default to 'queued' if status is undefined or unknown
  const activeStyle = styles[status] || styles.queued;

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider", activeStyle)}>
      {status || 'queued'}
    </span>
  );
};

export const ProgressBar = ({ current, max, label }) => {
  // Prevent division by zero and ensure percentage doesn't exceed 100%
  const safeMax = max > 0 ? max : 1;
  const percentage = Math.min((current / safeMax) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-white">{current} / {max}</span>
      </div>
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};