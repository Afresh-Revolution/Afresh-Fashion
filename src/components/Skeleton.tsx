import sk from "@/styles/skeleton.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  rounded?: boolean | "full";
};

export function Skeleton({ className, style, rounded }: Props) {
  const roundedClass =
    rounded === true ? sk.rounded : rounded === "full" ? sk.roundedFull : "";

  return (
    <div
      className={[sk.bone, roundedClass, className].filter(Boolean).join(" ")}
      style={style}
      aria-hidden
    />
  );
}
