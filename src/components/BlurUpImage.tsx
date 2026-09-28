import React, { useState } from "react";
import { ShoppingBasket } from "lucide-react";

interface BlurUpImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
}

export const BlurUpImage: React.FC<BlurUpImageProps> = ({
  src,
  alt,
  className = "",
  containerClassName = "",
  fallbackIcon,
  priority = false,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative size-full overflow-hidden ${containerClassName}`}>
      {/* Blur-Up Frosted Placeholder Background */}
      {!isLoaded && !hasError && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-gradient-to-tr from-emerald-100/70 via-[#F8F7F2] to-amber-100/60 backdrop-blur-md animate-pulse"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent" />
        </div>
      )}

      {/* Main Image with Progressive Blur-Up & Scale In */}
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`size-full object-cover transition-all duration-700 ease-out will-change-[filter,transform,opacity] ${
            isLoaded
              ? "opacity-100 blur-0 scale-100"
              : "opacity-0 blur-md scale-105"
          } ${className}`}
          {...rest}
        />
      ) : (
        <div className="size-full flex items-center justify-center bg-emerald-500/10 text-primary/70">
          {fallbackIcon || <ShoppingBasket className="size-8" />}
        </div>
      )}
    </div>
  );
};
