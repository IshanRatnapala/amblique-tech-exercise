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
import { useState, useCallback, type CSSProperties, type PointerEvent, type KeyboardEvent } from 'react';
import { useIsDesktop } from '@/hooks/use-breakpoint';

const DEFAULT_ZOOM: CSSProperties = {
    transform: 'translate3d(0%,0%,0) scale(1)',
    transformOrigin: '50% 50%',
};

const KEYBOARD_ZOOM: CSSProperties = {
    transform: 'translate3d(0,0,0) scale(1.5)',
    transformOrigin: '50% 50%',
};

interface UseImageZoomOptions {
    enabled?: boolean;
}

interface UseImageZoomResult {
    isImageZoomActive: boolean;
    isKeyboardZoomActive: boolean;
    imageZoomStyle: CSSProperties;
    onPointerEnter: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerLeave: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
    resetZoom: () => void;
}

export function useImageZoom({ enabled = false }: UseImageZoomOptions = {}): UseImageZoomResult {
    const isDesktop = useIsDesktop();
    const [imageZoomStyle, setImageZoomStyle] = useState<CSSProperties>(DEFAULT_ZOOM);
    const [isKeyboardZoomActive, setIsKeyboardZoomActive] = useState(false);
    const hoverZoomEnabled = enabled && isDesktop;
    const isImageZoomActive = hoverZoomEnabled || isKeyboardZoomActive;

    const updateHoverZoom = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!hoverZoomEnabled) {
                return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
            const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

            setImageZoomStyle({
                transform: `translate3d(${0.5 - x}%,${0.5 - y}%,0) scale(2)`,
                transformOrigin: `${x * 100}% ${y * 100}%`,
            });
        },
        [hoverZoomEnabled]
    );

    const onPointerEnter = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            updateHoverZoom(event);
        },
        [updateHoverZoom]
    );

    const onPointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            updateHoverZoom(event);
        },
        [updateHoverZoom]
    );

    const onPointerLeave = useCallback(() => {
        if (hoverZoomEnabled) {
            setImageZoomStyle(DEFAULT_ZOOM);
        }
    }, [hoverZoomEnabled]);

    const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsKeyboardZoomActive((currentValue) => !currentValue);
            return;
        }

        if (event.key === 'Escape') {
            setIsKeyboardZoomActive(false);
        }
    }, []);

    const resetZoom = useCallback(() => {
        setIsKeyboardZoomActive(false);
        setImageZoomStyle(DEFAULT_ZOOM);
    }, []);

    return {
        isImageZoomActive,
        isKeyboardZoomActive,
        imageZoomStyle: isKeyboardZoomActive ? KEYBOARD_ZOOM : imageZoomStyle,
        onPointerEnter,
        onPointerMove,
        onPointerLeave,
        onKeyDown,
        resetZoom,
    };
}

export default useImageZoom;
