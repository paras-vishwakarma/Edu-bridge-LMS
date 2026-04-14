import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'
import { categories } from '../../data/mockData'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronRight, ChevronLeft, Save, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import './CreateCoursePage.css'

export default function CreateCoursePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [thumbnailType, setThumbnailType] = useState('url')

  const [form, setForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: categories[0],
    level: 'Beginner',
    duration: '',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    tags: '',
  })

  const [sections, setSections] = useState([
    { id: `sec-${Date.now()}`, title: 'Introduction', order: 1, lessons: [] }
  ])

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  // Section management
  const addSection = () => {
    setSections(prev => [...prev, {
      id: `sec-${Date.now()}`,
      title: `Section ${prev.length + 1}`,
      order: prev.length + 1,
      lessons: []
    }])
  }

  const updateSection = (idx, title) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, title } : s))
  }

  const removeSection = (idx) => {
    if (sections.length <= 1) return toast.error('Need at least one section')
    setSections(prev => prev.filter((_, i) => i !== idx))
  }

  // Lesson management
  const addLesson = (sectionIdx) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      return {
        ...s,
        lessons: [...s.lessons, {
          id: `les-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: '',
          type: 'video',
          duration: '',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completed: false,
        }]
      }
    }))
  }

  const updateLesson = (secIdx, lesIdx, key, value) => {
    setSections(prev => prev.map((s, si) => {
      if (si !== secIdx) return s
      return {
        ...s,
        lessons: s.lessons.map((l, li) => li === lesIdx ? { ...l, [key]: value } : l)
      }
    }))
  }

  const removeLesson = (secIdx, lesIdx) => {
    setSections(prev => prev.map((s, si) => {
      if (si !== secIdx) return s
      return { ...s, lessons: s.lessons.filter((_, li) => li !== lesIdx) }
    }))
  }

  const handlePublish = async (status = 'draft') => {
    if (!form.title.trim()) return toast.error('Course title is required')
    if (!form.description.trim()) return toast.error('Description is required')

    const courseData = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      instructorId: user.id,
      instructorName: user.name,
      sections,
      status,
    }

    await courseService.createCourse(courseData)
    toast.success(status === 'published' ? 'Course published!' : 'Course saved as draft!')
    navigate('/instructor/courses')
  }

  return (
    <div className="create-course-page">
      <div className="create-course-header">
        <h2 className="page-title">Create New Course</h2>
        <div className="step-indicator">
          <span className={`step ${step >= 1 ? 'active' : ''}`}>1. Basic Info</span>
          <span className={`step ${step >= 2 ? 'active' : ''}`}>2. Curriculum</span>
          <span className={`step ${step >= 3 ? 'active' : ''}`}>3. Settings</span>
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="create-form-section">
          <div className="form-group">
            <label className="form-label">Course Title *</label>
            <input className="form-input" style={{ paddingLeft: '0.75rem' }} value={form.title} onChange={e => updateForm('title', e.target.value)} placeholder="e.g., Complete React Masterclass" />
          </div>
          <div className="form-group">
            <label className="form-label">Short Description</label>
            <input className="form-input" style={{ paddingLeft: '0.75rem' }} value={form.shortDescription} onChange={e => updateForm('shortDescription', e.target.value)} placeholder="A brief one-liner" />
          </div>
          <div className="form-group">
            <label className="form-label">Full Description *</label>
            <textarea className="form-input" style={{ paddingLeft: '0.75rem', minHeight: '120px', resize: 'vertical' }} value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="Detailed course description..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" style={{ paddingLeft: '0.75rem' }} value={form.category} onChange={e => updateForm('category', e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Level</label>
              <select className="form-input" style={{ paddingLeft: '0.75rem' }} value={form.level} onChange={e => updateForm('level', e.target.value)}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Beginner to Advanced</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Thumbnail</label>
            <div className="thumbnail-input-group" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <select className="form-input" style={{ width: '150px', paddingLeft: '0.75rem' }} value={thumbnailType} onChange={e => setThumbnailType(e.target.value)}>
                <option value="url"> Link (URL)</option>
                <option value="upload">Upload Image</option>
              </select>
              
              {thumbnailType === 'url' ? (
                <input className="form-input" style={{ paddingLeft: '0.75rem', flex: 1 }} value={form.thumbnail} onChange={e => updateForm('thumbnail', e.target.value)} placeholder="https://..." />
              ) : (
                <input type="file" accept="image/*" className="form-input" style={{ padding: '0.4rem', flex: 1 }} onChange={e => {
                  const file = e.target.files[0]
                  if (file) {
                    updateForm('thumbnail', URL.createObjectURL(file))
                  }
                }} />
              )}
            </div>
            {form.thumbnail && (
              <div className="thumbnail-preview" style={{ marginTop: '0.5rem' }}>
                <img src={form.thumbnail} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Curriculum */}
      {step === 2 && (
        <div className="create-form-section">
          <div className="curriculum-builder">
            {sections.map((section, secIdx) => (
              <div key={section.id} className="builder-section">
                <div className="builder-section-header">
                  <input
                    className="builder-section-input"
                    value={section.title}
                    onChange={e => updateSection(secIdx, e.target.value)}
                    placeholder="Section title"
                  />
                  <button className="icon-btn danger" onClick={() => removeSection(secIdx)} title="Remove section">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="builder-lessons">
                  {section.lessons.map((lesson, lesIdx) => (
                    <div key={lesson.id} className="builder-lesson">
                      <select className="builder-lesson-type" value={lesson.type} onChange={e => updateLesson(secIdx, lesIdx, 'type', e.target.value)}>
                        <option value="video">Video URL</option>
                        <option value="upload">Upload Video</option>
                        <option value="pdf"> PDF</option>
                        <option value="text"> Text</option>
                      </select>
                      {lesson.type === 'video' ? (
                        <input className="builder-lesson-title" style={{ flex: 1 }} value={lesson.videoUrl || ''} onChange={e => updateLesson(secIdx, lesIdx, 'videoUrl', e.target.value)} placeholder="YouTube URL" />
                      ) : lesson.type === 'upload' ? (
                        <input type="file" accept="video/*" className="builder-lesson-title" style={{ flex: 1, padding: '0.2rem' }} onChange={e => {
                          const file = e.target.files[0]
                          if (file) {
                            updateLesson(secIdx, lesIdx, 'videoUrl', URL.createObjectURL(file))
                            if (!lesson.title) updateLesson(secIdx, lesIdx, 'title', file.name.split('.')[0])
                          }
                        }} />
                      ) : null}
                      <input className="builder-lesson-title" value={lesson.title} onChange={e => updateLesson(secIdx, lesIdx, 'title', e.target.value)} placeholder="Lesson title" />
                      <input className="builder-lesson-duration" value={lesson.duration} onChange={e => updateLesson(secIdx, lesIdx, 'duration', e.target.value)} placeholder="Duration" />
                      <button className="icon-btn danger" onClick={() => removeLesson(secIdx, lesIdx)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button className="add-lesson-btn" onClick={() => addLesson(secIdx)}>
                    <Plus size={16} /> Add Lesson
                  </button>
                </div>
              </div>
            ))}
            <button className="add-section-btn" onClick={addSection}>
              <Plus size={18} /> Add Section
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Settings */}
      {step === 3 && (
        <div className="create-form-section">
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Duration</label>
              <input className="form-input" style={{ paddingLeft: '0.75rem' }} value={form.duration} onChange={e => updateForm('duration', e.target.value)} placeholder="e.g., 42 hours" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Language</label>
              <input className="form-input" style={{ paddingLeft: '0.75rem' }} value={form.language} onChange={e => updateForm('language', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-input" style={{ paddingLeft: '0.75rem' }} value={form.tags} onChange={e => updateForm('tags', e.target.value)} placeholder="React, JavaScript, Web" />
            </div>
          </div>

          {/* Preview */}
          <div className="course-preview">
            <h4>Preview</h4>
            <div className="course-card" style={{ maxWidth: '350px', cursor: 'default' }}>
              <div className="course-card-thumbnail">
                <img src={form.thumbnail} alt={form.title} />
                <div className="course-card-overlay">
                  <span className="course-card-category">{form.category}</span>
                  <span className="course-card-level">{form.level}</span>
                </div>
              </div>
              <div className="course-card-body">
                <h3 className="course-card-title">{form.title || 'Course Title'}</h3>
                <p className="course-card-instructor">{user.name}</p>
                <div className="course-card-footer">
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="create-nav">
        {step > 1 && (
          <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
            <ChevronLeft size={18} /> Previous
          </button>
        )}
        <div className="create-nav-right">
          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => handlePublish('draft')}>
                <Save size={18} /> Save Draft
              </button>
              <button className="btn btn-primary" onClick={() => handlePublish('published')}>
                <Eye size={18} /> Publish
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
