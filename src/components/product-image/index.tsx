/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Link } from '@/components/link';
import type { ShopperSearch } from '@/scapi';
import { createProductUrl, getImagesForColor } from '@/lib/product/product-utils';
import { useDynamicImageContext } from '@/providers/dynamic-image';
import { ProductImage } from './product-image';
import ImageNavArrows from '@/components/image-nav-arrows';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const HOVER_THROTTLE_INTERVAL_MS = 1000;

interface ProductImageContainerProps {
    product: ShopperSearch.schemas['ProductSearchHit'];
    selectedColorValue?: string | null;
    className?: string;
    handleProductClick?: (product: ShopperSearch.schemas['ProductSearchHit']) => void;
    /** Image aspect ratio (width/height). If provided, calculates height based on viewport width. Defaults to 1 (square) */
    imgAspectRatio?: number;
    /** Show prev/next navigation arrows when multiple images are available */
    showNavigationArrows?: boolean;
}

const ProductImageContainer = ({
    product,
    selectedColorValue = null,
    className,
    handleProductClick,
    imgAspectRatio = 1,
    showNavigationArrows = false,
}: ProductImageContainerProps) => {
    const { t } = useTranslation('product');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isBrowser, setIsBrowser] = useState(false);
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hoverPositionRef = useRef<'left' | 'right' | null>(null);

    // Get all images for the selected color variant
    const allImages = useMemo(
        () => getImagesForColor(product, selectedColorValue, 'medium'),
        [product, selectedColorValue]
    );

    const currentImage = allImages[selectedImageIndex] ?? allImages[0] ?? product.image;
    const currentImageUrl = currentImage?.disBaseLink || currentImage?.link;
    const imageAltFallback = product.productName || t('imageAlt') || 'Product Image';
    const hasMultipleImages = allImages.length > 1;

    // Report the image URL to the dynamic image context, if available
    const imageContext = useDynamicImageContext();
    currentImageUrl && imageContext?.addSource(currentImageUrl);

    const handleClick = useCallback(() => {
        handleProductClick?.(product);
    }, [handleProductClick, product]);

    const cycleToPreviousImage = useCallback(() => {
        setSelectedImageIndex((current) => Math.max(current - 1, 0));
    }, []);

    const cycleToNextImage = useCallback(() => {
        setSelectedImageIndex((current) => Math.min(current + 1, allImages.length - 1));
    }, [allImages.length]);

    const handleImageTransition = useCallback(() => {
        const position = hoverPositionRef.current;
        if (position === 'left') {
            cycleToPreviousImage();
        } else if (position === 'right') {
            cycleToNextImage();
        }
    }, [cycleToNextImage, cycleToPreviousImage]);

    const throttledHandlePointerEnter = useCallback(() => {
        if (!hasMultipleImages || showNavigationArrows || hoverTimerRef.current) return;

        hoverTimerRef.current = setInterval(() => {
            handleImageTransition();
        }, HOVER_THROTTLE_INTERVAL_MS);
    }, [hoverTimerRef, handleImageTransition, hasMultipleImages, showNavigationArrows]);

    const handlePointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!hasMultipleImages || showNavigationArrows) {
                return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const isLeftHalf = event.clientX - rect.left < rect.width / 2;
            hoverPositionRef.current = isLeftHalf ? 'left' : 'right';
        },
        [hasMultipleImages, showNavigationArrows]
    );

    const handlePointerLeave = useCallback(() => {
        if (hoverTimerRef.current) {
            clearInterval(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, [hoverTimerRef]);

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    // When a non-square aspect ratio is requested, apply it via the native CSS
    // `aspect-ratio` property. The legacy padding-bottom percentage trick is not
    // used here because it conflicts with the native property and collapses the
    // image height to zero.
    const heightStyle = imgAspectRatio !== 1 ? { aspectRatio: `${imgAspectRatio}` } : {};

    return (
        <div
            className={`${showNavigationArrows ? 'group/image ' : ''}relative overflow-hidden bg-secondary/20 flex flex-col ${
                imgAspectRatio === 1 ? 'aspect-square' : ''
            } ${className || ''}`}
            style={heightStyle}
            onPointerEnter={throttledHandlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onPointerMove={handlePointerMove}>
            {/* Product Image */}
            <Link
                to={createProductUrl(product.productId, selectedColorValue)}
                onClick={handleClick}
                className="block w-full h-full flex-1"
                aria-label={t('viewProductAriaLabel', { productName: imageAltFallback }) || imageAltFallback}>
                {!isBrowser || !hasMultipleImages || showNavigationArrows ? (
                    <ProductImage
                        src={currentImageUrl || ''}
                        alt={currentImage?.alt || imageAltFallback}
                        className="w-full h-full object-cover transition-all duration-200 group-hover:scale-105"
                        widths={imageContext?.widths}
                        loading="eager"
                    />
                ) : (
                    <div className="relative h-full w-full">
                        {allImages.map((image, index) => {
                            const imageUrl = image?.disBaseLink || image?.link;
                            return (
                                <ProductImage
                                    key={imageUrl}
                                    src={imageUrl}
                                    alt={image?.alt || imageAltFallback}
                                    className={cn(
                                        'absolute h-full w-full object-cover transition-all duration-400 group-hover:scale-105',
                                        selectedImageIndex === index ? 'opacity-100' : 'opacity-0'
                                    )}
                                    widths={imageContext?.widths}
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                    imageProps={{ 'aria-hidden': selectedImageIndex === index ? undefined : true }}
                                />
                            );
                        })}

                        <div
                            aria-hidden
                            className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1">
                            {allImages.map((image, index) => {
                                const imageUrl = image?.disBaseLink || image?.link;
                                return (
                                    <span
                                        key={`dot-${imageUrl}`}
                                        className={cn(
                                            'block h-2 w-2 rounded-full bg-background/80 transition-opacity border border-primary/80',
                                            selectedImageIndex === index ? 'opacity-100' : 'opacity-50'
                                        )}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </Link>
            {/* Navigation Arrows - visible on hover */}
            {showNavigationArrows && allImages.length > 1 && (
                <ImageNavArrows
                    imageCount={allImages.length}
                    onIndexChange={setSelectedImageIndex}
                    className="opacity-0 group-hover/image:opacity-100 transition-opacity"
                />
            )}
        </div>
    );
};

export { ProductImageContainer };
