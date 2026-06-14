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
'use client';

import { useEffect, useMemo, useState, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { useSelectedVariations } from '@/hooks/product/use-selected-variations';
import type { ShopperProducts } from '@/scapi';
import { getDisplayVariationValues } from '@/lib/product/product-utils';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ProductStickyCartActionsProps {
    product: ShopperProducts.schemas['Product'];
    buttonLabel: string;
    buttonDisabled: boolean;
    addToCartButtonRef: RefObject<HTMLButtonElement | null>;
    onAddToCart: () => void;
}

export default function ProductStickyCartActions({
    product,
    buttonLabel,
    buttonDisabled,
    addToCartButtonRef,
    onAddToCart,
}: ProductStickyCartActionsProps) {
    const { t } = useTranslation('product');
    const isMobile = useIsMobile();
    const [isMainAddToCartVisible, setIsMainAddToCartVisible] = useState(true);

    const selectedAttributes = useSelectedVariations({ product });
    const displayVariationValues = getDisplayVariationValues(product.variationAttributes, selectedAttributes);

    const variantSummary = useMemo(() => {
        return Object.entries(displayVariationValues)
            .map(([label, value]) => `${label}: ${value}`)
            .join(' · ');
    }, [displayVariationValues]);

    useEffect(() => {
        if (!isMobile) {
            setIsMainAddToCartVisible(true);
            return;
        }

        const target = addToCartButtonRef.current;
        if (!target) {
            setIsMainAddToCartVisible(false);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsMainAddToCartVisible(entry.isIntersecting);
            },
            { threshold: 0 }
        );

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [isMobile, addToCartButtonRef]);

    if (!isMobile) {
        return null;
    }

    const shouldShowStickyAtc = !isMainAddToCartVisible;

    return (
        <div
            aria-hidden={!shouldShowStickyAtc}
            className={cn(
                'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden transition-all duration-300 ease-out',
                shouldShowStickyAtc ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
            )}>
            <div className="mx-auto flex w-full items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-5 text-foreground">{product.name}</p>
                    <p className="truncate text-xs leading-4 text-muted-foreground">
                        {variantSummary || t('selectAllOptions')}
                    </p>
                </div>
                <Button onClick={onAddToCart} disabled={buttonDisabled} className="h-10 px-4 text-sm" size="sm">
                    {buttonLabel}
                </Button>
            </div>
        </div>
    );
}
