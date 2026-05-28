export function CoralWordmark({ height = 28 }: { height?: number }) {
  return (
    <img
      src="/coral-wordmark-dark.svg"
      alt="Coral"
      style={{ height: `${height}px`, width: "auto" }}
      className="block opacity-85 brightness-0"
    />
  );
}
