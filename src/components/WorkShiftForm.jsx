import React, { useState } from 'react'
import { ImageModal } from './ImageModal'

export function WorkShiftForm() {
  const [endOdometer, setEndOdometer] = useState('')
  const [revenue, setRevenue] = useState('')
  const [filePreviews, setFilePreviews] = useState([])
  const [activePreview, setActivePreview] = useState(null)

  // Handle local file selection for manual record verification
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const previews = files.map((file) => URL.createObjectURL(file))
    setFilePreviews(previews)
  }

  return (
    <div style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
      {/* End Odometer Input */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
          End Odometer (km) *
        </label>
        <input
          type="number"
          placeholder="e.g. 14201"
          value={endOdometer}
          onChange={(e) => setEndOdometer(e.target.value)}
          style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
      </div>

      {/* Upload Screenshot(s) Section */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
          Upload Screenshot(s) *
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />

        {/* Thumbnail Previews with Tap-to-Expand */}
        {filePreviews.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {filePreviews.map((src, idx) => (
              <div
                key={idx}
                onClick={() => setActivePreview(src)}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <img
                  src={src}
                  alt={`Screenshot #${idx + 1}`}
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid #2563eb'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '10px',
                    padding: '1px 4px',
                    borderRadius: '3px'
                  }}
                >
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Revenue Entry Input */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
          Total Revenue (₹) *
        </label>
        <input
          type="number"
          placeholder="Enter revenue manually"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '18px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            backgroundColor: '#fff'
          }}
        />
      </div>

      {/* Full-Screen Image Verification Modal */}
      <ImageModal imageSrc={activePreview} onClose={() => setActivePreview(null)} />
    </div>
  )
}
