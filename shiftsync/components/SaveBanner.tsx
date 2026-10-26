export default function SaveBanner({ message, kind = 'success' }: { message: string; kind?: 'success' | 'error' }) {
  const error = kind === 'error';
  return (
    <div role={error ? 'alert' : 'status'} className="mb-4 px-4 py-2.5 rounded-lg text-sm font-medium"
      style={error
        ? { background: '#FFEBEE', border: '0.5px solid #EF9A9A', color: '#B71C1C' }
        : { background: '#EAF3DE', border: '0.5px solid #97C459', color: '#27500A' }}>
      {error ? '⚠' : '✓'} {message}
    </div>
  );
}
