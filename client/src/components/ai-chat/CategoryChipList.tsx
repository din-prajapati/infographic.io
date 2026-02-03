/**
 * Category Chip List Component
 * Horizontal scrollable list of category chips
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryChip as CategoryChipType } from './types';
import { CategoryChip } from './CategoryChip';

interface CategoryChipListProps {
  chips: CategoryChipType[];
  selectedChips: CategoryChipType[];
  onChipClick: (chip: CategoryChipType) => void;
}

export function CategoryChipList({
  chips,
  selectedChips,
  onChipClick,
}: CategoryChipListProps) {
  const selectedChipIds = selectedChips.map((chip) => chip.id);
  const isChipSelected = (chipId: string) => selectedChipIds.includes(chipId);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrowVisibility = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    updateArrowVisibility();
    window.addEventListener('resize', updateArrowVisibility);
    return () => window.removeEventListener('resize', updateArrowVisibility);
  }, [chips, selectedChips]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
      setTimeout(updateArrowVisibility, 300);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
      setTimeout(updateArrowVisibility, 300);
    }
  };

  return (
    <div className="mb-6">
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={updateArrowVisibility}
          className="flex items-center gap-2 overflow-x-auto overflow-y-hidden flex-nowrap py-1 px-8 scrollbar-hide"
        >
          {chips
            .filter(chip => selectedChipIds.length === 0 || isChipSelected(chip.id))
            .map((chip, index) => (
              <CategoryChip
                key={chip.id}
                chip={chip}
                isSelected={isChipSelected(chip.id)}
                onClick={() => onChipClick(chip)}
                index={index}
              />
            ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
}