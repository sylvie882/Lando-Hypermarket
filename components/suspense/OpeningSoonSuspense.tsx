
// components/suspense/OpeningSoonSuspense.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Timer, Mail, Phone, MapPin, ShoppingBag, Star, Truck, Leaf } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import FlashSale from '../flash/FlashSale';
import Image from 'next/image';

export default function OpeningSoonSuspense() {
  const [isVisible, setIsVisible] = useState(true);
  const [showFlashDrop, setShowFlashDrop] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const animationFrameRef = useRef<number>();
  const countdownTimerRef = useRef<NodeJS.Timeout>();
  const flashTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Check if user has dismissed the modal before
    const dismissed = localStorage.getItem('opening-soon-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }

    // Show flash drop after a short delay
    flashTimerRef.current = setTimeout(() => {
      setShowFlashDrop(true);
      
      // Start 1 minute countdown
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Auto-dismiss flash after 60 seconds
      flashTimerRef.current = setTimeout(() => {
        setShowFlashDrop(false);
        clearInterval(countdownTimerRef.current);
      }, 60000);
    }, 1500);

    return () => {
      clearTimeout(flashTimerRef.current);
      clearInterval(countdownTimerRef.current);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Confetti animation
  useEffect(() => {
    if (!showFlashDrop || typeof window === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999998;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
    }> = [];

    const colors = ['#00f5a0', '#6a5cff', '#ffffff', '#ffe66d'];

    // Create initial burst
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        size: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 100
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 1;
        
        if (p.life <= 0 || p.y > canvas.height || p.x < 0 || p.x > canvas.width) {
          particles.splice(i, 1);
          continue;
        }
        
        ctx.save();
        ctx.globalAlpha = p.life / 100;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }
      
      if (particles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, [showFlashDrop]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('opening-soon-dismissed', 'true');
  };

  const handleFlashDismiss = () => {
    setShowFlashDrop(false);
    clearInterval(countdownTimerRef.current);
    clearTimeout(flashTimerRef.current);
  };

  const handleFlashCTA = () => {
    window.open('https://hypermarket.co.ke/lando-launch?utm_source=flash&utm_medium=onsite&utm_campaign=lando_prelaunch', '_blank');
    handleFlashDismiss();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Flash Drop Modal - SIMPLIFIED VERSION */}
      <AnimatePresence>
        {showFlashDrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden border border-green-500/20 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-purple-500/10" />
              
              {/* Header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-green-500 to-purple-500 text-white rounded-full">
                    Flash Drop
                  </span>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-bold text-white tabular-nums">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <div className="text-4xl font-black mb-3 bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
                    3…2…1…
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Lando Hypermarket is Landing!
                  </h3>
                  <p className="text-gray-300 text-sm mb-6">
                    First 500 sign-ups unlock exclusive launch-week perks. Limited time offer!
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleFlashCTA}
                  className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-purple-600 text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-purple-500/25 mb-4"
                >
                  🚀 Get Early Access →
                </button>

                {/* Footer */}
                <div className="text-center">
                  <button
                    onClick={handleFlashDismiss}
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Modal - SIMPLIFIED VERSION */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 p-1 mb-4 mx-auto">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo.jpeg"
                  alt="Logo"
                  width={72}
                  height={72}
                  className="object-cover"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              <span className="text-green-600">LANDO</span> HYPERMARKET
            </h1>
            <p className="text-gray-600 text-sm italic">
              Famous And Renowned Throughout The Land
            </p>
          </div>

          {/* Main Content Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 max-w-md w-full shadow-lg border border-green-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 px-4 py-2 rounded-full mb-4">
                <Timer className="w-4 h-4" />
                <span className="font-bold text-sm">COMING SOON</span>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Opening at Your Neighborhood!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Get ready for fresh, organic produce delivered straight to your doorstep.
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { icon: Star, text: 'Organic', color: 'text-yellow-500' },
                  { icon: Truck, text: 'Free Delivery', color: 'text-green-500' },
                  { icon: Timer, text: 'Same Day', color: 'text-blue-500' },
                  { icon: ShoppingBag, text: 'Fresh', color: 'text-emerald-500' },
                ].map((feature, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 flex flex-col items-center">
                    <feature.icon className={`w-5 h-5 ${feature.color} mb-1`} />
                    <span className="text-xs font-medium text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Signup */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Get Early Access</h3>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
                  Notify Me on Launch
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                We respect your privacy. No spam.
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-8 flex flex-col gap-3 text-sm text-gray-600 text-center">
            <div className="flex items-center justify-center gap-2">
              <Phone className="w-4 h-4 text-green-600" />
              <span>+254 716 354 589</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4 text-green-600" />
              <span>info@hypermarket.co.ke</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <span>Nairobi, Kenya</span>
            </div>
          </div>

          {/* Partner CTA */}
          <button className="mt-8 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform">
            🤝 Partner With Us →
          </button>
        </div>
      </div>
    </>
  );
}