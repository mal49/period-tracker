import { motion } from 'framer-motion';

interface MascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'sleepy' | 'love' | 'wink' | 'excited';
  className?: string;
  animate?: boolean;
}

const sizes = {
  sm: 48,
  md: 72,
  lg: 96,
  xl: 128,
};

/**
 * Awa mascot — a cute round blob character in soft pastels.
 * Simple, warm, and friendly.
 */
export function Mascot({ size = 'md', mood = 'happy', className = '', animate = true }: MascotProps) {
  const s = sizes[size];

  const eyes = {
    happy: (
      <>
        <circle cx="37" cy="46" r="3.5" fill="#5C4448" />
        <circle cx="63" cy="46" r="3.5" fill="#5C4448" />
        <circle cx="38.5" cy="44.5" r="1.2" fill="white" />
        <circle cx="64.5" cy="44.5" r="1.2" fill="white" />
      </>
    ),
    sleepy: (
      <>
        <path d="M33 47 Q37 44, 41 47" stroke="#5C4448" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M59 47 Q63 44, 67 47" stroke="#5C4448" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
    love: (
      <>
        {/* Heart eyes */}
        <path d="M34 44 C34 41, 37 40, 37 43 C37 40, 40 41, 40 44 C40 47, 37 49, 37 49 C37 49, 34 47, 34 44Z" fill="#F2A5BE" />
        <path d="M60 44 C60 41, 63 40, 63 43 C63 40, 66 41, 66 44 C66 47, 63 49, 63 49 C63 49, 60 47, 60 44Z" fill="#F2A5BE" />
      </>
    ),
    wink: (
      <>
        <circle cx="37" cy="46" r="3.5" fill="#5C4448" />
        <circle cx="38.5" cy="44.5" r="1.2" fill="white" />
        <path d="M59 47 Q63 44, 67 47" stroke="#5C4448" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
    excited: (
      <>
        <ellipse cx="37" cy="45" rx="4" ry="4.5" fill="#5C4448" />
        <ellipse cx="63" cy="45" rx="4" ry="4.5" fill="#5C4448" />
        <circle cx="38.5" cy="43" r="1.5" fill="white" />
        <circle cx="64.5" cy="43" r="1.5" fill="white" />
      </>
    ),
  };

  const mouth = {
    happy: <path d="M44 56 Q50 62, 56 56" stroke="#5C4448" strokeWidth="2" fill="none" strokeLinecap="round" />,
    sleepy: <path d="M46 57 Q50 59, 54 57" stroke="#5C4448" strokeWidth="1.8" fill="none" strokeLinecap="round" />,
    love: <path d="M44 56 Q50 63, 56 56" stroke="#5C4448" strokeWidth="2" fill="none" strokeLinecap="round" />,
    wink: (
      <>
        <path d="M44 56 Q50 62, 56 56" stroke="#5C4448" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="56" cy="55" r="1" fill="#5C4448" />
      </>
    ),
    excited: (
      <ellipse cx="50" cy="58" rx="6" ry="5" fill="#5C4448">
        <animate attributeName="ry" values="5;5.5;5" dur="1s" repeatCount="indefinite" />
      </ellipse>
    ),
  };

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate
    ? {
        className: `mascot-bounce mascot-wiggle inline-flex ${className}`,
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      }
    : { className: `inline-flex ${className}` };

  return (
    <Wrapper {...wrapperProps}>
      <svg width={s} height={s} viewBox="0 0 100 100" fill="none">
        {/* Body — soft pastel pink blob */}
        <ellipse cx="50" cy="54" rx="34" ry="32" fill="#FFE0EE" />
        <ellipse cx="50" cy="54" rx="34" ry="32" fill="url(#bodyGrad)" />

        {/* Cheek blush — softer pastel */}
        <ellipse cx="30" cy="54" rx="7" ry="5" fill="#FFC8D8" opacity="0.5" />
        <ellipse cx="70" cy="54" rx="7" ry="5" fill="#FFC8D8" opacity="0.5" />

        {/* Little ears/bumps */}
        <ellipse cx="26" cy="32" rx="8" ry="7" fill="#FFE0EE" />
        <ellipse cx="26" cy="32" rx="8" ry="7" fill="url(#bodyGrad)" />
        <ellipse cx="74" cy="32" rx="8" ry="7" fill="#FFE0EE" />
        <ellipse cx="74" cy="32" rx="8" ry="7" fill="url(#bodyGrad)" />

        {/* Inner ears — pastel */}
        <ellipse cx="26" cy="32" rx="4.5" ry="4" fill="#FFC8D8" opacity="0.4" />
        <ellipse cx="74" cy="32" rx="4.5" ry="4" fill="#FFC8D8" opacity="0.4" />

        {/* Little flower on head — pastel tones */}
        <g transform="translate(50, 22)">
          <circle cx="0" cy="0" r="5" fill="#F2A5BE" opacity="0.7" />
          <circle cx="0" cy="-4" r="2.5" fill="#F5C4D4" />
          <circle cx="3.5" cy="-1" r="2.5" fill="#F5C4D4" />
          <circle cx="-3.5" cy="-1" r="2.5" fill="#F5C4D4" />
          <circle cx="2" cy="3" r="2.5" fill="#F5C4D4" />
          <circle cx="-2" cy="3" r="2.5" fill="#F5C4D4" />
          <circle cx="0" cy="0" r="2.5" fill="#FFE8F2" />
        </g>

        {/* Eyes */}
        {eyes[mood]}

        {/* Mouth */}
        {mouth[mood]}

        {/* Tiny feet */}
        <ellipse cx="38" cy="84" rx="8" ry="4" fill="#FFE0EE" />
        <ellipse cx="62" cy="84" rx="8" ry="4" fill="#FFE0EE" />

        {/* Gradient defs */}
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFF0F6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFE0EE" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </Wrapper>
  );
}

/**
 * Speech bubble component to pair with the mascot
 */
export function SpeechBubble({
  children,
  direction = 'left',
  className = '',
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const arrowPosition = {
    left: 'left-6',
    right: 'right-6',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`relative bg-card rounded-2xl px-4 py-3 card-soft ${className}`}>
      <div
        className={`absolute -bottom-2 ${arrowPosition[direction]} w-4 h-4 bg-card rotate-45 rounded-sm`}
      />
      <div className="relative z-10 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}
