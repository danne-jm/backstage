import { Package } from 'lucide-react';

interface Props {
    type?: 'product' | 'event' | string;
    className?: string;
}

export function SellablePlaceholder({ type: _type, className = '' }: Props) {
    const Icon = Package;
    return (
        <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-100 text-gray-300 ${className}`}>
            <Icon className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.25} />
        </div>
    );
}
