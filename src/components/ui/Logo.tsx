interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 38, className = "" }: LogoProps) {
  return (
    <div style={{ width: size, height: size }} className={`flex-shrink-0 ${className}`}>
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        width={size}
        height={size}
      >
        <rect width="44" height="44" rx="10" style={{ fill: "var(--logo-bg)" }} />
        <path
          d="M22 8 L36 30 L8 30 Z M22 16 L29 30 L15 30 Z"
          fillRule="evenodd"
          style={{ fill: "var(--logo-peak)" }}
        />
        <rect x="13" y="33" width="18" height="2.5" rx="1.25" style={{ fill: "var(--logo-accent)" }} />
      </svg>
    </div>
  );
}
