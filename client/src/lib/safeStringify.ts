/**
 * Safely stringify objects that may contain circular references
 */
export function safeStringify(obj: any, space?: number): string {
  const seen = new WeakSet();
  
  return JSON.stringify(obj, (key, value) => {
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
      
      // Handle common browser objects that can't be stringified
      if (value instanceof Window) {
        return '[Window]';
      }
      if (value instanceof Document) {
        return '[Document]';
      }
      if (value instanceof HTMLElement) {
        return `[HTMLElement: ${value.tagName}]`;
      }
      if (value instanceof Event) {
        return `[Event: ${value.type}]`;
      }
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      }
    }
    
    return value;
  }, space);
}

