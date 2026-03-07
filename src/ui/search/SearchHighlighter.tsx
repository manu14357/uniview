/**
 * Search highlight overlay — marks matching text with a visual highlight.
 */
export default function SearchHighlighter({
  matches,
}: {
  matches: Array<{ x: number; y: number; width: number; height: number }>;
}) {
  if (matches.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {matches.map((match, i) => (
        <div
          key={i}
          className="absolute rounded-sm bg-yellow-300/50 ring-1 ring-yellow-400"
          style={{
            left: match.x,
            top: match.y,
            width: match.width,
            height: match.height,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
