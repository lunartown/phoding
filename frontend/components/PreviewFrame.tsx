'use client';

interface PreviewFrameProps {
  url: string;
}

export default function PreviewFrame({ url }: PreviewFrameProps) {
  if (!url) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No preview available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Start by sending an instruction in the Chat tab
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      <iframe
        src={url}
        className="h-full w-full border-0"
        title="Preview"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}
