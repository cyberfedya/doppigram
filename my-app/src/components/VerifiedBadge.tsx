import { Check } from 'lucide-react';

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      className="verified-badge"
      style={{ width: size, height: size }}
      title="Verified"
    >
      <Check style={{ width: size * 0.625, height: size * 0.625 }} strokeWidth={3} />
    </span>
  );
}
