/**
 * Timestamp Divider Component
 * Shows date/time between message groups
 */

interface TimestampDividerProps {
  timestamp: Date;
}

export function TimestampDivider({ timestamp }: TimestampDividerProps) {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 bg-gray-100 rounded-full">
        <span className="text-xs text-gray-500">{formatTimestamp(timestamp)}</span>
      </div>
    </div>
  );
}
