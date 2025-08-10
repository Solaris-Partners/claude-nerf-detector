import React from 'react';

const TestExplainer: React.FC = () => {
  const tests = [
    {
      id: 'P1',
      name: 'Algorithm Implementation',
      icon: '💻',
      description: 'Can it implement complex algorithms correctly?',
      example: 'Write kth largest element finder using heap',
      difficulty: 'Hard',
    },
    {
      id: 'P2',
      name: 'Log Parsing',
      icon: '📊',
      description: 'Can it parse and transform structured data?',
      example: 'Convert log line to JSON with specific fields',
      difficulty: 'Medium',
    },
    {
      id: 'P3',
      name: 'Bug Fixing',
      icon: '🐛',
      description: 'Can it identify and fix multiple bugs in code?',
      example: 'Fix factorial function with 2 bugs',
      difficulty: 'Medium',
    },
    {
      id: 'P4',
      name: 'Complex Generation',
      icon: '📝',
      description: 'Can it generate substantial code quickly?',
      example: 'Create complete CLI with 6 subcommands',
      difficulty: 'Hard',
    },
    {
      id: 'P5',
      name: 'Math Reasoning',
      icon: '🧮',
      description: 'Can it solve multi-step word problems?',
      example: 'Calculate distance from speed/time constraints',
      difficulty: 'Hard',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">What We're Testing</h3>
      <div className="space-y-3">
        {tests.map((test) => (
          <div key={test.id} className="flex items-start space-x-3">
            <span className="text-2xl mt-1">{test.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{test.name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  test.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : 
                  test.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  {test.difficulty}
                </span>
              </div>
              <p className="text-sm text-gray-600">{test.description}</p>
              <p className="text-xs text-gray-500 mt-1">Example: {test.example}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <strong>Why challenging tests?</strong> These tests are intentionally difficult so the model won't always score 100%. 
          This allows us to detect both improvements and degradations in capability. A typical score might be 2-3 out of 5.
        </p>
      </div>
    </div>
  );
};

export default TestExplainer;