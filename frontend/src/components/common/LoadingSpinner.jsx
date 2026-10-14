export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = { sm: 'h-5 w-5', md: 'h-10 w-10', lg: 'h-14 w-14' };
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-primary-200 rounded-full animate-spin`} />
        <div className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-t-primary-600 rounded-full animate-spin`} style={{ animationDuration: '1.5s' }} />
      </div>
      {text && (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-600">{text}</p>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      )}
    </div>
  );
}
