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
            setProgress((prev) => {
                if (prev >= 100) {
                    return 0;
                }
                return prev + (100 / (autoPlayInterval / 100));
            });
        }, 100);

        return () => clearInterval(progressInterval);
    }, [autoPlayInterval]);

    useEffect(() => {
        if (progress >= 100) {
            setActiveIndex((prev) => (prev + 1) % slides.length);
            setProgress(0);
        }
    }, [progress, slides.length]);

    const handleSlideClick = (index: number) => {
        setActiveIndex(index);
        setProgress(0);
    };

    if (slides.length === 0) return null;

    const activeSlide = slides[activeIndex];
    const isFirstSlide = activeIndex === 0;

    return (
        <div className="relative flex flex-col gap-4 lg:flex-row">
            {/* Main Hero Slide */}
            <div className="relative flex-1 overflow-hidden rounded-2xl">
                {/* Background Image / Side */}
                <div
                    className="relative aspect-video w-full overflow-hidden bg-gray-900"
                    style={isFirstSlide ? { backgroundColor: activeSlide.backgroundColor } : {}}
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

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 lg:p-12">
                    {/* Top: Image for first slide only */}
                    <div>
                        {isFirstSlide && (
                            <div className="h-16 w-16 sm:h-20 sm:w-20">
                                <img
                                    src={activeSlide.image}
                                    alt=""
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        )}
                    </div>

                    {/* Bottom: Title, Description, and CTA */}
                    <div className="max-w-2xl" style={{ color: activeSlide.textColor || '#ffffff' }}>
                        <h2 className="mb-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
                            {activeSlide.title}
                        </h2>

                        <div className="mb-4 text-sm opacity-90 sm:text-base">
                            {activeSlide.subtitle.split('\n').map((line, i) => (
                                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                    {line}
                                </p>
                            ))}
                        </div>

                        {activeSlide.ctaText && activeSlide.ctaLink && (
                            <a
                                href={activeSlide.ctaLink}
                                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black shadow hover:bg-gray-100 transition-colors sm:px-8"
                            >
                                {activeSlide.ctaText}
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Thumbnail Navigation - Right Side - Narrower */}
            <div className="flex flex-row gap-3 lg:w-64 lg:flex-col">
                {slides.map((slide, index) => {
                    const esnColors = ['#7ac143', '#f47b20', '#00aeef', '#ec008c'];

                    return (
                        <button
                            key={slide.id}
                            onClick={() => handleSlideClick(index)}
                            className={`group relative flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 ease-in-out ${index === activeIndex
                                ? 'shadow-lg scale-[1.02] ring-2 ring-black/5'
                                : 'opacity-70 hover:opacity-100 hover:shadow-md hover:scale-[1.01]'
                                }`}
                        >
                            <div className="flex items-center gap-3 rounded-lg bg-white/80 backdrop-blur p-3">
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="h-12 w-12 flex-shrink-0 rounded object-cover"
                                />
                                <div className="hidden flex-1 text-left lg:block">
                                    <p className="line-clamp-2 text-xs font-semibold text-gray-900">
                                        {slide.title}
                                    </p>
                                </div>
                            </div>
                            {/* Progress Bar with ESN colors progressing */}
                            {index === activeIndex && (
                                <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-lg">
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
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
