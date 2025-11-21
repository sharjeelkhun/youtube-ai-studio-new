'use client';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';

const throttle = (func: (...args: any[]) => void, limit: number) => {
    let lastCall = 0;
    return function (...args: any[]) {
        const now = performance.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            func.apply(null, args);
        }
    };
};

function hexToRgb(hex: string) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return { r: 0, g: 0, b: 0 };
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
    };
}

interface Dot {
    cx: number;
    cy: number;
    xOffset: number;
    yOffset: number;
    _inertiaApplied: boolean;
}

interface PointerData {
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    lastTime: number;
    lastX: number;
    lastY: number;
}

const DotGrid = ({
    dotSize = 5,
    gap = 15,
    baseColor = 'hsl(var(--border))',
    activeColor = '#FF0000',
    proximity = 120,
    speedTrigger = 100,
    shockRadius = 250,
    shockStrength = 5,
    maxSpeed = 5000,
    resistance = 750,
    returnDuration = 1.5,
}: {
    dotSize?: number;
    gap?: number;
    baseColor?: string;
    activeColor?: string;
    proximity?: number;
    speedTrigger?: number;
    shockRadius?: number;
    shockStrength?: number;
    maxSpeed?: number;
    resistance?: number;
    returnDuration?: number;
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dotsRef = useRef<Dot[]>([]);
    const pointerRef = useRef<PointerData>({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        speed: 0,
        lastTime: 0,
        lastX: 0,
        lastY: 0
    });

    const baseRgb = useMemo(() => {
        // Detect theme - will be updated dynamically
        return { r: 200, g: 200, b: 200 }; // Light mode default
    }, []);

    const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

    // Get current theme color
    const getCurrentBaseColor = useCallback(() => {
        if (typeof window === 'undefined') return 'rgb(200, 200, 200)';

        const isDark = document.documentElement.classList.contains('dark');

        if (isDark) {
            // Dark mode: subtle white (reduced opacity)
            return 'rgba(255, 255, 255, 0.08)';
        } else {
            // Light mode: subtle gray (reduced opacity)
            return 'rgba(0, 0, 0, 0.08)';
        }
    }, []);

    const circlePath = useMemo(() => {
        if (typeof window === 'undefined' || !window.Path2D) return null;

        const p = new window.Path2D();
        p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
        return p;
    }, [dotSize]);

    const buildGrid = useCallback(() => {
        const wrap = wrapperRef.current;
        const canvas = canvasRef.current;
        if (!wrap || !canvas) return;

        const { width, height } = wrap.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);

        const cols = Math.floor((width + gap) / (dotSize + gap));
        const rows = Math.floor((height + gap) / (dotSize + gap));
        const cell = dotSize + gap;

        const gridW = cell * cols - gap;
        const gridH = cell * rows - gap;

        const extraX = width - gridW;
        const extraY = height - gridH;

        const startX = extraX / 2 + dotSize / 2;
        const startY = extraY / 2 + dotSize / 2;

        const dots: Dot[] = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cx = startX + x * cell;
                const cy = startY + y * cell;
                dots.push({ cx, cy, xOffset: 0, yOffset: 0, _inertiaApplied: false });
            }
        }
        dotsRef.current = dots;
    }, [dotSize, gap]);

    useEffect(() => {
        if (!circlePath) return;

        let rafId: number;
        const proxSq = proximity * proximity;

        const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const { x: px, y: py } = pointerRef.current;
            const currentBaseColor = getCurrentBaseColor();

            for (const dot of dotsRef.current) {
                const ox = dot.cx + dot.xOffset;
                const oy = dot.cy + dot.yOffset;
                const dx = dot.cx - px;
                const dy = dot.cy - py;
                const dsq = dx * dx + dy * dy;

                let style = currentBaseColor;

                // Only use red for hover, no blending with white
                if (dsq <= proxSq) {
                    const dist = Math.sqrt(dsq);
                    const t = 1 - dist / proximity;
                    // Pure red with varying opacity based on distance (reduced range)
                    const opacity = 0.15 + (t * 0.55); // 15% to 70% opacity
                    style = `rgba(255, 0, 0, ${opacity})`;
                }

                ctx.save();
                ctx.translate(ox, oy);
                ctx.fillStyle = style;
                ctx.fill(circlePath);
                ctx.restore();
            }

            rafId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(rafId);
    }, [proximity, activeRgb, baseRgb, circlePath, getCurrentBaseColor]);

    useEffect(() => {
        buildGrid();

        const handleResize = buildGrid;
        let observer: ResizeObserver | undefined;

        if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(handleResize);
            if (wrapperRef.current) {
                observer.observe(wrapperRef.current);
            }
        } else if (typeof window !== 'undefined') {
            (window as Window).addEventListener('resize', handleResize);
        }

        return () => {
            if (observer) {
                observer.disconnect();
            } else if (typeof window !== 'undefined') {
                (window as Window).removeEventListener('resize', handleResize);
            }
        };
    }, [buildGrid]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const now = performance.now();
            const pr = pointerRef.current;
            const dt = pr.lastTime ? now - pr.lastTime : 16;
            const dx = e.clientX - pr.lastX;
            const dy = e.clientY - pr.lastY;
            let vx = (dx / dt) * 1000;
            let vy = (dy / dt) * 1000;
            let speed = Math.hypot(vx, vy);
            if (speed > maxSpeed) {
                const scale = maxSpeed / speed;
                vx *= scale;
                vy *= scale;
                speed = maxSpeed;
            }
            pr.lastTime = now;
            pr.lastX = e.clientX;
            pr.lastY = e.clientY;
            pr.vx = vx;
            pr.vy = vy;
            pr.speed = speed;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            pr.x = e.clientX - rect.left;
            pr.y = e.clientY - rect.top;

            for (const dot of dotsRef.current) {
                const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
                if (speed > speedTrigger && dist < proximity && !dot._inertiaApplied) {
                    dot._inertiaApplied = true;
                    gsap.killTweensOf(dot);
                    const pushX = ((dot.cx - pr.x) / dist) * (speed / 100);
                    const pushY = ((dot.cy - pr.y) / dist) * (speed / 100);
                    gsap.to(dot, {
                        xOffset: pushX,
                        yOffset: pushY,
                        duration: resistance / 1000,
                        ease: 'power2.out',
                        onComplete: () => {
                            gsap.to(dot, {
                                xOffset: 0,
                                yOffset: 0,
                                duration: returnDuration,
                                ease: 'elastic.out(1,0.75)'
                            });
                            dot._inertiaApplied = false;
                        }
                    });
                }
            }
        };

        const onClick = (e: MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;

            for (const dot of dotsRef.current) {
                const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
                if (dist < shockRadius && !dot._inertiaApplied) {
                    dot._inertiaApplied = true;
                    gsap.killTweensOf(dot);
                    const falloff = Math.max(0, 1 - dist / shockRadius);
                    const pushX = (dot.cx - cx) * shockStrength * falloff;
                    const pushY = (dot.cy - cy) * shockStrength * falloff;
                    gsap.to(dot, {
                        xOffset: pushX,
                        yOffset: pushY,
                        duration: resistance / 1000,
                        ease: 'power2.out',
                        onComplete: () => {
                            gsap.to(dot, {
                                xOffset: 0,
                                yOffset: 0,
                                duration: returnDuration,
                                ease: 'elastic.out(1,0.75)'
                            });
                            dot._inertiaApplied = false;
                        }
                    });
                }
            }
        };

        const throttledMove = throttle(onMove, 50);
        window.addEventListener('mousemove', throttledMove);
        window.addEventListener('click', onClick);

        return () => {
            window.removeEventListener('mousemove', throttledMove);
            window.removeEventListener('click', onClick);
        };
    }, [maxSpeed, speedTrigger, proximity, resistance, returnDuration, shockRadius, shockStrength]);

    return (
        <div
            ref={wrapperRef}
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{
                maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
            }}
        >
            <canvas ref={canvasRef} className="pointer-events-auto absolute inset-0" />
        </div>
    );
};

export default DotGrid;
