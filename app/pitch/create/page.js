'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreatePitchDeck() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [pdfPreview, setPdfPreview] = useState(null)
  const [form, setForm] = useState({ title: '', description: '' })
  const fileInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
  }

  async function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPdfPreview(null)
    setCoverPreview(null)

    if (f.type === 'application/pdf') {
      await generatePdfThumbnail(f)
    }
  }

  async function generatePdfThumbnail(f) {
    try {
      const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
      const url = URL.createObjectURL(f)
      const pdf = await window.pdfjsLib.getDocument(url).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport }).promise
      setPdfPreview(canvas.toDataURL('image/png'))
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF preview error:', err)
    }
  }

  function handleCoverChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setCoverFile(f)
    setCoverPreview(URL.createObjectURL(f))
  }

  async function dataURLtoBlob(dataURL) {
    const res = await fetch(dataURL)
    return res.blob()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { alert('タイトルを入力してください'); return }
    if (!file) { alert('ファイルを選択してください'); return }
    setLoading(true)
    setUploading(true)

    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('pitchdecks').upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('アップロードエラー: ' + uploadError.message)
      setLoading(false); setUploading(false); return
    }

    const { data: { publicUrl: fileUrl } } = supabase.storage.from('pitchdecks').getPublicUrl(filePath)

    let thumbnailUrl = null

    if (pdfPreview) {
      const blob = await dataURLtoBlob(pdfPreview)
      const thumbPath = `${user.id}/thumb_${Date.now()}.png`
      await supabase.storage.from('pitchdecks').upload(thumbPath, blob, { upsert: true, contentType: 'image/png' })
      const { data: { publicUrl } } = supabase.storage.from('pitchdecks').getPublicUrl(thumbPath)
      thumbnailUrl = publicUrl
    } else if (coverFile) {
      const coverExt = coverFile.name.split('.').pop()
      const coverPath = `${user.id}/cover_${Date.now()}.${coverExt}`
      await supabase.storage.from('pitchdecks').upload(coverPath, coverFile, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('pitchdecks').getPublicUrl(coverPath)
      thumbnailUrl = publicUrl
    } else if (file.type.startsWith('image/')) {
      thumbnailUrl = fileUrl
    }

    setUploading(false)

    const { error } = await supabase.from('pitch_decks').insert({
      user_id: user.id,
      title: form.title,
      description: form.description,
      file_url: fileUrl,
      file_type: ext.toLowerCase(),
      thumbnail_url: thumbnailUrl
    })

    if (error) { alert('エラー: ' + error.message); setLoading(false); return }
    router.push('/mypage')
  }

  const isPptx = file && (file.name.endsWith('.pptx') || file.name.endsWith('.ppt'))

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{
        background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)',
        padding: '0 1.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '56px', position: 'sticky', top: 0, zIndex: 10
      }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: 'inherit' }}>
          IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
        </Link>
        <Link href="/mypage" style={{ fontSize: '13px', color: '#6b6b67', textDecoration: 'none' }}>← マイページに戻る</Link>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>ピッチデックを投稿</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>基本情報</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
                タイトル <span style={{ color: '#c04020' }}>*</span>
              </label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="例：IdeaVault ピッチデック 2025"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>説明（任意）</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="このピッチデックについて説明してください" rows={3}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.7', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              ファイル <span style={{ fontSize: '10px', color: '#a0a09c', textTransform: 'none', letterSpacing: 0 }}>PDF・PPTX対応</span>
            </div>

            <div onClick={() => fileInputRef.current?.click()} style={{
              border: '2px dashed rgba(0,0,0,0.15)', borderRadius: '12px',
              padding: '2rem', textAlign: 'center', cursor: 'pointer',
              background: file ? '#f0eeea' : '#fafafa'
            }}>
              {file ? (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {file.name.endsWith('.pdf') ? '📄' : '📊'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18' }}>{file.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b6b67', marginTop: '4px' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' }}>クリックしてファイルを選択</div>
                  <div style={{ fontSize: '12px', color: '#6b6b67' }}>PDF・PPTX・PPT に対応</div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.ppt" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            {/* PDFは自動でサムネイル表示 */}
            {pdfPreview && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '6px' }}>📄 1ページ目のプレビュー（自動生成）</div>
                <img src={pdfPreview} alt="PDF preview" style={{ width: '100%', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.1)' }} />
              </div>
            )}

            {/* PPTXはカバー画像を手動でアップロード */}
            {isPptx && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '6px' }}>
                  📊 カバー画像（任意）
                  <span style={{ fontSize: '11px', fontWeight: '400', color: '#a0a09c', marginLeft: '6px' }}>スライドの1枚目をスクショして設定できます</span>
                </div>
                <div onClick={() => coverInputRef.current?.click()} style={{
                  border: '2px dashed rgba(0,0,0,0.12)', borderRadius: '10px',
                  padding: '1rem', textAlign: 'center', cursor: 'pointer',
                  background: '#fafafa', overflow: 'hidden'
                }}>
                  {coverPreview ? (
                    <img src={coverPreview} alt="cover" style={{ maxHeight: '160px', borderRadius: '6px', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ fontSize: '13px', color: '#a0a09c' }}>クリックして画像を選択</div>
                  )}
                  <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
                </div>
              </div>
            )}

            {file && (
              <button type="button" onClick={() => { setFile(null); setPdfPreview(null); setCoverFile(null); setCoverPreview(null) }} style={{
                marginTop: '8px', background: 'none', border: 'none', fontSize: '12px', color: '#c04020', cursor: 'pointer', padding: '0'
              }}>✕ ファイルを削除</button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Link href="/mypage" style={{
              padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
              border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67',
              textDecoration: 'none', display: 'inline-block'
            }}>キャンセル</Link>
            <button type="submit" disabled={loading} style={{
              background: '#1D9E75', color: '#fff', border: 'none',
              padding: '10px 28px', borderRadius: '10px', fontSize: '14px',
              fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {uploading ? 'アップロード中...' : loading ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" />
    </div>
  )
}