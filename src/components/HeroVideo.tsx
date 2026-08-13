import { useEffect, useRef, useState } from 'react'

type HeroVideoProps = {
  src: string
  poster?: string
  className?: string
  onPlaybackError?: () => void
}

/**
 * Background video tuned for iOS Safari: inline playback, muted autoplay,
 * eager loading, an explicit play() retry, and no blank layer after media error.
 */
export default function HeroVideo({ src, poster, className = '', onPlaybackError }: HeroVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  useEffect(() => {
    const video = ref.current
    if (!video || failed) return

    video.defaultMuted = true
    video.muted = true
    video.playsInline = true

    const retryPlay = () => {
      void video.play().catch(() => {
        // Safari may reject autoplay until the next lifecycle opportunity.
        // The poster remains visible instead of leaving a black media layer.
      })
    }

    video.addEventListener('canplay', retryPlay)
    video.addEventListener('loadeddata', retryPlay)
    retryPlay()

    return () => {
      video.removeEventListener('canplay', retryPlay)
      video.removeEventListener('loadeddata', retryPlay)
    }
  }, [src, failed])

  if (failed) {
    return poster ? <img src={poster} alt="" className={className} /> : null
  }

  return (
    <video
      ref={ref}
      key={src}
      className={className}
      src={src}
      poster={poster || undefined}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      aria-hidden="true"
      onError={() => {
        setFailed(true)
        onPlaybackError?.()
      }}
    />
  )
}
