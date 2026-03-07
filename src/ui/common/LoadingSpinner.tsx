/**
 * Animated loading spinner with optional message.
 */
export default function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3"
      role="status"
      aria-label="Loading"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-3 border-gray-200 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400" />
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}
