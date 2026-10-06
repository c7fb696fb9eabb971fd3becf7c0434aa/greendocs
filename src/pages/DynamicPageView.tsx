import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolvePathNode } from '../lib/contentEngine';
import { BreadcrumbPath } from '../components/BreadcrumbPath';
import { SwipeableFlipCard } from '../components/SwipeableFlipCard';
import { PaginatedSubCardList } from '../components/ui/PaginatedSubCardList';
import { NotFoundView } from '../components/ui/NotFoundView';

/**
 * Universal dynamic view that resolves and renders any page node in the hierarchy.
 * Invariants:
 * - Each card holder (01-hnc, 02-hnc) is rendered as its own separate Card component.
 * - Each Card component holds its own swipable slides with dedicated slide dots.
 * - If a page has NO cards, NO card deck is rendered.
 * - If a page has child sub-pages, they are listed via PaginatedSubCardList.
 */
export const DynamicPageView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [deckActiveIndices, setDeckActiveIndices] = useState<Record<string, number>>({});

  // Parse path segments from URL (e.g. /opencv/imageprocessing -> ['opencv', 'imageprocessing'])
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const resolved = resolvePathNode(pathSegments);

  const cardHolders = resolved?.node?.cardHolders || [];
  const cards = resolved?.node?.cards || [];

  // Reset indices on route change
  useEffect(() => {
    setDeckActiveIndices({});
  }, [location.pathname]);

  // Sync active card index with URL hash (#card-slug or #order)
  useEffect(() => {
    if (location.hash && cardHolders.length > 0) {
      const cleanHash = location.hash.replace(/^#/, '').toLowerCase();
      for (const holder of cardHolders) {
        const matchIndex = holder.cards.findIndex(
          (c) =>
            c.id.toLowerCase() === cleanHash ||
            c.title.toLowerCase().replace(/\s+/g, '-') === cleanHash ||
            c.id.toLowerCase().endsWith(`-${cleanHash}`)
        );
        if (matchIndex !== -1) {
          setDeckActiveIndices((prev) => ({ ...prev, [holder.id]: matchIndex }));
          return;
        }
      }
    }
  }, [location.pathname, location.hash, cardHolders]);

  // Handle active card change and update URL hash for deep-linking
  const handleDeckIndexChange = (holderId: string, index: number) => {
    setDeckActiveIndices((prev) => ({ ...prev, [holderId]: index }));
    const holder = cardHolders.find((h) => h.id === holderId);
    if (holder && holder.cards[index]) {
      const cardSlug = holder.cards[index].title.toLowerCase().replace(/\s+/g, '-');
      navigate(`${location.pathname}#${cardSlug}`, { replace: true });
    }
  };

  // Handle unmatched 404 route
  if (!resolved) {
    return <NotFoundView attemptedPath={location.pathname} />;
  }

  const { node, breadcrumbs, currentPath } = resolved;
  const hasCardHolders = cardHolders.length > 0;
  const hasCards = cards.length > 0;
  const hasChildren = Boolean(node.children && node.children.length > 0);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3 sm:gap-3.5 animate-fadeIn">
      {/* Contextual Breadcrumb Trail & Out Navigation */}
      <BreadcrumbPath breadcrumbs={breadcrumbs} />

      {/* Discrete Card Holders: Each 01-hnc, 02-hnc renders its own independent card deck */}
      {hasCardHolders ? (
        cardHolders.map((holder) => (
          <SwipeableFlipCard
            key={holder.id}
            cards={holder.cards}
            currentIndex={deckActiveIndices[holder.id] || 0}
            onIndexChange={(newIndex) => handleDeckIndexChange(holder.id, newIndex)}
          />
        ))
      ) : hasCards ? (
        <SwipeableFlipCard
          cards={cards}
          currentIndex={deckActiveIndices['default'] || 0}
          onIndexChange={(newIndex) => handleDeckIndexChange('default', newIndex)}
        />
      ) : null}

      {/* Nested Sub-Pages Section: Only rendered if this page has child sub-pages */}
      {hasChildren && node.children && (
        <section className="w-full">
          <PaginatedSubCardList items={node.children} basePath={currentPath} />
        </section>
      )}
    </div>
  );
};
