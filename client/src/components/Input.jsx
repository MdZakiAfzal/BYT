import React from 'react';

const Input = ({ label, type, placeholder, value, onChange, error }) => {
  return (
    <div className="flex flex-col gap-2 mb-4 w-full">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          w-full px-4 py-2.5 rounded-lg bg-zinc-900 border text-white placeholder-gray-500 outline-none transition-all
          ${error 
            ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
            : 'border-zinc-800 focus:border-white focus:ring-2 focus:ring-white/10'
          }
        `}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
};

export default Input;