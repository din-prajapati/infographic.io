/**
 * TEMPORARY — Task 3E (P-24) source-map verification. Delete this file and its
 * route in App.tsx once the Sentry event's stack trace has been confirmed to
 * resolve to this file/line instead of a minified bundle hash.
 */
export default function SentryTestPage() {
  return (
    <div style={{ padding: 40 }}>
      <button
        onClick={() => {
          throw new Error('Sentry source-map test — SentryTestPage.tsx onClick');
        }}
      >
        Throw test error (Sentry source-map check)
      </button>
    </div>
  );
}
