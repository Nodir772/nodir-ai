import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  alt,
  size = 36,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
