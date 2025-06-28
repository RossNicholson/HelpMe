import React, { useState, useRef, useEffect } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            isOpen, 
            setIsOpen, 
            value, 
            onValueChange 
          } as any);
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}> = ({ 
  children, 
  className = '',
  isOpen,
  setIsOpen
}) => {
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => setIsOpen?.(!isOpen)}
    >
      {children}
      <svg
        className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

export const SelectValue: React.FC<{ 
  placeholder?: string;
  value?: string;
  children?: React.ReactNode;
}> = ({ placeholder, value, children }) => {
  return <span className={value ? "text-gray-900" : "text-gray-500"}>{children || placeholder}</span>;
};

export const SelectContent: React.FC<{ 
  children: React.ReactNode;
  isOpen?: boolean;
  onValueChange?: (value: string) => void;
  setIsOpen?: (open: boolean) => void;
}> = ({ children, isOpen, onValueChange, setIsOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-full left-0 z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            onValueChange, 
            setIsOpen 
          } as any);
        }
        return child;
      })}
    </div>
  );
};

export const SelectItem: React.FC<{ 
  value: string; 
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  setIsOpen?: (open: boolean) => void;
}> = ({ 
  value, 
  children,
  onValueChange,
  setIsOpen
}) => {
  const handleClick = () => {
    onValueChange?.(value);
    setIsOpen?.(false);
  };

  return (
    <div 
      className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
      onClick={handleClick}
    >
      {children}
    </div>
  );
}; 