import React from 'react';
import clsx from 'clsx';

interface AdaptiveHealthScoreProps {
  current: {
    correctness: number;
    ttft: number;
    tokensPerSec: number;
    errorRate: number;
    outputTokens: number;
  };
  baseline: {
    avgCorrectness: number;
    avgTtftMedian: number;
    avgTokensPerSecMedian: number;
    avgErrorRate: number;
    avgOutputTokens: number;
  } | null;
  runCount: number;
}

const AdaptiveHealthScore: React.FC<AdaptiveHealthScoreProps> = ({ current, baseline, runCount }) => {
  // If we don't have enough data for a baseline, show "establishing baseline"
  const isEstablishingBaseline = runCount < 5 || !baseline;
  
  // Calculate relative performance (0-100)
  const calculateRelativeScore = () => {
    if (isEstablishingBaseline) {
      // During baseline establishment, just show raw performance
      let score = 0;
      score += (current.correctness / 4) * 25; // 25% weight
      score += current.ttft <= 3 ? 25 : current.ttft <= 10 ? 15 : 5; // 25% weight
      score += current.tokensPerSec >= 3 ? 25 : current.tokensPerSec >= 1 ? 15 : 5; // 25% weight
      score += (1 - current.errorRate) * 25; // 25% weight
      return Math.round(score);
    }
    
    // Compare against baseline
    let score = 50; // Start at neutral
    
    // Correctness change (±20 points)
    const correctnessDiff = current.correctness - baseline.avgCorrectness;
    score += (correctnessDiff / 4) * 20;
    
    // Speed change (±15 points)
    const ttftChange = (baseline.avgTtftMedian - current.ttft) / baseline.avgTtftMedian;
    score += ttftChange * 15;
    
    // Generation speed change (±15 points)
    const tpsChange = (current.tokensPerSec - baseline.avgTokensPerSecMedian) / baseline.avgTokensPerSecMedian;
    score += tpsChange * 15;
    
    // Error rate change (±10 points)
    const errorChange = baseline.avgErrorRate - current.errorRate;
    score += errorChange * 100 * 10;
    
    // Output length change (±10 points) - detecting if model is outputting less
    const outputChange = (current.outputTokens - baseline.avgOutputTokens) / baseline.avgOutputTokens;
    score += Math.min(outputChange * 10, 10); // Cap at +10
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };
  
  const score = calculateRelativeScore();
  
  const getHealthLevel = () => {
    if (isEstablishingBaseline) {
      return { 
        text: 'Establishing Baseline', 
        color: 'text-blue-600', 
        bg: 'bg-blue-100', 
        emoji: '📊',
        description: `Collecting data (${runCount}/5 runs needed)`
      };
    }
    
    if (score >= 90) return { 
      text: 'Significantly Better', 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      emoji: '🚀',
      description: 'Performance has improved notably from baseline'
    };
    if (score >= 70) return { 
      text: 'Improved', 
      color: 'text-green-500', 
      bg: 'bg-green-50', 
      emoji: '📈',
      description: 'Performing better than typical'
    };
    if (score >= 40) return { 
      text: 'Normal', 
      color: 'text-gray-600', 
      bg: 'bg-gray-100', 
      emoji: '✅',
      description: 'Performance is within normal range'
    };
    if (score >= 20) return { 
      text: 'Degraded', 
      color: 'text-orange-600', 
      bg: 'bg-orange-100', 
      emoji: '⚠️',
      description: 'Performance has declined from baseline'
    };
    return { 
      text: 'Severely Degraded', 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      emoji: '🔥',
      description: 'Major performance degradation detected!'
    };
  };
  
  const health = getHealthLevel();
  
  const getChanges = () => {
    if (isEstablishingBaseline) {
      return {
        correctness: { value: current.correctness, change: null },
        ttft: { value: current.ttft, change: null },
        tokensPerSec: { value: current.tokensPerSec, change: null },
        errorRate: { value: current.errorRate, change: null },
      };
    }
    
    return {
      correctness: {
        value: current.correctness,
        change: ((current.correctness - baseline.avgCorrectness) / baseline.avgCorrectness * 100).toFixed(0),
      },
      ttft: {
        value: current.ttft,
        change: ((baseline.avgTtftMedian - current.ttft) / baseline.avgTtftMedian * 100).toFixed(0),
      },
      tokensPerSec: {
        value: current.tokensPerSec,
        change: ((current.tokensPerSec - baseline.avgTokensPerSecMedian) / baseline.avgTokensPerSecMedian * 100).toFixed(0),
      },
      errorRate: {
        value: current.errorRate,
        change: ((baseline.avgErrorRate - current.errorRate) * 100).toFixed(0),
      },
    };
  };
  
  const changes = getChanges();
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Model Performance Status</h2>
        <span className="text-3xl">{health.emoji}</span>
      </div>
      
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-5xl font-bold">
              {isEstablishingBaseline ? '--' : `${score}%`}
            </span>
            <span className={clsx('ml-3 text-lg font-medium px-3 py-1 rounded-full', health.color, health.bg)}>
              {health.text}
            </span>
          </div>
        </div>
        
        {!isEstablishingBaseline && (
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className={clsx('h-4 rounded-full transition-all duration-500',
                score >= 70 ? 'bg-green-500' :
                score >= 40 ? 'bg-gray-500' :
                score >= 20 ? 'bg-orange-500' :
                'bg-red-500'
              )}
              style={{ width: `${score}%` }}
            />
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        <p className="font-medium mb-1">Status:</p>
        <p>{health.description}</p>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <h3 className="font-medium text-sm text-gray-700 mb-3">
          {isEstablishingBaseline ? 'Current Metrics' : 'Change from Baseline'}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <MetricChange
            label="Accuracy"
            value={`${changes.correctness.value}/4`}
            change={changes.correctness.change}
            improved={changes.correctness.change ? parseFloat(changes.correctness.change) >= 0 : null}
          />
          <MetricChange
            label="Response Speed"
            value={`${changes.ttft.value.toFixed(1)}s`}
            change={changes.ttft.change}
            improved={changes.ttft.change ? parseFloat(changes.ttft.change) >= 0 : null}
          />
          <MetricChange
            label="Generation Speed"
            value={`${changes.tokensPerSec.value.toFixed(1)} t/s`}
            change={changes.tokensPerSec.change}
            improved={changes.tokensPerSec.change ? parseFloat(changes.tokensPerSec.change) >= 0 : null}
          />
          <MetricChange
            label="Error Rate"
            value={`${(changes.errorRate.value * 100).toFixed(0)}%`}
            change={changes.errorRate.change}
            improved={changes.errorRate.change ? parseFloat(changes.errorRate.change) >= 0 : null}
          />
        </div>
      </div>
      
      {isEstablishingBaseline && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>📊 Building Baseline:</strong> Run {runCount} more test{runCount !== 1 ? 's' : ''} to establish 
            your model's normal performance range. After 5 runs, we'll start detecting changes.
          </p>
        </div>
      )}
      
      {!isEstablishingBaseline && score < 40 && (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
          <p className="text-xs text-orange-800">
            <strong>⚠️ Performance Alert:</strong> The model is performing significantly worse than its baseline. 
            This could indicate the model has been modified ("nerfed") or is experiencing issues.
          </p>
        </div>
      )}
    </div>
  );
};

const MetricChange: React.FC<{
  label: string;
  value: string;
  change: string | null;
  improved: boolean | null;
}> = ({ label, value, change, improved }) => {
  return (
    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
      <span className="text-gray-600">{label}:</span>
      <div className="text-right">
        <span className="font-medium">{value}</span>
        {change !== null && (
          <span className={clsx('ml-1 text-xs', 
            improved ? 'text-green-600' : 'text-red-600'
          )}>
            {improved ? '↑' : '↓'}{Math.abs(parseFloat(change))}%
          </span>
        )}
      </div>
    </div>
  );
};

export default AdaptiveHealthScore;