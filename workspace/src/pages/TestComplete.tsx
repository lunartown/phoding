import React from 'react';
import { useNavigate } from 'react-router-dom';

const TestComplete: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">테스트가 완료되었습니다!</h1>
        <p className="text-gray-600 mb-6">수고하셨습니다. 모든 테스트가 성공적으로 완료되었습니다.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default TestComplete;