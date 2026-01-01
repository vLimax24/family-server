import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TaskCarouselProps {
  items: React.ReactNode[];
}

export function TaskCarousel({ items }: TaskCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gestureLocked, setGestureLocked] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      setGestureLocked(true);
      return;
    }

    setGestureLocked(false);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (gestureLocked) {
      setGestureLocked(false);
      return;
    }

    if (touchStart - touchEnd > 75) goToNext();
    if (touchStart - touchEnd < -75) goToPrev();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      setGestureLocked(true);
      return;
    }

    setGestureLocked(false);
    setTouchStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gestureLocked) return;
    if (touchStart) setTouchEnd(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gestureLocked) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleMouseUp = () => {
    if (gestureLocked) {
      setGestureLocked(false);
      return;
    }

    const delta = touchStart - touchEnd;

    if (Math.abs(delta) < 40) {
      setTouchStart(0);
      setTouchEnd(0);
      return;
    }

    if (delta > 75) goToNext();
    if (delta < -75) goToPrev();

    setTouchStart(0);
    setTouchEnd(0);
  };

  if (items.length === 0) return null;

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:shadow-xl active:scale-95 sm:left-4 sm:h-12 sm:w-12 md:left-6 md:h-14 md:w-14 lg:left-8 lg:h-16 lg:w-16"
          >
            <ChevronLeft
              className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
              strokeWidth={2.5}
            />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:shadow-xl active:scale-95 sm:right-4 sm:h-12 sm:w-12 md:right-6 md:h-14 md:w-14 lg:right-8 lg:h-16 lg:w-16"
          >
            <ChevronRight
              className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
              strokeWidth={2.5}
            />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex h-full items-center justify-center gap-8 px-32">
          {items.map((item, index) => {
            const offset = index - currentIndex;
            const isCenter = offset === 0;
            const isVisible = Math.abs(offset) <= 1;

            return (
              <div
                key={index}
                className="absolute transition-all duration-500 ease-out select-none"
                style={{
                  transform: `translateX(${offset * 55}%) scale(${isCenter ? 1 : 0.7})`,
                  opacity: isVisible ? (isCenter ? 1 : 0.4) : 0,
                  zIndex: isCenter ? 10 : 5 - Math.abs(offset),
                  pointerEvents: isCenter ? 'auto' : 'none',
                }}
              >
                <div className="w-72 max-w-full sm:w-80 md:w-104 lg:w-md xl:w-120">{item}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots Indicator */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-6 sm:gap-2.5 lg:bottom-8 lg:gap-3">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all ${
                index === currentIndex
                  ? 'h-3 w-8 bg-emerald-600 sm:h-3.5 sm:w-10 lg:h-4 lg:w-12'
                  : 'h-3 w-3 bg-gray-300 transition-all duration-200 hover:bg-gray-400 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
