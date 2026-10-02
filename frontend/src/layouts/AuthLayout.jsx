export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-primary-900 to-navy-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
