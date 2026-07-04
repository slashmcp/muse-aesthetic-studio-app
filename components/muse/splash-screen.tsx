'use client'

import { useEffect, useState, useRef } from 'react'

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isFading, setIsFading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // The video is 3.5 seconds long, but we can rely on the 'ended' event
    // We'll also add a fallback timeout just in case it fails to play
    const fallbackTimeout = setTimeout(() => {
      startFadeOut()
    }, 5000)

    return () => clearTimeout(fallbackTimeout)
  }, [])

  const startFadeOut = () => {
    setIsFading(true)
    setTimeout(() => {
      onComplete()
    }, 800) // 800ms fade duration for a smooth exit
  }

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-700 ease-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video 
        ref={videoRef}
        src="https://muse2025.s3.us-east-1.amazonaws.com/Black+Logo.mp4" 
        autoPlay 
        muted 
        playsInline 
        onEnded={startFadeOut}
        className="w-full h-full object-cover"
      />
    </div>
  )
}
