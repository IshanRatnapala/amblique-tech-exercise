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
import { useState, useCallback, type CSSProperties, type PointerEvent } from 'react';
import { useIsDesktop } from '@/hooks/use-breakpoint';

const DEFAULT_ZOOM: CSSProperties = {
    transform: 'translate3d(0%,0%,0) scale(1)',
    transformOrigin: '50% 50%',
};

export interface UseImageHoverZoomOptions {
    enabled?: boolean;
}

export interface UseImageHoverZoomResult {
    isZoomActive: boolean;
    imageStyle: CSSProperties;
    onPointerEnter: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerLeave: () => void;
}

export function useImageHoverZoom({ enabled = false }: UseImageHoverZoomOptions = {}): UseImageHoverZoomResult {
    const isDesktop = useIsDesktop();
    const isZoomActive = enabled && isDesktop;
    const [imageStyle, setImageStyle] = useState<CSSProperties>(DEFAULT_ZOOM);

    const updateZoomPosition = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!isZoomActive) {
                return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return;
            }

            const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
            const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

            setImageStyle({
                transform: `translate3d(${0.5 - x}%,${0.5 - y}%,0) scale(2)`,
                transformOrigin: `${x * 100}% ${y * 100}%`,
            });
        },
        [isZoomActive]
    );

    const onPointerEnter = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!isZoomActive) {
                return;
            }

            updateZoomPosition(event);
        },
        [isZoomActive, updateZoomPosition]
    );

    const onPointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            updateZoomPosition(event);
        },
        [updateZoomPosition]
    );

    const onPointerLeave = useCallback(() => {
        setImageStyle(DEFAULT_ZOOM);
    }, []);

    return {
        isZoomActive,
        imageStyle,
        onPointerEnter,
        onPointerMove,
        onPointerLeave,
    };
}

export default useImageHoverZoom;
