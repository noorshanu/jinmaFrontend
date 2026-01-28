"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

// Helper function to generate random star data
function generateStarData() {
  return {
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  };
}

// Helper function to generate random particle data
function generateParticleData() {
  return {
    left: 20 + Math.random() * 60,
    top: 20 + Math.random() * 60,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 2,
  };
}

export default function Hero() {
  // Generate random values only on client side after mount to avoid hydration mismatch
  const [stars, setStars] = useState<Array<{ left: number; top: number; duration: number; delay: number }>>([]);
  const [particles, setParticles] = useState<Array<{ left: number; top: number; duration: number; delay: number }>>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Generate random values only on client side
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(Array.from({ length: 50 }, generateStarData));
    setParticles(Array.from({ length: 8 }, generateParticleData));
    setIsMounted(true);
  }, []);

  return (
    <>
      <section id="vision" className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background Elements */}
        <div className="absolute inset-0">
          {/* Animated stars */}
          <div className="absolute inset-0 overflow-hidden">
            {isMounted && stars.map((star, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                style={{
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: star.duration,
                  repeat: Infinity,
                  delay: star.delay,
                }}
              />
            ))}
          </div>
          
          {/* Glowing planet effect */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] rounded-full blur-3xl glow-blue opacity-60" />
          
          {/* Rocket trail effect */}
          <div className="absolute top-20 left-10 md:top-32 md:left-20 w-32 h-32 md:w-48 md:h-48 rounded-full blur-2xl bg-gradient-to-r from-blue-400/30 to-cyan-300/20 opacity-40" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 grid lg:grid-cols-12 items-center gap-10 relative z-10">
          <div className="lg:col-span-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-extrabold leading-[0.9] md:leading-[1.25]">
                <span className="bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                JINMA BTC/USDT
                </span>
                <br />
                <span className="text-white/80">Marketplace</span>
              </h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="relative"
              >
                <div className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-transparent rounded-full" />
                <p className="text-lg md:text-xl text-zinc-300 max-w-2xl pl-4">
                  Trade BTC/USDT with confidence on our secure, fast, and user-friendly marketplace. Experience seamless crypto trading with real-time prices and instant execution.
                </p>
              </motion.div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-zinc-400 max-w-2xl text-base md:text-lg leading-relaxed"
            >
              Join thousands of traders on our platform. Get access to competitive rates, low fees, and advanced trading tools designed for both beginners and experienced crypto traders.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <a 
                href="#portfolio" 
                className="btn-primary rounded-2xl px-6 py-4 font-semibold text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Explore Marketplace
              </a>
              <a 
                href="#reach" 
                className="rounded-2xl px-6 py-4 border border-white/10 text-zinc-200 hover:bg-white/5 hover:border-white/20 transition-all duration-300 text-center"
              >
                Trade Now
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="lg:col-span-6 relative"
          >
            {/* Rocket animation container */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-xl xl:max-w-2xl">
              {/* Multiple glow effects for depth */}
              <div className="absolute -top-20 -right-20 w-[120%] h-[120%] rounded-full blur-3xl glow-blue opacity-40" />
              <div className="absolute -top-10 -right-10 w-full h-full rounded-full blur-2xl bg-gradient-to-r from-blue-400/20 to-cyan-300/20 opacity-30" />
              
              {/* Rocket image with floating animation */}
              <motion.div
                animate={{
                  y: [-10, 10, -10],
                  rotate: [-1, 1, -1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <Image
                  src="/hero.png"
                  alt="Rocket Launch"
                  width={800}
                  height={800}
                  className="w-full h-auto min-h-[300px] md:min-h-[400px] lg:min-h-[500px] select-none pointer-events-none drop-shadow-2xl object-contain relative z-10"
                  draggable={false}
                  priority
                />
                
                {/* Image glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 via-transparent to-transparent rounded-full blur-xl -z-10" />
              </motion.div>
              
              {/* Additional glow effects */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-full blur-xl" />
              
              {/* Floating particles around the rocket */}
              <div className="absolute inset-0 pointer-events-none">
                {isMounted && particles.map((particle, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
                    style={{
                      left: `${particle.left}%`,
                      top: `${particle.top}%`,
                    }}
                    animate={{
                      y: [-5, 5, -5],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: particle.duration,
                      repeat: Infinity,
                      delay: particle.delay,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/60 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

 
    </>
  );
}