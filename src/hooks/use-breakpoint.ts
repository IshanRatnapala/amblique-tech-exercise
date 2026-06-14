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
import { useSyncExternalStore } from 'react';
import defaultTheme from 'tailwindcss/defaultTheme';

/**
 * Creates a hook that subscribes to a media query and returns whether it currently matches.
 * Uses `useSyncExternalStore` for SSR safe subscriptions.
 *
 * @param query Media query string to evaluate.
 * @returns Hook that returns `true` when the media query matches, `false` when called on the server.
 */
function createMediaQueryHook(query: string): () => boolean {
    function subscribe(callback: () => void) {
        const mql = globalThis.matchMedia?.(query);
        mql?.addEventListener('change', callback);
        return () => mql?.removeEventListener('change', callback);
    }

    function getSnapshot(): boolean {
        return globalThis.matchMedia?.(query)?.matches ?? false;
    }

    function getServerSnapshot(): boolean {
        return false;
    }

    return function useMediaQuery(): boolean {
        return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    };
}

/**
 * Indicates whether the viewport is at least the Tailwind `lg` breakpoint.
 *
 * @returns `true` when the viewport width matches desktop sizes.
 */
export const useIsDesktop = createMediaQueryHook(`(min-width: ${defaultTheme.screens.lg})`);

/**
 * Indicates whether the viewport is below the Tailwind `md` breakpoint.
 *
 * @returns `true` when the viewport width matches mobile sizes.
 */
export const useIsMobile = createMediaQueryHook(`(max-width: calc(${defaultTheme.screens.md} - 1px))`);
