import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon, type="button" }: any) => {
  const baseStyle = "px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed justify-center active:scale-95 shadow-sm";
  const variants: any = {
    primary: "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20 hover:shadow-blue-500/40 hover:translate-y-[-1px]",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    warning: "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
  };

  return (
    <button 
      type={type} onClick={onClick} disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} strokeWidth={2.5} />}
      {children}
    </button>
  );
};

export const Card = ({ children, title, description, className = '' }: any) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {(title || description) && (
      <div className="mb-4">
        {title && <h3 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h3>}
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    )}
    {children}
  </div>
);

export const InputGroup = ({ label, type = "text", placeholder, value, onChange, icon: Icon, helpText, required = false, name, min }: any) => (
  <div className="mb-5">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group transition-all duration-300">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
          <Icon size={18} />
        </div>
      )}
      <input
        name={name} type={type} required={required} min={min}
        className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium placeholder-gray-400`}
        placeholder={placeholder} value={value} onChange={onChange}
      />
    </div>
    {helpText && <p className="mt-1 text-xs text-gray-500 ml-1">{helpText}</p>}
  </div>
);