import { useState, useEffect } from 'react';

const NgrokTest = () => {
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const res = await fetch('/api/test');
        const data = await res.text();
        setResponse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ngrok Tunnel Test</h1>
      {response && (
        <div className="bg-green-100 p-4 rounded mb-4">
          <h2 className="font-semibold">Response:</h2>
          <p>{response}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-100 p-4 rounded">
          <h2 className="font-semibold">Error:</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default NgrokTest;