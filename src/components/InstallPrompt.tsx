import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Smartphone,
  Share,
  MoreVertical,
  Plus,
  Download,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/Mascot';

interface InstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallPrompt({ isOpen, onClose }: InstallPromptProps) {
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');

  const androidSteps = [
    {
      icon: MoreVertical,
      text: 'Open Chrome and tap the three-dot menu (⋮) at the top right',
    },
    {
      icon: Download,
      text: 'Tap "Add to Home screen" or "Install app"',
    },
    {
      icon: Check,
      text: 'Tap "Add" to confirm — Wawa will appear on your home screen!',
    },
  ];

  const iosSteps = [
    {
      icon: Share,
      text: 'Open Safari and tap the Share button at the bottom',
    },
    {
      icon: Plus,
      text: 'Scroll down and tap "Add to Home Screen"',
    },
    {
      icon: Check,
      text: 'Tap "Add" in the top right — Wawa will appear on your home screen!',
    },
  ];

  const steps = platform === 'android' ? androidSteps : iosSteps;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm bg-background rounded-3xl shadow-xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 size-8 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>

            <div className="p-6 pt-5">
              {/* Header */}
              <div className="text-center mb-5">
                <Mascot size="md" mood="happy" className="mx-auto mb-3" />
                <h2 className="text-lg font-extrabold text-foreground mb-1">
                  Install Wawa on Your Phone
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Add to your home screen for quick access — just like a real app!
                </p>
              </div>

              {/* Platform toggle */}
              <div className="flex gap-2 mb-5 bg-card card-soft rounded-2xl p-1.5">
                <button
                  onClick={() => setPlatform('android')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                    platform === 'android'
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Smartphone className="size-4" />
                  Android
                </button>
                <button
                  onClick={() => setPlatform('ios')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                    platform === 'ios'
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Smartphone className="size-4" />
                  iOS
                </button>
              </div>

              {/* Steps */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-2.5"
                >
                  {steps.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.1 }}
                      className="flex items-center gap-3 text-left rounded-2xl bg-card card-soft p-3.5"
                    >
                      <div className="size-9 rounded-xl bg-[var(--blush)] dark:bg-primary/15 flex items-center justify-center shrink-0 relative">
                        <span className="absolute -top-1 -left-1 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <item.icon className="size-4 text-primary" />
                      </div>
                      <span className="text-sm text-foreground font-semibold leading-snug">
                        {item.text}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Dismiss button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full mt-5 rounded-2xl h-12 font-bold"
                onClick={onClose}
              >
                Maybe Later
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
