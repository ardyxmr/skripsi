import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center text-gray-500 dark:text-gray-400 animate-in fade-in duration-300">
      <Compass size={48} className="mb-4 opacity-30" />
      <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">404</div>
      <p className="text-sm mb-4">The page you're looking for doesn't exist.</p>
      <Link
        to="/catalog"
        className="text-[13px] font-medium text-teal-600 dark:text-teal-400 hover:underline"
      >
        ← Back to Catalog
      </Link>
    </div>
  );
}
