# Technical Test

This repository includes my implementation for the three interview tasks.

I did not add automated tests due to time.

## Quick Start

```bash
# 1. Clone or use this template
git clone https://github.com/IshanRatnapala/amblique-tech-exercise.git
cd amblique-tech-exercise

# 2. Set up environment
# Copy over the env file

# 3. Install and run
pnpm install
pnpm dev
```

## Part A: PDP image zoom

What I changed:

- Added desktop hover zoom on the main PDP image using CSS transform scale and transform origin based on pointer position.
- Added keyboard support on the main image:
    - Enter and Space toggle a fixed 150 percent zoom.
    - Escape exits zoom.
- Added a custom pinch zoom hook for touch devices:
    - Hook name: `usePinchZoom`.
    - Tracks active touch pointers and calculates scale from touch distance.
    - Applies bounded zoom transform in the image container.
- Added reset behavior:
    - Desktop hover zoom resets on pointer leave.
    - Pinch zoom can be cleared by tapping outside via an overlay.
- Created a custom `useBreakpoint` hook to detect mobile vs desktop for conditional behavior.
    - Uses tailwind's default breakpoints for consistency.
    - Uses useSyncExternalStore for efficient updates and SSR compatibility.

Main files:

- src/components/image-gallery/index.tsx
- src/hooks/use-image-zoom.ts
- src/hooks/use-pinch-zoom.ts
- src/hooks/use-breakpoint.ts

## Part B: Sticky Add to Cart on mobile

What I changed:

- Added a mobile sticky add to cart bar component shown at the bottom of the viewport.
- Used IntersectionObserver to watch the main Add to Cart button visibility.
- Sticky bar only appears when the main Add to Cart button is out of view.
- Added slide in and slide out animation using Tailwind transition classes.
- Sticky button uses the same add to cart handler as the inline button, so there is no duplicated cart logic.
- Variant summary in the sticky bar updates from current selected variation values.
- Prevented SSR hydration mismatch by gating render on a mobile media query hook that returns `false` on server.

Main files:

- src/components/product-sticky-cart-actions/index.tsx
- src/components/product-cart-actions/index.tsx
- src/hooks/use-breakpoint.ts

## Part C: PLP product tile image cycler

What I changed:

- Enhanced product tile image area to support multiple images when available.
- Desktop behavior:
    - Hovering the tile image area cycles images.
    - Left and right halves determine direction.
- Mobile behavior:
    - Added custom `useSwipe` hook for touch swipe left and right.
- Added crossfade transitions between images using opacity changes.
- Added dot indicators at the bottom of the image.
- Kept SSR output stable:
    - Server renders only the primary image.
    - Client enhances to multi-image cycler after mount.
- If product has one image, it renders the single image behavior.
- Loading strategy:
    - Primary image eager.
    - Additional images lazy.

Main files:

- src/components/product-image/index.tsx
- src/hooks/use-swipe.ts
- src/components/product-tile/index.tsx

## Notes

- No automated tests were added for this exercise due to time.
