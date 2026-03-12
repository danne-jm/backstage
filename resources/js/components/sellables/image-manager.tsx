import { X } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';

interface ImageManagerProps {
    images: { id: number | string; url: string }[];
    onRemoveImage: (id: number | string) => void;
    onAddImages: (files: FileList) => void;
}

export function ImageManager({
    images,
    onRemoveImage,
    onAddImages,
}: ImageManagerProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onAddImages(e.target.files);
            // reset value
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                {images.map((img) => (
                    <div key={img.id} className="group relative">
                        <img
                            src={img.url}
                            alt="Event"
                            className="h-24 w-24 rounded-md border object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => onRemoveImage(img.id)}
                            className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>

            <div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Add Images
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
}
