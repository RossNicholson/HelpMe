import React from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  children, 
  value, 
  onValueChange, 
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  );
};

export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <button
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  return <span className="text-gray-500">{placeholder}</span>;
};

export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="absolute top-full left-0 z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
      {children}
    </div>
  );
};

export const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ 
  value, 
  children 
}) => {
  return (
    <div className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">
      {children}
    </div>
  );
}; 