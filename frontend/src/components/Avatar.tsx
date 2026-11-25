type AvatarProps = {
  label: string;
  seed: number;
  size?: "small" | "large";
};

export default function Avatar({ label, seed, size }: AvatarProps) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={`avatar avatar-color-${Math.abs(seed) % 6}${size ? ` avatar-${size}` : ""}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
