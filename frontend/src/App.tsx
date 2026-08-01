import React, { useState } from 'react'
import './App.css'

interface Filter {
  field_name: string
  field_type: string
  operator: string
  string_values?: string[]
  number_value?: number
  time_value?: number
}

interface Leaf {
  table: string
  contact: { filters: Filter[] }
}

interface TreeNode {
  kind: 'branch' | 'leaf'
  branch?: { operator: string; leaves: TreeNode[] }
  leaf?: Leaf
}

interface SuggestResponse {
  name: string
  explanation: string
  tree: TreeNode
}

function FilterTag({ filter }: { filter: Filter }) {
  const value = filter.string_values?.join(', ') ?? filter.number_value ?? filter.time_value
  return (
    <span style={{
      display: 'inline-block',
      background: '#e8f4fd',
      border: '1px solid #90caf9',
      borderRadius: 6,
      padding: '4px 10px',
      margin: '4px',
      fontSize: 13,
      color: '#1565c0'
    }}>
      <b>{filter.field_name}</b> {filter.operator} <b>{String(value)}</b>
    </span>
  )
}

function TreeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  if (node.kind === 'leaf' && node.leaf) {
    const filters = node.leaf.contact?.filters ?? []
    return (
      <div style={{ marginLeft: depth * 20, marginBottom: 8 }}>
        {filters.map((f, i) => <FilterTag key={i} filter={f} />)}
      </div>
    )
  }
  if (node.kind === 'branch' && node.branch) {
    const leaves = node.branch.leaves ?? []
    return (
      <div style={{ marginLeft: depth * 20 }}>
        <div style={{
          display: 'inline-block',
          background: '#fff3e0',
          border: '1px solid #ffb74d',
          borderRadius: 6,
          padding: '2px 10px',
          marginBottom: 8,
          fontSize: 12,
          fontWeight: 700,
          color: '#e65100',
          textTransform: 'uppercase'
        }}>
          {node.branch.operator}
        </div>
        {leaves.map((leaf, i) => <TreeView key={i} node={leaf} depth={depth + 1} />)}
      </div>
    )
  }
  return null
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '20px 0' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#1976d2',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SuggestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const examples = [
    'contacts from USA created in the last 7 days',
    'customers with more than 5 orders and lifetime value over 100',
    'contacts from Ukraine who speak English',
    'new contacts from last month who haven\'t ordered yet',
  ]

  const suggest = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('http://localhost:8080/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'API error')
      }
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect to backend. Make sure it is running on port 8080.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
          AI Segment Builder
        </h1>
        <p style={{ color: '#666', marginTop: 8 }}>
          Describe your audience in any language — AI will build the contact segment filters automatically
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.08)' }}>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.metaKey && suggest()}
          placeholder="e.g. contacts from USA created in the last 7 days..."
          rows={3}
          style={{
            width: '100%',
            padding: 16,
            borderRadius: 10,
            border: '2px solid #e0e0e0',
            fontSize: 15,
            resize: 'none',
            boxSizing: 'border-box',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        <div style={{ marginTop: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: '#999' }}>Examples: </span>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setQuery(ex)}
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: 20,
                padding: '3px 10px',
                margin: '2px',
                fontSize: 12,
                cursor: 'pointer',
                color: '#555',
              }}
            >
              {ex}
            </button>
          ))}
        </div>

        <button
          onClick={suggest}
          disabled={loading || !query.trim()}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#90caf9' : '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Build Segment with AI
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 20, padding: 16, background: '#ffebee', borderRadius: 10, color: '#c62828' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <p style={{ color: '#666', marginBottom: 8 }}>Building your segment...</p>
          <LoadingDots />
        </div>
      )}

      {result && !loading && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{
              background: '#e8f5e9',
              border: '1px solid #a5d6a7',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 18,
              fontWeight: 700,
              color: '#2e7d32',
              marginRight: 12,
            }}>
              {result.name}
            </div>
          </div>

          <p style={{ color: '#555', marginBottom: 20, fontSize: 14 }}>{result.explanation}</p>

          <div style={{ background: '#fafafa', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>
              Segment Filters
            </div>
            {result.tree ? <TreeView node={result.tree} /> : <p style={{ color: '#999', fontSize: 14 }}>No segment filters could be built for this query.</p>}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>
              JSON Output
            </div>
            <pre style={{
              background: '#1a1a2e',
              color: '#a5d6a7',
              padding: 16,
              borderRadius: 10,
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 300,
            }}>
              {JSON.stringify(result.tree, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
