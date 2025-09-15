'use client';

interface Operation {
  type: 'create' | 'update' | 'delete' | 'rename';
  path?: string;
  oldPath?: string;
  newPath?: string;
  content?: string;
  timestamp?: string;
}

interface OperationsLogProps {
  operations: Operation[];
}

export default function OperationsLog({ operations }: OperationsLogProps) {
  const getOperationIcon = (type: Operation['type']) => {
    switch (type) {
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'rename':
        return '📝';
      default:
        return '📄';
    }
  };

  const getOperationColor = (type: Operation['type']) => {
    switch (type) {
      case 'create':
        return 'text-green-600 dark:text-green-400';
      case 'update':
        return 'text-blue-600 dark:text-blue-400';
      case 'delete':
        return 'text-red-600 dark:text-red-400';
      case 'rename':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      {operations.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">No operations yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {operations.map((operation, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getOperationIcon(operation.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-medium capitalize ${getOperationColor(
                        operation.type
                      )}`}
                    >
                      {operation.type}
                    </span>
                    {operation.timestamp && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(operation.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    {operation.type === 'rename' ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                          {operation.oldPath}
                        </span>
                        {' → '}
                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                          {operation.newPath}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                          {operation.path}
                        </span>
                      </p>
                    )}
                  </div>
                  {operation.content && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        View content ({operation.content.length} characters)
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                        <code>{operation.content.substring(0, 500)}
                          {operation.content.length > 500 && '...'}</code>
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}