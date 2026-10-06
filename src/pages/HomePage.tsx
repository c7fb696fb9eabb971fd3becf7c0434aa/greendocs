import React from 'react';
import { getContentRegistry } from '../lib/contentEngine';
import { PaginatedSubCardList } from '../components/ui/PaginatedSubCardList';

/**
 * HomePage styled with pure minimalism:
 * Dynamically renders the top-level directory pages discovered in src/content/
 * using the encapsulated PaginatedSubCardList primitive.
 */
export const HomePage: React.FC = () => {
  const pages = getContentRegistry();

  return (
    <div className="w-full max-w-xl mx-auto animate-fadeIn">
      <PaginatedSubCardList items={pages} />
    </div>
  );
};
