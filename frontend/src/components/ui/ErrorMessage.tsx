interface ErrorMessageProps {
  message?: string;
}

export default function ErrorMessage({
  message = "Something went wrong. Please try again.",
}: ErrorMessageProps) {
  return (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600">
      {message}
    </div>
  );
}