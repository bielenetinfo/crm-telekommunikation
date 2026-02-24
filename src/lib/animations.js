/**
 * Centralized Framer Motion animation variants and utilities
 * for consistent animations across the CRM application
 */

// Page transition variants
export const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1], // Custom easing
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
        },
    },
};

// Fade in animation
export const fadeIn = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: 0.3 },
    },
    exit: { opacity: 0 },
};

// Slide up animation
export const slideUp = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: { opacity: 0, y: -10 },
};

// Slide down animation
export const slideDown = {
    initial: { opacity: 0, y: -20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: { opacity: 0, y: 10 },
};

// Scale animation
export const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: { opacity: 0, scale: 0.95 },
};

// Stagger children animation
export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

// Individual stagger items
export const staggerItem = {
    initial: { opacity: 0, y: 12 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        },
    },
};

// Card hover animation
export const cardHover = {
    rest: {
        scale: 1,
        y: 0,
    },
    hover: {
        scale: 1.02,
        y: -4,
        transition: {
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    tap: {
        scale: 0.98,
    },
};

// Button press animation
export const buttonPress = {
    rest: { scale: 1 },
    tap: {
        scale: 0.95,
        transition: { duration: 0.1 },
    },
};

// Smooth number counter spring config
export const counterSpring = {
    type: 'spring',
    stiffness: 100,
    damping: 30,
    mass: 1,
};

// Modal/Dialog animations
export const modalVariants = {
    initial: {
        opacity: 0,
        scale: 0.95,
        y: 20,
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: {
            duration: 0.2,
        },
    },
};

// Backdrop animations
export const backdropVariants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: 0.2 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 },
    },
};

// List item entrance (from left)
export const listItemSlideIn = {
    initial: { opacity: 0, x: -20 },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    exit: { opacity: 0, x: 20 },
};

// Rotate in animation
export const rotateIn = {
    initial: { opacity: 0, rotate: -10 },
    animate: {
        opacity: 1,
        rotate: 0,
        transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
        },
    },
};

// Pulse animation (for notifications, badges, etc.)
export const pulse = {
    scale: [1, 1.05, 1],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
    },
};

// Shimmer loading animation
export const shimmer = {
    initial: { backgroundPosition: '-200% 0' },
    animate: {
        backgroundPosition: '200% 0',
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

// Success checkmark animation
export const successCheck = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
        pathLength: 1,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: 'easeInOut',
        },
    },
};

// Skeleton loader animation
export const skeletonPulse = {
    animate: {
        opacity: [0.5, 0.8, 0.5],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// Utility: Create stagger container with custom delay
export const createStaggerContainer = (staggerDelay = 0.08, initialDelay = 0.1) => ({
    initial: {},
    animate: {
        transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
        },
    },
});

// Utility: Create custom slide animation
export const createSlide = (direction = 'up', distance = 20, duration = 0.4) => {
    const directions = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
    };

    return {
        initial: { opacity: 0, ...directions[direction] },
        animate: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration,
                ease: [0.4, 0, 0.2, 1],
            },
        },
        exit: { opacity: 0, ...directions[direction] },
    };
};
