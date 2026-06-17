import { useEffect, useState } from 'react';

export interface AnnouncementSlide {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    backgroundColor: string;
    textColor?: string;
    ctaText?: string;
    ctaLink?: string;
}

interface AnnouncementCarouselProps {
    slides: AnnouncementSlide[];
    autoPlayInterval?: number;
}

export function AnnouncementCarousel({
    slides,
    autoPlayInterval = 8000,
}: AnnouncementCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress((prevProgress) => {
                if (prevProgress >= 100) {
                    setActiveIndex(
                        (prevIndex) => (prevIndex + 1) % slides.length,
                    );
                    return 0;
                }
                return prevProgress + 100 / (autoPlayInterval / 100);
            });
        }, 100);

        return () => clearInterval(progressInterval);
    }, [autoPlayInterval, slides.length]);

    const handleSlideClick = (index: number) => {
        setActiveIndex(index);
        setProgress(0);
    };

    if (slides.length === 0) return null;

    const activeSlide = slides[activeIndex];
    const isFirstSlide = activeIndex === 0;
    const esnColors = ['#7ac143', '#f47b20', '#00aeef', '#ec008c'];

    return (
        <div className="relative flex flex-col gap-4 sm:gap-5 lg:flex-row">
            {/* Main Hero Slide - Increased size by 25% overall, 70% more on mobile */}
            <div className="relative flex-1 overflow-hidden rounded-lg sm:rounded-2xl">
                {/* Background Image / Side */}
                <div
                    className="relative w-full overflow-hidden bg-gray-900"
                    style={{
                        aspectRatio:
                            window.innerWidth < 640 ? '16 / 15' : '16 / 10', // 70% taller on mobile (16/9 → 16/15)
                    }}
                >
                    <div
                        className="absolute inset-0"
                        style={
                            isFirstSlide
                                ? {
                                      backgroundColor:
                                          activeSlide.backgroundColor,
                                  }
                                : {}
                        }
                    >
                        {!isFirstSlide && (
                            <img
                                src={activeSlide.image}
                                alt={activeSlide.title}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        )}

                        {/* Gradient overlay for text readability - only for non-first slides */}
                        {!isFirstSlide && (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 via-40% to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 via-50% to-transparent" />
                            </>
                        )}

                        {isFirstSlide && (
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                        )}
                    </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col p-4 sm:p-7 md:p-10 lg:p-14">
                    {/* Top: Image for first slide only - top left on mobile, reduced by 30% */}
                    <div className="flex-shrink-0">
                        {isFirstSlide && (
                            <div className="h-7 w-7 sm:h-16 sm:w-16 md:h-20 md:w-20">
                                <img
                                    src={activeSlide.image}
                                    alt=""
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        )}
                    </div>

                    {/* Spacer to push content to bottom */}
                    <div className="flex-grow" />

                    {/* Bottom: Title, Description, and CTA - bottom left with smart overflow handling */}
                    <div
                        className="max-w-2xl flex-shrink-0 pb-2"
                        style={{ color: activeSlide.textColor || '#ffffff' }}
                    >
                        <h2 className="mb-1.5 line-clamp-2 text-base leading-tight font-bold sm:mb-2 sm:line-clamp-none sm:text-2xl md:text-3xl lg:text-4xl">
                            {activeSlide.title}
                        </h2>

                        <div className="mb-2 line-clamp-6 text-xs leading-relaxed opacity-90 sm:mb-4 sm:line-clamp-none sm:text-sm md:text-base">
                            {activeSlide.subtitle.split('\n').map((line, i) => (
                                <p
                                    key={i}
                                    className={i > 0 ? 'mt-1 sm:mt-2' : ''}
                                >
                                    {line}
                                </p>
                            ))}
                        </div>

                        {activeSlide.ctaText && activeSlide.ctaLink && (
                            <a
                                href={activeSlide.ctaLink}
                                className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black shadow transition-colors hover:bg-gray-100 sm:px-6 sm:py-3 sm:text-sm md:px-8"
                            >
                                {activeSlide.ctaText}
                            </a>
                        )}
                    </div>
                </div>

                {/* Progress Bar - moved to hero bottom on all screens */}
                <div className="absolute bottom-0 left-0 z-10 h-1 w-full overflow-hidden">
                    <div className="flex h-full">
                        {esnColors.map((color, i) => {
                            const segmentStart = i * 25;
                            const segmentEnd = (i + 1) * 25;
                            const width =
                                progress > segmentEnd
                                    ? '25%'
                                    : progress > segmentStart
                                      ? `${((progress - segmentStart) / 25) * 25}%`
                                      : '0%';

                            return (
                                <div
                                    key={color}
                                    className="h-full"
                                    style={{
                                        width,
                                        background: color,
                                        transition: 'width 0.1s linear',
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Thumbnail Navigation - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:flex lg:w-80 lg:flex-col lg:gap-4">
                {slides.map((slide, index) => {
                    return (
                        <button
                            key={slide.id}
                            onClick={() => handleSlideClick(index)}
                            className={`group relative flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 ease-in-out ${
                                index === activeIndex
                                    ? 'scale-[1.02] shadow-lg ring-2 ring-black/5'
                                    : 'opacity-70 hover:scale-[1.01] hover:opacity-100 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-center gap-3 rounded-lg bg-white/80 p-3 backdrop-blur">
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="h-14 w-14 flex-shrink-0 rounded object-cover"
                                />
                                <div className="flex-1 text-left">
                                    <p className="line-clamp-2 text-xs font-semibold text-gray-900">
                                        {slide.title}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
