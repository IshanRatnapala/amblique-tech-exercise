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
import { useCallback, useRef, type PointerEvent } from 'react';

interface UseSwipeOptions {
    threshold?: number;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
}

interface UseSwipeResult {
    onPointerUp: (event: PointerEvent<HTMLElement>) => void;
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    onPointerCancel: () => void;
}

export function useSwipe({ threshold = 50, onSwipeLeft, onSwipeRight }: UseSwipeOptions): UseSwipeResult {
    const startXRef = useRef<number | null>(null);
    const pointerIdRef = useRef<number | null>(null);

    const reset = useCallback(() => {
        startXRef.current = null;
        pointerIdRef.current = null;
    }, []);

    const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== 'touch') {
            return;
        }
        event.preventDefault();

        startXRef.current = event.clientX;
        pointerIdRef.current = event.pointerId;

        event.currentTarget.setPointerCapture(event.pointerId);
    }, []);

    const onPointerUp = useCallback(
        (event: PointerEvent<HTMLElement>) => {
            if (
                event.pointerType !== 'touch' ||
                startXRef.current == null ||
                pointerIdRef.current !== event.pointerId
            ) {
                return;
            }
            event.preventDefault();

            const deltaX = event.clientX - startXRef.current;

            if (Math.abs(deltaX) >= threshold) {
                if (deltaX > 0) {
                    onSwipeRight?.();
                } else {
                    onSwipeLeft?.();
                }
            }

            reset();
        },
        [threshold, onSwipeLeft, onSwipeRight, reset]
    );

    const onPointerCancel = useCallback(() => {
        reset();
    }, [reset]);

    return {
        onPointerDown,
        onPointerUp,
        onPointerCancel,
    };
}
