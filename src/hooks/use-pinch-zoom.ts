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
import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useIsMobile } from '@/hooks/use-breakpoint';

const DEFAULT_ZOOM: CSSProperties = {
    transform: 'translate3d(0%,0%,0) scale(1)',
    transformOrigin: '50% 50%',
};

interface UsePinchZoomOptions {
    enabled?: boolean;
}

interface UsePinchZoomResult {
    isPinchZoomActive: boolean;
    pinchZoomStyle: CSSProperties;
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
    resetPinchZoom: () => void;
}

export function usePinchZoom({ enabled = false }: UsePinchZoomOptions = {}): UsePinchZoomResult {
    const isMobile = useIsMobile();
    const [pinchZoomStyle, setPinchZoomStyle] = useState<CSSProperties>(DEFAULT_ZOOM);
    const [isPinchZoomActive, setIsPinchZoomActive] = useState(false);
    const pinchZoomEnabled = enabled && isMobile;
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchStartDistanceRef = useRef<number | null>(null);
    const pinchStartScaleRef = useRef(1);
    const currentScaleRef = useRef(1);

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

            const scaleValue = pinchStartScaleRef.current * (distance / pinchStartDistanceRef.current);
            const clampedScale = Math.min(Math.max(scaleValue, 1), 3);
            currentScaleRef.current = clampedScale;
            const isZooming = clampedScale > 1;
            setIsPinchZoomActive(isZooming);

            const rect = event.currentTarget.getBoundingClientRect();
            const x = Math.min(Math.max((midpoint.x - rect.left) / rect.width, 0), 1);
            const y = Math.min(Math.max((midpoint.y - rect.top) / rect.height, 0), 1);

            setPinchZoomStyle(
                isZooming
                    ? {
                        transform: `translate3d(0,0,0) scale(${clampedScale})`,
                        transformOrigin: `${(1 - x) * 100}% ${(1 - y) * 100}%`,
                    }
                    : DEFAULT_ZOOM
            );
        },
        [pinchZoomEnabled, getTouchDistance, getTouchMidpoint]
    );

    const endPointerInteraction = useCallback((event: PointerEvent<HTMLDivElement>) => {
        activePointersRef.current.delete(event.pointerId);

        if (activePointersRef.current.size < 2) {
            pinchStartDistanceRef.current = null;
        }
    }, []);

    const onPointerDown = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!pinchZoomEnabled || event.pointerType !== 'touch') {
                return;
            }

            event.currentTarget.setPointerCapture?.(event.pointerId);
            activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

            if (activePointersRef.current.size === 2) {
                // If there are 2 touch points, save the distance to calculate the zoom level later.
                pinchStartDistanceRef.current = getTouchDistance();
                pinchStartScaleRef.current = currentScaleRef.current;
            }
        },
        [pinchZoomEnabled, getTouchDistance]
    );

    const onPointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!pinchZoomEnabled || event.pointerType !== 'touch') {
                return;
            }

            activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (activePointersRef.current.size === 2) {
                event.preventDefault();
                updatePinchZoom(event);
            }
        },
        [pinchZoomEnabled, updatePinchZoom]
    );

    const onPointerUp = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!pinchZoomEnabled || event.pointerType !== 'touch') {
                return;
            }

            endPointerInteraction(event);
        },
        [pinchZoomEnabled, endPointerInteraction]
    );

    const onPointerCancel = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!pinchZoomEnabled || event.pointerType !== 'touch') {
                return;
            }

            endPointerInteraction(event);
        },
        [pinchZoomEnabled, endPointerInteraction]
    );

    const resetPinchZoom = useCallback(() => {
        activePointersRef.current.clear();
        pinchStartDistanceRef.current = null;
        pinchStartScaleRef.current = 1;
        currentScaleRef.current = 1;
        setIsPinchZoomActive(false);
        setPinchZoomStyle(DEFAULT_ZOOM);
    }, []);

    return {
        isPinchZoomActive,
        pinchZoomStyle,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        resetPinchZoom,
    };
}

export default usePinchZoom;
