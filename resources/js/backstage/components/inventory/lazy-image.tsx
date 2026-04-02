import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
}

/**
 * Defers loading the image until it enters the viewport using IntersectionObserver.
 * Fades in once loaded. Shows a pulsing placeholder while waiting.
 */
export function LazyImage({ src, alt, className }: LazyImageProps) {
    const [isInView, setIsInView] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '50px' },
        );

        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className={className}>
            {isInView ? (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setIsLoaded(true)}
                    className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
            ) : (
                <div className={`${className} animate-pulse bg-muted`} />
            )}
        </div>
    );
}
