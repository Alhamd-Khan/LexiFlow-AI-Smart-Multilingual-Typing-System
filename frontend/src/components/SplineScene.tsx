import { Suspense, lazy } from 'react';
import type { Application } from '@splinetool/runtime';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
  scene: string;
  className?: string;
  onLoad?: (app: Application) => void;
}

export default function SplineScene({ scene, className, onLoad }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-transparent min-h-[400px]">
          <div className="w-10 h-10 rounded-full border-4 border-[#4a40e0]/20 border-t-[#4a40e0] animate-spin" />
        </div>
      }
    >
      <div className="relative w-full h-full overflow-hidden">
        <Spline scene={scene} className={className} onLoad={onLoad} />
        
        {/* Anti-branding overlay: matches white bg + dot grid to hide "Built with Spline" watermark */}
        <div 
          className="absolute bottom-0 right-0 w-[140px] h-[48px] pointer-events-none z-[5]"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: 'radial-gradient(circle, rgba(171,173,175,0.2) 1.5px, transparent 1.5px)',
            backgroundSize: '32px 32px',
            backgroundPosition: 'right bottom'
          }}
        />
      </div>
    </Suspense>
  );
}
