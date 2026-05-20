export default function SaveBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 px-4 py-2.5 rounded-lg text-sm font-medium"
      style={{ background: '#EAF3DE', border: '0.5px solid #97C459', color: '#27500A' }}>
      ✓ {message}
    </div>
  );
}
