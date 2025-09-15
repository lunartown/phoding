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
      <div className="h-full flex flex-col">
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                {url}
              </span>
            </div>
          </div>
        </div>
        <iframe
          src={url}
          className="flex-1 w-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}