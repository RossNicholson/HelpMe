import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative w-full overflow-auto ${className}`}>
      <table className="w-full caption-bottom text-sm">
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <thead className={`[&_tr]:border-b ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <tbody className={`[&_tr:last-child]:border-0 ${className}`}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <tr className={`border-b transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-50 ${className}`}>
      {children}
    </tr>
  );
};

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <th className={`h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0 ${className}`}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
      {children}
    </td>
  );
}; 