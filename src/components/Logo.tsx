import Image from "next/image";
import styles from "@/styles/logo.module.scss";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  className?: string;
  priority?: boolean;
}

const SIZES: Record<LogoSize, number> = {
  sm: 32,
  md: 40,
  lg: 52,
};

export default function Logo({ size = "md", className = "", priority = false }: LogoProps) {
  const dim = SIZES[size];
  return (
    <Image
      src="/logo.png"
      alt="AFRESH"
      width={dim}
      height={dim}
      className={`${styles.logo} ${styles[size]} ${className}`.trim()}
      priority={priority}
    />
  );
}
