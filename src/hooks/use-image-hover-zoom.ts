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
import { useState, useCallback, useRef, type CSSProperties, type PointerEvent } from 'react';
import { useIsDesktop } from '@/hooks/use-breakpoint';

const DEFAULT_ZOOM: CSSProperties = {
    transform: 'translate3d(0%,0%,0) scale(1)',
    transformOrigin: '50% 50%',
};

export interface UseImageHoverZoomOptions {
    hoverZoom?: boolean;
    pinchZoom?: boolean;
}

export interface UseImageHoverZoomResult {
    isZoomActive: boolean;
    imageStyle: CSSProperties;
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerEnter: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerLeave: () => void;
}

export function useImageHoverZoom({ hoverZoom = false, pinchZoom = false }: UseImageHoverZoomOptions = {}): UseImageHoverZoomResult {
    const isDesktop = useIsDesktop();
    const [imageStyle, setImageStyle] = useState<CSSProperties>(DEFAULT_ZOOM);
    const [isPinchZoomActive, setIsPinchZoomActive] = useState(false);
    const hoverZoomEnabled = hoverZoom && isDesktop;
    const pinchZoomEnabled = pinchZoom;
    const isZoomActive = hoverZoomEnabled || isPinchZoomActive;
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchStartDistanceRef = useRef<number | null>(null);

    const getTouchDistance = useCallback((): number => {
        const pointers = Array.from(activePointersRef.current.values());
        if (pointers.length < 2) {
            return 0;
        }

        const [first, second] = pointers;
        const deltaX = second.x - first.x;
        const deltaY = second.y - first.y;
        return Math.hypot(deltaX, deltaY);
    }, []);

    const getTouchMidpoint = useCallback((): { x: number; y: number } => {
        const pointers = Array.from(activePointersRef.current.values());
        if (pointers.length < 2) {
            return {
                x: 0.5,
                y: 0.5,
            };
        }

        const [first, second] = pointers;
        return {
            x: (first.x + second.x) / 2,
            y: (first.y + second.y) / 2,
        };
    }, []);

    const updatePinchZoom = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!pinchZoomEnabled || pinchStartDistanceRef.current === null) {
                return;
            }

            const distance = getTouchDistance();
            const midpoint = getTouchMidpoint();

            const scaleValue = distance / pinchStartDistanceRef.current;
            const clampedScale = Math.min(Math.max(scaleValue, 1), 3);
            setIsPinchZoomActive(clampedScale > 1);

            const rect = event.currentTarget.getBoundingClientRect();
            const x = Math.min(Math.max((midpoint?.x - rect.left) / rect.width, 0), 1);
            const y = Math.min(Math.max((midpoint?.y - rect.top) / rect.height, 0), 1);

            setImageStyle(
                clampedScale > 1
                    ? {
                        transform: `translate3d(0,0,0) scale(${clampedScale})`,
                        transformOrigin: `${x * 100}% ${y * 100}%`,
                    }
                    : DEFAULT_ZOOM
            );
        },
        []
    );

    const updateHoverZoom = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!hoverZoomEnabled) {
                return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
            const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

            setImageStyle({
                transform: `translate3d(${0.5 - x}%,${0.5 - y}%,0) scale(2)`,
                transformOrigin: `${x * 100}% ${y * 100}%`,
            });
        },
        [hoverZoomEnabled]
    );

    const endPointerInteraction = useCallback((event: PointerEvent<HTMLDivElement>) => {
        activePointersRef.current.delete(event.pointerId);

        if (activePointersRef.current.size < 2) {
            pinchStartDistanceRef.current = null;
        }
    }, []);

    const onPointerEnter = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            updateHoverZoom(event);
        },
        [hoverZoomEnabled, updateHoverZoom]
    );

    const onPointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (pinchZoomEnabled && event.pointerType === 'touch') {
                event.preventDefault();
                activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
                if (activePointersRef.current.size === 2) {
                    updatePinchZoom(event);
                }
                return;
            }

            updateHoverZoom(event);
        },
        [pinchZoomEnabled, getTouchDistance, updatePinchZoom, updateHoverZoom]
    );

    const onPointerDown = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!pinchZoomEnabled || event.pointerType !== 'touch') {
                return;
            }

            event.currentTarget.setPointerCapture?.(event.pointerId);
            activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

            if (activePointersRef.current.size === 2) {
                // If there are 2 touch points, save the distance to calculate the zoom level later
                pinchStartDistanceRef.current = getTouchDistance();
            }
        },
        [pinchZoomEnabled, getTouchDistance]
    );

    const onPointerUp = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!pinchZoomEnabled || event.pointerType !== 'touch') {
                return;
            }

            endPointerInteraction(event);
            if (activePointersRef.current.size < 2) {
                setIsPinchZoomActive(false);
                setImageStyle(DEFAULT_ZOOM);
            }
        },
        [pinchZoomEnabled, endPointerInteraction, setIsPinchZoomActive, setImageStyle]
    );

    const onPointerCancel = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!pinchZoomEnabled || event.pointerType !== 'touch') {
                return;
            }

            endPointerInteraction(event);
            if (activePointersRef.current.size < 2) {
                setIsPinchZoomActive(false);
                setImageStyle(DEFAULT_ZOOM);
            }
        },
        [pinchZoomEnabled, endPointerInteraction, setIsPinchZoomActive, setImageStyle]
    );

    const onPointerLeave = useCallback(() => {
        if (hoverZoomEnabled) {
            setImageStyle(DEFAULT_ZOOM);
        }
    }, [hoverZoomEnabled]);

    return {
        isZoomActive,
        imageStyle,
        onPointerDown,
        onPointerEnter,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        onPointerLeave,
    };
}

export default useImageHoverZoom;
