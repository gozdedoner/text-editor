import React, { useEffect, useMemo, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TurndownService from 'turndown'

const STORAGE_KEY = 'text-editor-doc-v1'
const THEME_KEY = 'text-editor-theme'

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  let initial = '<p>Start writing...</p>'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      initial = parsed.html ?? initial
    }
  } catch {}

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content: initial,
  })

  useEffect(() => {
    if (!editor) return
    let t
    const handler = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const payload = { html: editor.getHTML(), ts: Date.now() }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      }, 400)
    }
    editor.on('update', handler)
    return () => {
      editor.off('update', handler)
      clearTimeout(t)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const k = e.key.toLowerCase()
      if (k === 'u') { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }
      if (k === 's') { e.preventDefault(); const payload = { html: editor.getHTML(), ts: Date.now() }; localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)) }
      if (k === 'e') { e.preventDefault(); downloadHTML() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor])

  const turndown = useMemo(() => new TurndownService(), [])

  if (!editor) return null

  const Btn = ({ onClick, active, children, title }) => (
    <button
      title={title}
      onClick={onClick}
      className={`toolbar-btn ${active ? 'toolbar-btn-active' : ''}`}
    >
      {children}
    </button>
  )

  const setLink = () => {
    const prev = editor.getAttributes('link').href || ''
    const url = window.prompt('Enter URL (leave empty to remove):', prev)
    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    }
  }

  const clearDoc = () => {
    editor.commands.clearContent(true)
    localStorage.removeItem(STORAGE_KEY)
  }

  function download(filename, text, type = 'text/plain') {
    const blob = new Blob([text], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadHTML = () => {
    const html = editor.getHTML()
    download('document.html', html, 'text/html')
  }
  const downloadMD = () => {
    const html = editor.getHTML()
    const md = turndown.turndown(html)
    download('document.md', md, 'text/markdown')
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme==='dark' ? 'bg-gradient-to-br from-neutral-900 via-black to-neutral-950' : 'bg-gradient-to-br from-blush via-apricot/50 to-latte'}`}>
      <div className="w-full max-w-3xl glass p-6">
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl/Cmd+B)">Bold</Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl/Cmd+I)">Italic</Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl/Cmd+U)">Underline</Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">Strike</Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</Btn>
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">List</Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">Quote</Btn>
          <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">Code</Btn>
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl/Cmd+Z)">Undo</Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl/Cmd+Shift+Z)">Redo</Btn>
          <Btn onClick={setLink} active={editor.isActive('link')} title="Add/Edit Link">Link</Btn>
          <Btn onClick={clearDoc} title="Clear document">Clear</Btn>
          <Btn onClick={() => navigator.clipboard.writeText(editor.getHTML())} title="Copy HTML">Copy HTML</Btn>
          <Btn onClick={() => navigator.clipboard.writeText(JSON.stringify(editor.getJSON(), null, 2))} title="Copy JSON">Copy JSON</Btn>
          <Btn onClick={downloadHTML} title="Download HTML">.html</Btn>
          <Btn onClick={downloadMD} title="Download Markdown">.md</Btn>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="toolbar-btn !bg-white hover:!bg-apricot"
            title="Toggle theme"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>

        <EditorContent editor={editor} className="editor-surface" />
      </div>
    </div>
  )
}
