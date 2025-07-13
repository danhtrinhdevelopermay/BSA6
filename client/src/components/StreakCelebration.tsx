import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StreakCelebrationProps {
  show: boolean;
  streak: number;
  message: string;
  onComplete: () => void;
}

export function StreakCelebration({ show, streak, message, onComplete }: StreakCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 500); // Wait for exit animation
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onComplete, 500);
          }}
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.5, rotate: 10 }}
            transition={{ type: "spring", duration: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-80 max-w-sm bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-300/50 shadow-2xl">
              <CardContent className="p-6 text-center">
                {/* Fire Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.8, times: [0, 0.6, 1] }}
                  className="text-6xl mb-4"
                >
                  🔥
                </motion.div>

                {/* Streak Badge */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4"
                >
                  <Badge 
                    variant="outline" 
                    className="bg-orange-500/30 text-orange-100 border-orange-400/50 text-lg px-4 py-2"
                  >
                    🔥 {streak} day streak!
                  </Badge>
                </motion.div>

                {/* Message */}
                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl font-bold text-foreground mb-2"
                >
                  Streak Updated!
                </motion.h3>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-muted-foreground text-sm"
                >
                  {message}
                </motion.p>

                {/* Sparkle Effects */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      scale: 0, 
                      x: 0, 
                      y: 0, 
                      rotate: 0 
                    }}
                    animate={{ 
                      scale: [0, 1, 0], 
                      x: Math.cos(i * 60) * 100,
                      y: Math.sin(i * 60) * 100,
                      rotate: 360 
                    }}
                    transition={{ 
                      duration: 2, 
                      delay: 0.2 + i * 0.1,
                      ease: "easeOut" 
                    }}
                    className="absolute text-yellow-400 text-2xl pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                  >
                    ✨
                  </motion.div>
                ))}

                {/* Progress Indicator */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 3 }}
                  className="w-full h-1 bg-orange-500/30 rounded-full mt-4 origin-left"
                />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}