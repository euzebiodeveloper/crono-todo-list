import React, { useEffect, useState } from 'react'
import { fetchTodos, createTodo, updateTodo, deleteTodo } from '../api'

export default function Atividades() {
  function hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(0,0,0,${alpha})`
    let h = hex.replace('#','')
    if (h.length === 3) h = h.split('').map(c => c + c).join('')
    const int = parseInt(h, 16)
    const r = (int >> 16) & 255
    const g = (int >> 8) & 255
    const b = int & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  function isColorDark(hex) {
    if (!hex) return false
    let h = hex.replace('#','')
    if (h.length === 3) h = h.split('').map(c => c + c).join('')
    const int = parseInt(h, 16)
    const r = (int >> 16) & 255
    const g = (int >> 8) & 255
    const b = int & 255
    // Perceived brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness < 150
  }
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [title, setTitle] = useState('')
  const [cardTitle, setCardTitle] = useState('')
  const [cardDesc, setCardDesc] = useState('')
  const [cardColor, setCardColor] = useState('#000000')
  const [name, setName] = useState('')
  const [selectedCardId, setSelectedCardId] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [weekdays, setWeekdays] = useState([])
  const [dueDate, setDueDate] = useState('')
  const [formMsg, setFormMsg] = useState(null)
  const [cardMsg, setCardMsg] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDesc, setEditingDesc] = useState('')
  const [editingMsg, setEditingMsg] = useState(null)
  const [editingLoading, setEditingLoading] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [viewCard, setViewCard] = useState(null)
  const [exitingIds, setExitingIds] = useState(new Set())

  // update activity completion state
  async function updateActivityCompletion(id, completed) {
    try {
      if (completed) {
        // animate out first
        setExitingIds(prev => {
          const copy = new Set(prev)
          copy.add(id)
          return copy
        })
        // after animation, persist and save log
        setTimeout(async () => {
          try {
            const res = await updateTodo(id, { completed: true })
            if (res && (res.status === 200 || res.ok)) {
              const t = await fetchTodos()
              setTodos(Array.isArray(t) ? t : [])
              const all = Array.isArray(t) ? t : []
              const act = all.find(x => String(x._id) === String(id))
              saveCompletedActivity(act)
            }
          } catch (err) {
            console.error(err)
          } finally {
            setExitingIds(prev => {
              const copy = new Set(prev)
              copy.delete(id)
              return copy
            })
          }
        }, 360)
      } else {
        // uncheck -> update immediately
        const res = await updateTodo(id, { completed: false })
        if (res && (res.status === 200 || res.ok)) {
          const t = await fetchTodos()
          setTodos(Array.isArray(t) ? t : [])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  function saveCompletedActivity(activity) {
    try {
      if (!activity) return
      const key = 'completedActivitiesLog'
      const raw = localStorage.getItem(key)
      let arr = []
      try { arr = raw ? JSON.parse(raw) : [] } catch (_) { arr = [] }
      arr.unshift({ id: activity._id, title: activity.title, description: activity.description || '', completedAt: new Date().toISOString(), cardId: activity.parentId || null })
      // keep reasonable length
      if (arr.length > 200) arr = arr.slice(0, 200)
      localStorage.setItem(key, JSON.stringify(arr))
    } catch (e) { console.error('Erro ao salvar registro concluído', e) }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setErr(null)
      try {
        const t = await fetchTodos()
        setTodos(Array.isArray(t) ? t : [])
      } catch (e) {
        setErr('Falha ao carregar atividades')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // derived helpers
  const cards = todos.filter(t => {
    const hasName = t.name && String(t.name).trim().length > 0
    const hasRecurring = !!t.recurring
    const hasWeekdays = Array.isArray(t.weekdays) && t.weekdays.length > 0
    const hasDue = !!t.dueDate
    return !hasName && !hasRecurring && !hasWeekdays && !hasDue
  })

  // ensure selectedCardId defaults to first card when cards change
  useEffect(() => {
    if ((!selectedCardId || selectedCardId === '') && cards && cards.length > 0) {
      setSelectedCardId(cards[0]._id)
    }
  }, [cards])

  const hasAnyActivity = todos.some(t => {
    const hasName = t.name && String(t.name).trim().length > 0
    const hasRecurring = !!t.recurring
    const hasWeekdays = Array.isArray(t.weekdays) && t.weekdays.length > 0
    const hasDue = !!t.dueDate
    return hasName || hasRecurring || hasWeekdays || hasDue
  })

  function toggleWeekday(day) {
    setWeekdays(w => w.includes(day) ? w.filter(x => x !== day) : [...w, day])
  }

  async function saveEditing() {
    if (!editingCard) return
    setEditingMsg(null)
    if (!editingTitle || String(editingTitle).trim() === '') {
      setEditingMsg('Preencha o título')
      return
    }
    setEditingLoading(true)
    try {
      const res = await updateTodo(editingCard._id, { title: editingTitle, description: editingDesc })
      if (res && (res.status === 200 || res.ok)) {
        setEditingMsg('Alterações salvas com sucesso')
        const t = await fetchTodos()
        setTodos(Array.isArray(t) ? t : [])
        // fechar modal após breve delay para o usuário ver a confirmação
        setTimeout(() => {
          setEditingCard(null)
          setEditingTitle('')
          setEditingDesc('')
          setEditingMsg(null)
        }, 900)
      } else {
        let text = 'Erro ao salvar alterações'
        try {
          const body = await res.json()
          if (body && body.error) text = body.error
        } catch (_) {}
        setEditingMsg(text)
      }
    } catch (err) {
      console.error(err)
      setEditingMsg('Erro ao salvar alterações')
    } finally {
      setEditingLoading(false)
    }
  }

  function cancelEditing() {
    setEditingCard(null)
    setEditingTitle('')
    setEditingDesc('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    setFormMsg(null)
    if (!title) {
      setFormMsg('Preencha o título')
      return
    }
    try {
      const payload = { title, name, recurring, weekdays, dueDate: dueDate ? dueDate : null }
      // if a card is selected, attach its id as parentId and also set name to card title for legacy matching
      if (selectedCardId) {
        payload.parentId = selectedCardId
        const card = cards.find(c => String(c._id) === String(selectedCardId))
        if (card) payload.name = card.title
      }
      const res = await createTodo(payload)
      if (res && res.status === 201) {
        setFormMsg('Atividade criada')
        setTitle('')
        setName('')
        setRecurring(false)
        setWeekdays([])
        setDueDate('')
        setShowForm(false)
        // reload list
        const t = await fetchTodos()
        setTodos(Array.isArray(t) ? t : [])
        // keep selectedCardId defaulting to first card after reload
        const fresh = Array.isArray(t) ? t : []
        const freshCards = fresh.filter(tt => {
          const hasName = tt.name && String(tt.name).trim().length > 0
          const hasRecurring = !!tt.recurring
          const hasWeekdays = Array.isArray(tt.weekdays) && tt.weekdays.length > 0
          const hasDue = !!tt.dueDate
          return !hasName && !hasRecurring && !hasWeekdays && !hasDue
        })
        if (freshCards.length > 0) setSelectedCardId(freshCards[0]._id)
      } else {
        const body = await res.json()
        setFormMsg(body.error || 'Erro ao criar atividade')
      }
    } catch (err) {
      setFormMsg('Erro na requisição')
    }
  }

  async function handleCreateCard(e) {
    e.preventDefault()
    setCardMsg(null)
    if (!cardTitle) {
      setCardMsg('Preencha o título do cartão')
      return
    }
    try {
      const payload = { title: cardTitle, description: cardDesc || '', name: '', recurring: false, weekdays: [], dueDate: null, color: cardColor }
      const old = todos || []
      const res = await createTodo(payload)
      if (res && res.status === 201) {
        setCardMsg('Cartão criado')
        setCardTitle('')
        setCardDesc('')
        setCardColor('#000000')
        setShowCardForm(false)
        const fresh = await fetchTodos()
        setTodos(Array.isArray(fresh) ? fresh : [])
        // novo cartão criado — o estilo padrão `empty-card` já aplica animação sutil
      } else {
        const body = await res.json()
        setCardMsg(body.error || 'Erro ao criar cartão')
      }
    } catch (err) {
      setCardMsg('Erro na requisição')
    }
  }

  return (
    <div className="section-bleed">
      <div className="section-inner">
          {editingCard && (
            <div className="modal-overlay" onClick={cancelEditing}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <h3 style={{ marginTop: 0 }}>Editar cartão</h3>
                <input value={editingTitle} onChange={e => setEditingTitle(e.target.value)} placeholder="Título do cartão" />
                <textarea value={editingDesc} onChange={e => setEditingDesc(e.target.value)} placeholder="Descrição (opcional)" rows={5} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <button className="btn" onClick={saveEditing} disabled={editingLoading}>{editingLoading ? 'Salvando...' : 'Salvar'}</button>
                  <button className="btn secondary" onClick={cancelEditing} disabled={editingLoading}>Cancelar</button>
                  {editingMsg && <p className="message" style={{ margin: 0 }}>{editingMsg}</p>}
                </div>
              </div>
            </div>
          )}
        <div className="activities-controls-row" style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          {!showCardForm && !showForm && (
            <button className="btn" onClick={() => { setShowCardForm(true); setShowForm(false); }}>Novo cartão</button>
          )}
          {showCardForm && (
            <form onSubmit={handleCreateCard} style={{ marginTop: 0 }} className="auth-form card-mini-form">
              <input placeholder="Título do cartão" value={cardTitle} onChange={e => setCardTitle(e.target.value)} />
              <textarea placeholder="Descrição (opcional)" value={cardDesc} onChange={e => setCardDesc(e.target.value)} rows={3} />
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Cor do cartão</div>
                <div className="color-palette" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['#000000','#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#17becf'].map(c => (
                    <button key={c} type="button" className={"color-swatch" + (cardColor === c ? ' selected' : '')} onClick={() => setCardColor(c)} style={{ background: c }} aria-label={`Cor ${c}`} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" type="submit">Criar cartão</button>
                <button type="button" className="btn secondary" onClick={() => setShowCardForm(false)}>Cancelar</button>
              </div>
              {cardMsg && <p className="message">{cardMsg}</p>}
            </form>
          )}
          {!showForm && !showCardForm && (
            <button className="btn" onClick={() => { setShowForm(true); setShowCardForm(false); if (cards && cards.length > 0) setSelectedCardId(cards[0]._id); }} disabled={!(hasAnyActivity || (cards && cards.length > 0))}>Nova atividade</button>
          )}
          {showForm && (
            <form onSubmit={handleCreate} style={{ marginTop: 12 }} className="auth-form card-mini-form">
              <input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
              {/* If there are cards, show a select to pick which card this activity belongs to. Otherwise allow free text name. */}
                {cards && cards.length > 0 ? (
                <select className="card-select" value={selectedCardId} onChange={e => { setSelectedCardId(e.target.value); const card = cards.find(c => c._id === e.target.value); setName(card ? card.title : ''); }}>
                  <option value="">-- Selecionar cartão (opcional) --</option>
                  {cards.map(c => (
                    <option key={c._id} value={c._id} style={{ color: c.color || 'inherit' }}>{c.title}</option>
                  ))}
                </select>
              ) : (
                <input placeholder="Nome da atividade" value={name} onChange={e => setName(e.target.value)} />
              )}
              <div className="activity-controls">
                <label className="checkbox-left">
                  <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
                  <span>Recorrente</span>
                </label>
                {recurring && (
                  <div className="weekday-group">
                    {['seg','ter','qua','qui','sex','sab','dom'].map(d => (
                      <label key={d} className="weekday-label">
                        <input type="checkbox" checked={weekdays.includes(d)} onChange={() => toggleWeekday(d)} /> {d}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <label className="due-label">Data e hora de entrega</label>
              <input type="datetime-local" step="1" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" type="submit">Criar</button>
                <button type="button" className="btn secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
              {formMsg && <p className="message">{formMsg}</p>}
            </form>
          )}
        </div>
        <h2>Atividades</h2>
        {loading && <p className="muted">Carregando...</p>}
        {err && <p className="message">{err}</p>}

        {cards.length === 0 ? (
          <p className="muted">Nenhum cartão encontrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {cards.map(t => (
              <div key={t._id} onClick={() => setViewCard(t)} className={"example-card compact empty-card " + (t.color ? 'colored ' : '') + (removingId === t._id ? ' removing' : '')} style={{ background: t.color || undefined, color: t.color ? '#fff' : undefined, ['--card-color']: t.color || '#000' }}>
                <div className="ec-left">
                  <span className="ec-title">{t.title}</span>
                  <span className="ec-sub muted">{t.description && String(t.description).trim().length > 0 ? t.description : (t.completed ? 'Concluída' : 'Sem descrição')}</span>
                </div>
                <div className="ec-right">
                  <button className="icon-btn" title="Editar" onClick={(e) => { e.stopPropagation(); setEditingCard(t); setEditingTitle(t.title || ''); setEditingDesc(t.description || '') }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button className="icon-btn" title="Excluir" onClick={async (e) => { e.stopPropagation(); if (confirm('Excluir este cartão?')) {
                      try {
                        setRemovingId(t._id)
                        const r = await deleteTodo(t._id)
                        if (r.status === 204 || r.ok) {
                          const fresh = await fetchTodos()
                          setTodos(Array.isArray(fresh) ? fresh : [])
                        } else {
                          // clear removing indicator after a short delay
                          setTimeout(() => setRemovingId(null), 600)
                        }
                      } catch (err) {
                        console.error(err)
                        setRemovingId(null)
                      }
                    } }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Card view modal: shows activities that belong to this card (by matching name === card.title) */}
        {viewCard && (
            <div className="modal-overlay" onClick={() => { setViewCard(null) }}>
            <div className="modal-content card-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, borderTop: `6px solid ${viewCard.color || '#000'}` }}>
              <button className="modal-close" onClick={() => setViewCard(null)}>×</button>
              <h3 style={{ marginTop: 0 }}>{viewCard.title}</h3>
              {viewCard.description && <p className="muted">{viewCard.description}</p>}
              <hr />
              <h4>Atividades relacionadas</h4>
              {(() => {
                // collect related activities for this card (prefer parentId, fallback to name match)
                const related = todos.filter(x => {
                  try {
                    if (x.parentId && String(x.parentId) === String(viewCard._id)) return true
                  } catch (_) {}
                  if (x.name && String(x.name).trim() === String(viewCard.title).trim()) return true
                  return false
                }).filter(r => !r.completed) // only show not-yet-completed activities
                if (!related || related.length === 0) {
                  return <p className="muted">Nenhuma atividade neste cartão.</p>
                }
                return (
                  <ul style={{ padding: 0, listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {related.map(r => (
                        <li key={r._id} className={"activity-item" + (exitingIds.has(r._id) ? ' exit' : '') + (viewCard ? ' animate-in' : '')} style={{ padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700 }}>{r.title}</div>
                              <div className="muted" style={{ fontSize: 13 }}>{r.description || ''}</div>
                            </div>
                            <div className={"activity-actions" + (viewCard ? ' animate-in' : '')} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <div className="muted" style={{ fontSize: 13 }}>{r.dueDate ? new Date(r.dueDate).toLocaleString() : ''}</div>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <input type="checkbox" aria-label={`Marcar ${r.title} como concluída`} checked={!!r.completed} disabled={exitingIds.has(r._id)} onChange={e => { updateActivityCompletion(r._id, e.target.checked); }} />
                              </label>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
