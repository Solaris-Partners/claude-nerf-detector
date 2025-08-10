import React from 'react';
import clsx from 'clsx';

interface HealthScoreProps {
  correctness: number;
  ttft: number;
  tokensPerSec: number;
  errorRate: number;
}

const HealthScore: React.FC<HealthScoreProps> = ({ correctness, ttft, tokensPerSec, errorRate }) => {
  // Calculate health score (0-100)
  const calculateHealthScore = () => {
    let score = 0;
    
    // Correctness: 40 points (0-4 scale)
    score += (correctness / 4) * 40;
    
    // Speed: 30 points (TTFT under 2s is good)
    if (ttft <= 1) score += 30;
    else if (ttft <= 2) score += 25;
    else if (ttft <= 3) score += 15;
    else if (ttft <= 5) score += 5;
    
    // Generation speed: 20 points (5+ tokens/sec is good)
    if (tokensPerSec >= 10) score += 20;
    else if (tokensPerSec >= 5) score += 15;
    else if (tokensPerSec >= 2) score += 10;
    else if (tokensPerSec >= 1) score += 5;
    
    // Reliability: 10 points (no errors)
    score += (1 - errorRate) * 10;
    
    return Math.round(score);
  };
  
  const score = calculateHealthScore();
  
  const getHealthLevel = () => {
    if (score >= 80) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-100', emoji: '🚀' };
    if (score >= 60) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-100', emoji: '👍' };
    if (score >= 40) return { text: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '⚠️' };
    if (score >= 20) return { text: 'Poor', color: 'text-orange-600', bg: 'bg-orange-100', emoji: '⚡' };
    return { text: 'Critical', color: 'text-red-600', bg: 'bg-red-100', emoji: '🔥' };
  };
  
  const health = getHealthLevel();
  
  const getExplanation = () => {
    const issues = [];
    
    if (correctness === 0) {
      issues.push("Model isn't answering questions correctly");
    }
    if (ttft > 3) {
      issues.push("Taking too long to start responding");
    }
    if (tokensPerSec < 2) {
      issues.push("Generating text very slowly");
    }
    if (errorRate > 0.1) {
      issues.push("Experiencing frequent errors");
    }
    
    if (issues.length === 0) {
      return "Model is performing well across all metrics";
    }
    
    return issues.join(". ");
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Model Health</h2>
        <span className="text-3xl">{health.emoji}</span>
      </div>
      
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <span className="text-5xl font-bold">{score}%</span>
          <span className={clsx('text-lg font-medium px-3 py-1 rounded-full', health.color, health.bg)}>
            {health.text}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div 
            className={clsx('h-4 rounded-full transition-all duration-500',
              score >= 80 ? 'bg-green-500' :
              score >= 60 ? 'bg-blue-500' :
              score >= 40 ? 'bg-yellow-500' :
              score >= 20 ? 'bg-orange-500' :
              'bg-red-500'
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p className="font-medium mb-2">What this means:</p>
        <p>{getExplanation()}</p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Accuracy:</span>
            <span className={correctness > 2 ? 'text-green-600' : 'text-red-600'}>
              {correctness === 0 ? 'Failing' : correctness < 3 ? 'Poor' : 'Good'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Response Speed:</span>
            <span className={ttft < 2 ? 'text-green-600' : ttft < 4 ? 'text-yellow-600' : 'text-red-600'}>
              {ttft < 2 ? 'Fast' : ttft < 4 ? 'OK' : 'Slow'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Generation:</span>
            <span className={tokensPerSec > 5 ? 'text-green-600' : tokensPerSec > 2 ? 'text-yellow-600' : 'text-red-600'}>
              {tokensPerSec > 5 ? 'Fast' : tokensPerSec > 2 ? 'OK' : 'Slow'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reliability:</span>
            <span className={errorRate === 0 ? 'text-green-600' : errorRate < 0.05 ? 'text-yellow-600' : 'text-red-600'}>
              {errorRate === 0 ? 'Perfect' : errorRate < 0.05 ? 'Good' : 'Issues'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthScore;