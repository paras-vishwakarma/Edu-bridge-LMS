export default function VideoPlayer({ videoUrl, title, onComplete }) {
  // Extract YouTube embed URL
  const getEmbedUrl = (url) => {
    if (!url) return ''
    if (url.includes('/embed/')) return url
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
    return url
  }

  const isLocalBlob = videoUrl?.startsWith('blob:') || videoUrl?.endsWith('.mp4')

  return (
    <div className="video-player-wrapper">
      <div className="video-player-container">
        {isLocalBlob ? (
          <video
            src={videoUrl}
            title={title || 'Video Player'}
            controls
            className="video-player-iframe"
            style={{ objectFit: 'contain', background: '#000' }}
          />
        ) : (
          <iframe
            src={getEmbedUrl(videoUrl)}
            title={title || 'Video Player'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="video-player-iframe"
          />
        )}
      </div>
      {onComplete && (
        <button className="video-complete-btn" onClick={onComplete}>
          ✓ Mark as Complete
        </button>
      )}
    </div>
  )
}
