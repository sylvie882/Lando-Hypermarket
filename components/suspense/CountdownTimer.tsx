// components/suspense/CountdownTimer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const difference = +targetDate - +new Date();
    
    let timeLeft: TimeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { label: 'Days', value: timeLeft.days, color: 'bg-green-500' },
    { label: 'Hours', value: timeLeft.hours, color: 'bg-emerald-500' },
    { label: 'Minutes', value: timeLeft.minutes, color: 'bg-teal-500' },
    { label: 'Seconds', value: timeLeft.seconds, color: 'bg-cyan-500' },
  ];

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-200">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Timer className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-bold text-gray-800">Launching In</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {timeUnits.map((unit, index) => (
          <div key={index} className="text-center">
            <div className={`${unit.color} text-white font-bold text-3xl md:text-4xl py-4 rounded-xl shadow-lg`}>
              {unit.value.toString().padStart(2, '0')}
            </div>
            <p className="text-gray-600 font-medium mt-2">{unit.label}</p>
          </div>
        ))}
      </div>
      
      <p className="text-center text-gray-500 mt-4 text-sm">
        We're counting down to our grand opening!
      </p>
    </div>
  );
}