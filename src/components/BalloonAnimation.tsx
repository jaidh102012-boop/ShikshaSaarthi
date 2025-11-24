import React, { useEffect, useState } from 'react';

interface BalloonAnimationProps {
  onComplete: () => void;
}

export default function BalloonAnimation({ onComplete }: BalloonAnimationProps) {
  const [phase, setPhase] = useState<'flying' | 'exploding' | 'complete'>('flying');

  useEffect(() => {
    // Flying phase - 2 seconds
    const flyingTimer = setTimeout(() => {
      setPhase('exploding');
    }, 2000);

    return () => clearTimeout(flyingTimer);
  }, []);

  useEffect(() => {
    if (phase === 'exploding') {
      // Explosion phase - 1 second
      const explosionTimer = setTimeout(() => {
        setPhase('complete');
        onComplete();
      }, 1000);

      return () => clearTimeout(explosionTimer);
    }
  }, [phase, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-300 flex items-center justify-center overflow-hidden relative">
      {/* Clouds */}
      <div className="absolute top-20 left-10 w-20 h-12 bg-white rounded-full opacity-70 animate-pulse"></div>
      <div className="absolute top-32 right-20 w-16 h-8 bg-white rounded-full opacity-60 animate-pulse delay-300"></div>
      <div className="absolute top-40 left-1/3 w-24 h-10 bg-white rounded-full opacity-50 animate-pulse delay-700"></div>

      {/* Sun */}
      <div className="absolute top-16 right-16 w-16 h-16 bg-yellow-300 rounded-full animate-spin" style={{ animationDuration: '10s' }}>
        <div className="absolute inset-2 bg-yellow-400 rounded-full"></div>
      </div>

      {/* Balloon */}
      <div className="relative">
        {phase === 'flying' && (
          <div className="animate-bounce">
            <div 
              className="w-32 h-40 bg-gradient-to-b from-red-400 to-red-600 rounded-full relative shadow-lg transform transition-all duration-2000"
              style={{
                animation: 'flyUp 2s ease-in-out'
              }}
            >
              {/* Balloon highlight */}
              <div className="absolute top-4 left-6 w-8 h-12 bg-red-300 rounded-full opacity-60"></div>
              
              {/* Balloon string */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-20 bg-gray-600"></div>
              
              {/* Basket */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-8 h-6 bg-amber-700 rounded-sm"></div>
            </div>
          </div>
        )}

        {phase === 'exploding' && (
          <div className="relative">
            {/* Explosion particles */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-red-500 rounded-full animate-ping"
                style={{
                  left: `${Math.cos(i * 30 * Math.PI / 180) * 60}px`,
                  top: `${Math.sin(i * 30 * Math.PI / 180) * 60}px`,
                  animationDelay: `${i * 50}ms`,
                  animationDuration: '0.8s'
                }}
              ></div>
            ))}
            
            {/* Flash effect */}
            <div className="absolute inset-0 w-40 h-40 bg-white rounded-full animate-ping opacity-75"></div>
            
            {/* Explosion text */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-4xl font-bold text-red-600 animate-bounce">
              💥
            </div>
          </div>
        )}
      </div>

      {/* Loading text */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
        <h1 className="text-4xl font-bold text-white mb-2 animate-pulse">KV No.2</h1>
        <p className="text-white text-lg">School Management System</p>
        {phase === 'flying' && (
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flyUp {
          0% {
            transform: translateY(100vh) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-20px) scale(1);
            opacity: 1;
          }
        }
      `}} />
    </div>
  );
}