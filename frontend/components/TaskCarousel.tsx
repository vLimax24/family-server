import { useState, useEffect, useRef } from 'react';
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
        return; // don't start swipe
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
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
<button
  onClick={goToPrev}
  className="absolute left-2 sm:left-4 md:left-6 lg:left-8 z-10
             w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
             rounded-full bg-white/95 backdrop-blur-sm border border-gray-200
             shadow-lg flex items-center justify-center
             hover:bg-white hover:shadow-xl transition-all
             hover:scale-105 active:scale-95"
>
  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-700" strokeWidth={2.5} />
</button>

<button
  onClick={goToNext}
  className="absolute right-2 sm:right-4 md:right-6 lg:right-8 z-10
             w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
             rounded-full bg-white/95 backdrop-blur-sm border border-gray-200
             shadow-lg flex items-center justify-center
             hover:bg-white hover:shadow-xl transition-all
             hover:scale-105 active:scale-95"
>
  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-700" strokeWidth={2.5} />
</button>
        </>
      )}

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex items-center justify-center h-full gap-8 px-32">
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
                  <div className="
                    w-72 sm:w-80
                    md:w-[26rem]
                    lg:w-[28rem]
                    xl:w-[30rem]
                    max-w-full
                  ">
                    {item}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Dots Indicator */}
        {items.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-2.5 lg:gap-3">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 h-3 sm:w-10 sm:h-3.5 lg:w-12 lg:h-4 bg-emerald-600'
                    : 'w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 bg-gray-300 hover:bg-gray-400 transition-all duration-200'
                }`}
              />
            ))}
          </div>
        )}
    </div>
  );
}