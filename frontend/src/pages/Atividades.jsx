import React, { useEffect, useState, useRef } from 'react'
import { fetchTodos, createTodo, updateTodo, deleteTodo, getMe, fetchCompletedActivities } from '../api'
import { toast } from 'react-toastify'

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
  
  const [editingCard, setEditingCard] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDesc, setEditingDesc] = useState('')
  const [editingColor, setEditingColor] = useState('#000000')
  
  const [editingLoading, setEditingLoading] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [viewCard, setViewCard] = useState(null)
  const [exitingIds, setExitingIds] = useState(new Set())
  const [pendingIds, setPendingIds] = useState(new Set())
  const [optimisticCompletedIds, setOptimisticCompletedIds] = useState(new Set())
  const [enteringFromRightIds, setEnteringFromRightIds] = useState(new Set())
  const [completedExitingIds, setCompletedExitingIds] = useState(new Set())
  const [showCompletedModal, setShowCompletedModal] = useState(false)
  const [completedActivities, setCompletedActivities] = useState([])
  const [recoveringIds, setRecoveringIds] = useState(new Set())
  const [completedPage, setCompletedPage] = useState(1)
  const [completedPageSize] = useState(8)

  // update activity completion state
  async function updateActivityCompletion(id, completed) {
    try {
      if (completed) {
        // mark as pending first (delay before playing exit animation)
        // mark optimistically as completed so the checkbox appears checked immediately
        setOptimisticCompletedIds(prev => {
          const copy = new Set(prev)
          copy.add(id)
          return copy
        })
        setPendingIds(prev => {
          const copy = new Set(prev)
          copy.add(id)
          return copy
        })
        // wait 1s, then start exit animation, then persist after animation duration
        setTimeout(() => {
          // remove from pending and add to exiting (triggers exit animation)
          setPendingIds(prev => {
            const copy = new Set(prev)
            copy.delete(id)
            return copy
          })
          setExitingIds(prev => {
            const copy = new Set(prev)
            copy.add(id)
            return copy
          })

          // after exit animation completes, persist and remove from state
          setTimeout(async () => {
            try {
              const res = await updateTodo(id, { completed: true })
              if (res && (res.status === 200 || res.ok)) {
                setTodos(prev => Array.isArray(prev) ? prev.filter(x => String(x._id) !== String(id)) : prev)
                try {
                  const body = await (res.json ? res.json() : Promise.resolve(null))
                  // backend may return either the updated todo object or { updated, newTodo }
                  const snapshotSource = body && body._id ? body : (body && body.updated ? body.updated : null)
                  if (snapshotSource && snapshotSource._id) saveCompletedActivity(snapshotSource)
                  // if server created a new recurring occurrence, insert it into state so UI updates immediately
                  if (body && body.newTodo && body.newTodo._id) {
                    setTodos(prev => {
                      const copy = Array.isArray(prev) ? [...prev] : []
                      // prepend newTodo (keep dedupe)
                      const exists = copy.find(x => String(x._id) === String(body.newTodo._id))
                      if (!exists) copy.unshift(body.newTodo)
                      return copy
                    })
                  }
                  // notify user
                  try { toast.success('Atividade concluída') } catch (_) {}
                } catch (_) {}
              }
            } catch (err) {
              console.error(err)
            } finally {
              setExitingIds(prev => {
                const copy = new Set(prev)
                copy.delete(id)
                return copy
              })
              setOptimisticCompletedIds(prev => {
                const copy = new Set(prev)
                copy.delete(id)
                return copy
              })
            }
          }, 420)
        }, 1500)
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
      // Do not persist completed snapshots for recurring activities
      try { if (activity.recurring) return } catch (_) {}
      const key = 'completedActivitiesLog'
      const raw = localStorage.getItem(key)
      let arr = []
      try { arr = raw ? JSON.parse(raw) : [] } catch (_) { arr = [] }
      // capture a small snapshot of the card (title + color) so completed records remain meaningful
      const cardId = activity.parentId || null
      let cardTitle = null
      let cardColor = null
      try {
        const cardObj = todos && Array.isArray(todos) ? todos.find(c => String(c._id) === String(cardId)) : null
        if (cardObj) {
          cardTitle = cardObj.title || null
          cardColor = cardObj.color || null
        }
      } catch (_) {}

      arr.unshift({ id: activity._id, title: activity.title, description: activity.description || '', completedAt: new Date().toISOString(), cardId, cardTitle, cardColor })
      // keep reasonable length
      if (arr.length > 200) arr = arr.slice(0, 200)
      localStorage.setItem(key, JSON.stringify(arr))
    } catch (e) { console.error('Erro ao salvar registro concluído', e) }
  }

  async function loadCompletedActivitiesFromStorage(page = 1) {
    try {
      // prefer server-side stored completed activities; fall back to localStorage
      try {
        const server = await fetchCompletedActivities()
        if (server && Array.isArray(server)) {
          const list = server.map(it => ({
            id: it.originalId || it.id || it._id,
            title: it.title || '',
            description: it.description || '',
            completedAt: it.completedAt ? (new Date(it.completedAt)).toISOString() : new Date().toISOString(),
            cardId: it.cardId || null,
            cardTitle: it.cardTitle || null,
            cardColor: it.cardColor || null
          }))
          const totalPages = Math.max(1, Math.ceil(list.length / completedPageSize))
          const clamped = Math.min(Math.max(1, page), totalPages)
          setCompletedActivities(list)
          setCompletedPage(clamped)
          return
        }
      } catch (e) {
        // server fetch failed — continue to localStorage fallback
      }

      const key = 'completedActivitiesLog'
      const raw = localStorage.getItem(key)
      const arr = raw ? JSON.parse(raw) : []
      let list = Array.isArray(arr) ? arr : []
      // Filter out local snapshots that belong to recurring todos (they should not be recoverable)
      try {
        const serverTodos = await fetchTodos()
        if (Array.isArray(serverTodos)) {
          const filtered = []
          for (const it of list) {
            try {
              if (!it || !it.id) { filtered.push(it); continue }
              const orig = serverTodos.find(t => String(t._id) === String(it.id))
              if (orig && orig.recurring) {
                // skip recurring originals
                continue
              }
              filtered.push(it)
            } catch (_) { filtered.push(it) }
          }
          if (filtered.length !== list.length) {
            list = filtered
            try { localStorage.setItem(key, JSON.stringify(list)) } catch (_) {}
          }
        }
      } catch (_) {}
      // backfill missing cardTitle/cardColor when possible (card still exists)
      let changed = false
      try {
        for (const it of list) {
          if (it && it.cardId && !it.cardTitle) {
            const cardObj = cards && Array.isArray(cards) ? cards.find(c => String(c._id) === String(it.cardId)) : null
            if (cardObj) {
              it.cardTitle = cardObj.title || null
              it.cardColor = cardObj.color || null
              changed = true
            }
          }
        }
        if (changed) localStorage.setItem(key, JSON.stringify(list))
      } catch (_) {}
      const totalPages = Math.max(1, Math.ceil(list.length / completedPageSize))
      const clamped = Math.min(Math.max(1, page), totalPages)
      setCompletedActivities(list)
      setCompletedPage(clamped)
    } catch (e) {
      console.error('Erro ao carregar atividades concluídas', e)
      setCompletedActivities([])
      setCompletedPage(1)
    }
  }

  async function openCompletedModal() {
    await loadCompletedActivitiesFromStorage(1)
    setShowCompletedModal(true)
  }

  function closeCompletedModal() {
    setShowCompletedModal(false)
  }

  function formatCompletedAt(iso) {
    try {
      const d = new Date(iso)
      return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch (_) {
      return iso
    }
  }

  async function recoverCompletedActivity(record) {
    if (!record || !record.id || !record.cardId) return
    const id = record.id
    const cardId = record.cardId
    setRecoveringIds(prev => { const copy = new Set(prev); copy.add(id); return copy })
    try {
      // start exit animation in the completed modal
      setCompletedExitingIds(prev => { const copy = new Set(prev); copy.add(id); return copy })
      // remove any matching entry from localStorage to avoid fallback showing stale record
      try {
        const key = 'completedActivitiesLog'
        const raw = localStorage.getItem(key)
        const arr = raw ? JSON.parse(raw) : []
        const filtered = Array.isArray(arr) ? arr.filter(a => String(a.id) !== String(id)) : []
        localStorage.setItem(key, JSON.stringify(filtered))
      } catch (_) {}

      // wait for exit animation to complete before performing server update
      await new Promise(resolve => setTimeout(resolve, 360))

      // attempt to mark the original todo as not completed and ensure parentId is set
      const res = await updateTodo(id, { completed: false, parentId: cardId })
      if (res && (res.status === 200 || res.ok)) {
        try {
          // animate re-entry into todos list
          setEnteringFromRightIds(prev => { const copy = new Set(prev); copy.add(id); return copy })
          // refresh server-side completed list and main todos
          await loadCompletedActivitiesFromStorage(completedPage)
          const t = await fetchTodos()
          // dedupe todos by _id to avoid duplicates
          const deduped = Array.isArray(t) ? (() => {
            const map = new Map();
            for (const it of t) map.set(String(it._id), it);
            return Array.from(map.values());
          })() : []
          setTodos(deduped)
          // remove entering flag after animation duration
          setTimeout(() => {
            setEnteringFromRightIds(prev => { const copy = new Set(prev); copy.delete(id); return copy })
          }, 420)
          try { toast.success('Atividade recuperada') } catch (_) {}
        } catch (e) {
          console.error('Erro ao atualizar registros após recuperação', e)
        }
      } else {
        console.error('Falha ao recuperar atividade', res)
        try { toast.error('Falha ao recuperar atividade') } catch (_) {}
      }
    } catch (err) {
      console.error('Erro ao recuperar atividade', err)
      try { toast.error('Erro ao recuperar atividade') } catch (_) {}
    } finally {
      // ensure exit/recoving flags are cleared
      setCompletedExitingIds(prev => { const copy = new Set(prev); copy.delete(id); return copy })
      setRecoveringIds(prev => { const copy = new Set(prev); copy.delete(id); return copy })
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setErr(null)
      // ensure user is authenticated; if not, redirect to home
      const { getAuthToken } = await import('../api')
      const token = getAuthToken()
      if (!token) {
        window.location.href = '/'
        return
      }
      try {
        const me = await getMe()
        if (!me || me.error) {
          window.location.href = '/'
          return
        }
      } catch (e) {
        window.location.href = '/'
        return
      }
      try {
        const t = await fetchTodos()
        // dedupe by _id to avoid accidental duplicates
        const deduped = Array.isArray(t) ? (() => {
          const map = new Map();
          for (const it of t) map.set(String(it._id), it);
          return Array.from(map.values());
        })() : []
        setTodos(deduped)
        // trigger entrance animation after todos are set, but only on the
        // first successful load — prevent retriggering during reorders.
        try {
          if (!hasRunInitialAnimation.current) {
            hasRunInitialAnimation.current = true
            setInitialLoad(true)
            setTimeout(() => setInitialLoad(false), 120)
          }
        } catch (_) {}
      } catch (e) {
        setErr('Falha ao carregar atividades')
        try { toast.error('Falha ao carregar atividades') } catch (_) {}
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

  // Helpers: determine related activities and compute a dash color indicating urgency
  function getRelatedActivitiesForCard(card) {
    if (!card) return []
    const cardId = String(card._id)
    return todos.filter(x => {
      const hasName = x.name && String(x.name).trim().length > 0
      const hasRecurring = !!x.recurring
      const hasWeekdays = Array.isArray(x.weekdays) && x.weekdays.length > 0
      const hasDue = !!x.dueDate
      const isActivity = hasName || hasRecurring || hasWeekdays || hasDue
      if (!isActivity) return false

      try {
        if (x.parentId && String(x.parentId) === cardId) return true
      } catch (_) {}

      if ((!x.parentId || x.parentId === null) && hasName && String(x.name).trim() === String(card.title).trim()) return true
      return false
    }).filter(r => !r.completed)
  }

  function earliestDueDateForCard(card) {
    const related = getRelatedActivitiesForCard(card)
    const dates = related.map(r => { try { return r.dueDate ? new Date(r.dueDate) : null } catch (_) { return null } }).filter(d => d instanceof Date && !isNaN(d))
    if (!dates || dates.length === 0) return null
    return dates.reduce((min, d) => !min || d < min ? d : min, null)
  }

  // Compute a small dash color based on time to the nearest due date.
  // Levels: green (far), yellow (approaching), orange (soon), red (due/overdue).
  function getCardDashColor(card) {
    const d = earliestDueDateForCard(card)
    if (!d) return null
    const now = new Date()
    const diffHours = (d - now) / (1000 * 60 * 60)
    // thresholds (hours): >168 (7d) = green, >72 (3d) = yellow, >0 = orange, <=0 = red
    if (diffHours <= 0) return '#d62728' // red
    if (diffHours <= 72) return '#ff7f0e' // orange
    if (diffHours <= 168) return '#f1c40f' // yellow
    return '#2ca02c' // green
  }

  // FLIP animation helpers for reordering cards
  const cardNodes = useRef(new Map())
  const prevRects = useRef(new Map())
  // ensure entrance animation only runs once on first load
  const hasRunInitialAnimation = useRef(false)
  // control for initial entrance animation. We'll keep `initialLoad` true
  // until the todos are loaded so entrance animations run when cards appear.
  const [initialLoad, setInitialLoad] = useState(true)

  // Entrance animation: apply `animate-in` to each card with a stagger on first load
  

  // compute sorted cards: those with earliest due dates first; keep original order for cards without dates
  const sortedCards = React.useMemo(() => {
    const withIndex = cards.map((c, i) => ({ c, i }))
    withIndex.sort((a, b) => {
      const da = earliestDueDateForCard(a.c)
      const db = earliestDueDateForCard(b.c)
      if (!da && !db) return a.i - b.i
      if (!da) return 1
      if (!db) return -1
      return da - db
    })
    return withIndex.map(x => x.c)
  }, [cards])

  // Entrance animation: apply `animate-in` to each card with a stagger on first load
  useEffect(() => {
    if (!initialLoad) return
    // programmatically animate from left with stagger (more reliable across renders)
    const handles = []
    // run only after refs are populated (poll via rAF up to a few frames)
    let attempts = 0
    function run() {
      sortedCards.forEach((c, i) => {
        const id = String(c._id)
        const node = cardNodes.current.get(id)
        if (!node) return
        try {
          // set initial state
          node.style.transform = 'translateX(-40px)'
          node.style.opacity = '0'
          node.style.transition = 'transform 420ms cubic-bezier(.2,.9,.3,1), opacity 420ms'
          node.style.transitionDelay = `${i * 80}ms`
          // trigger to final state on next frame
          requestAnimationFrame(() => {
            node.style.transform = ''
            node.style.opacity = '1'
          })
          // cleanup after animation
          const cleanupTimer = setTimeout(() => {
            try {
              node.style.transition = ''
              node.style.transitionDelay = ''
            } catch (_) {}
          }, 520 + i * 80)
          handles.push(cleanupTimer)
        } catch (_) {}
      })
    }

    function waitForRefs() {
      // if no cards or refs match expected count, run immediately
      if (sortedCards.length === 0) return
      if (cardNodes.current.size >= sortedCards.length || attempts > 12) {
        // apply class-based animation (same as activity items) with staggered delay
        sortedCards.forEach((c, i) => {
          const id = String(c._id)
          const node = cardNodes.current.get(id)
          if (!node) return
          try {
            node.style.animationDelay = `${i * 80}ms`
            node.classList.add('animate-in')
            const total = 360 + i * 80 // duration 360ms (match activities) + delay
            const cleanup = setTimeout(() => {
              try { node.classList.remove('animate-in') } catch (_) {}
              try { node.style.animationDelay = '' } catch (_) {}
            }, total + 80)
            handles.push(cleanup)
          } catch (_) {}
        })
        return
      }
      attempts++
      requestAnimationFrame(waitForRefs)
    }

    requestAnimationFrame(waitForRefs)
    return () => handles.forEach(h => clearTimeout(h))
  }, [initialLoad, sortedCards.map(c => c._id).join(',')])

  // run FLIP whenever sortedCards order changes
  useEffect(() => {
    try {
      // ensure any entrance animation class is cleared before running FLIP
      // so the slide-from-left animation doesn't replay during reorders
      for (const [, node] of cardNodes.current.entries()) {
        try {
          if (node && node.classList) {
            node.classList.remove('animate-in')
            node.style.animationDelay = ''
          }
        } catch (_) {}
      }
      // capture new rects
      const newRects = new Map()
      for (const [id, node] of cardNodes.current.entries()) {
        if (!node) continue
        const r = node.getBoundingClientRect()
        newRects.set(id, r)
      }

      // for each card id that existed before, compute delta and animate
      for (const [id, newRect] of newRects.entries()) {
        const prev = prevRects.current.get(id)
        if (!prev) continue
        const deltaY = prev.top - newRect.top
        if (deltaY === 0) continue
        const node = cardNodes.current.get(id)
        if (!node) continue
        // invert: place node at old position
        node.style.transition = 'none'
        node.style.transform = `translateY(${deltaY}px)`
        // mark as moving (adds shadow + elevated z-index)
        node.classList.add('moving')
        node.style.zIndex = '600'
        // play the animation to natural position
        requestAnimationFrame(() => {
          node.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1)'
          node.style.transform = ''
        })
        // cleanup per-node after animation
        setTimeout(() => {
          try { node.classList.remove('moving') } catch (_) {}
          try { node.style.zIndex = '' } catch (_) {}
          try { node.style.transition = '' } catch (_) {}
          try { node.style.transform = '' } catch (_) {}
        }, 480)
      }

      // after animations, clear inline styles
      const cleanup = setTimeout(() => {
        for (const [, node] of cardNodes.current.entries()) {
          if (node) {
            node.style.transition = ''
            node.style.transform = ''
          }
        }
      }, 500)

      // store new rects for next update
      prevRects.current = newRects
      return () => clearTimeout(cleanup)
    } catch (e) {
      // ignore
    }
  }, [sortedCards.map(c => c._id).join(',')])

  function toggleWeekday(day) {
    setWeekdays(w => w.includes(day) ? w.filter(x => x !== day) : [...w, day])
  }

  async function saveEditing() {
    if (!editingCard) return
    if (!editingTitle || String(editingTitle).trim() === '') {
      toast.error('Preencha o título')
      return
    }
    setEditingLoading(true)
    try {
      const res = await updateTodo(editingCard._id, { title: editingTitle, description: editingDesc, color: editingColor })
      if (res && (res.status === 200 || res.ok)) {
        toast.success('Alterações salvas com sucesso')
        const t = await fetchTodos()
        setTodos(Array.isArray(t) ? t : [])
        // Update completed activities log (localStorage) so previously completed items
        // that belong to this card use the updated color/title when shown/recovered.
        try {
          const key = 'completedActivitiesLog'
          const raw = localStorage.getItem(key)
          const arr = raw ? JSON.parse(raw) : []
          let changed = false
          if (Array.isArray(arr)) {
            for (const it of arr) {
              if (it && it.cardId && String(it.cardId) === String(editingCard._id)) {
                it.cardColor = editingColor
                it.cardTitle = editingTitle
                changed = true
              }
            }
            if (changed) {
              localStorage.setItem(key, JSON.stringify(arr))
              try { setCompletedActivities(prev => Array.isArray(prev) ? prev.map(it => (it && it.cardId && String(it.cardId) === String(editingCard._id) ? ({ ...it, cardColor: editingColor, cardTitle: editingTitle }) : it)) : prev) } catch (_) {}
            }
          }
        } catch (_) {}
        // fechar modal após breve delay para o usuário ver a confirmação
        setTimeout(() => {
          setEditingCard(null)
          setEditingTitle('')
          setEditingDesc('')
          // editingMsg no longer used; toast already shown
        }, 900)
      } else {
        let text = 'Erro ao salvar alterações'
        try {
          const body = await res.json()
          if (body && body.error) text = body.error
        } catch (_) {}
        toast.error(text)
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar alterações')
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
    if (!title) {
      toast.error('Preencha o título')
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
        toast.success('Atividade criada')
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
        toast.error(body.error || 'Erro ao criar atividade')
      }
    } catch (err) {
      toast.error('Erro na requisição')
    }
  }

  async function handleCreateCard(e) {
    e.preventDefault()
    if (!cardTitle) {
      toast.error('Preencha o título do cartão')
      return
    }
    try {
      const payload = { title: cardTitle, description: cardDesc || '', name: '', recurring: false, weekdays: [], dueDate: null, color: cardColor }
      const old = todos || []
      const res = await createTodo(payload)
      if (res && res.status === 201) {
        toast.success('Cartão criado')
        setCardTitle('')
        setCardDesc('')
        setCardColor('#000000')
        setShowCardForm(false)
        const fresh = await fetchTodos()
        setTodos(Array.isArray(fresh) ? fresh : [])
        // novo cartão criado — o estilo padrão `empty-card` já aplica animação sutil
      } else {
        const body = await res.json()
        toast.error(body.error || 'Erro ao criar cartão')
      }
    } catch (err) {
      toast.error('Erro na requisição')
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
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Cor do cartão</div>
                  <div className="color-palette" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['#000000','#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#17becf'].map(c => (
                      <button key={c} type="button" className={"color-swatch" + (editingColor === c ? ' selected' : '')} onClick={() => setEditingColor(c)} style={{ background: c }} aria-label={`Cor ${c}`} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <button className="btn" onClick={saveEditing} disabled={editingLoading}>{editingLoading ? 'Salvando...' : 'Salvar'}</button>
                  <button className="btn secondary" onClick={cancelEditing} disabled={editingLoading}>Cancelar</button>
                  {/* editing messages are shown via toasts now */}
                </div>
              </div>
            </div>
          )}
        <div className="activities-controls-row" style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          {!showCardForm && !showForm && (
            <button className="btn mobile-small" onClick={() => { setShowCardForm(true); setShowForm(false); }}>Novo cartão</button>
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
              {/* card messages are shown via toasts now */}
            </form>
          )}
          {!showForm && !showCardForm && (
            <>
              <button className="btn mobile-small" onClick={() => { setShowForm(true); setShowCardForm(false); if (cards && cards.length > 0) setSelectedCardId(cards[0]._id); }} disabled={!(hasAnyActivity || (cards && cards.length > 0))}>Nova atividade</button>
              <button type="button" className="btn secondary mobile-small" onClick={openCompletedModal} style={{ marginLeft: 8 }}>Atividades concluídas</button>
            </>
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
              {/* form messages are shown via toasts now */}
            </form>
          )}
        </div>
        <h2>Atividades</h2>
        {loading && <p className="muted">Carregando...</p>}
        {/* errors are shown via toasts now */}

        {cards.length === 0 ? (
          <p className="muted">Nenhum cartão encontrado.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {sortedCards.map((t, idx) => {
              const dashColor = getCardDashColor(t)
              const cardBaseColor = t.color || 'var(--card-color)'
              const dashTarget = dashColor || null
              return (
                <div
                  key={t._id}
                  onClick={() => setViewCard(t)}
                  ref={el => { if (el) cardNodes.current.set(String(t._id), el); else cardNodes.current.delete(String(t._id)) }}
                  className={`crono-card compact empty-card ${t.color ? 'colored' : ''} ${removingId === t._id ? ' removing' : ''}`}
                  style={{ background: t.color || undefined, color: t.color ? '#fff' : undefined, ['--card-color']: t.color || '#000', ['--card-urgency-color']: dashTarget || '#ffffff' }}
                >
                  <div className="ec-left">
                    <span className="ec-title">{t.title}</span>
                    <span className="ec-sub muted">{t.description && String(t.description).trim().length > 0 ? t.description : (t.completed ? 'Concluída' : 'Sem descrição')}</span>
                  </div>
                  <div className="ec-right">
                    <button className="icon-btn" title="Editar" onClick={(e) => { e.stopPropagation(); setEditingCard(t); setEditingTitle(t.title || ''); setEditingDesc(t.description || ''); setEditingColor(t.color || '#000000') }}>
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
              )
            })}
          </div>
        )}
        {showCompletedModal && (
          <div className="modal-overlay" onClick={closeCompletedModal}>
            <div className="modal-content card-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
              <button className="modal-close" onClick={closeCompletedModal}>×</button>
              <h3 style={{ marginTop: 0 }}>Atividades concluídas</h3>
              <p className="muted">Registros locais de atividades concluídas (últimas 200)</p>
              <hr />
              {(!completedActivities || completedActivities.length === 0) ? (
                <p className="muted">Nenhuma atividade concluída registrada.</p>
              ) : (
                (() => {
                  // deduplicate by id (or completedAt fallback) to avoid accidental duplicates
                  const seen = new Map()
                  for (const it of (completedActivities || [])) {
                    const key = it.id || it.completedAt || JSON.stringify(it)
                    if (!seen.has(key)) seen.set(key, it)
                  }
                  const unique = Array.from(seen.values())
                  const total = unique.length
                  const totalPages = Math.max(1, Math.ceil(total / completedPageSize))
                  const start = (completedPage - 1) * completedPageSize
                  const pageItems = unique.slice(start, start + completedPageSize)
                  return (
                    <div>
                      <ul style={{ padding: 0, listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {pageItems.map((a, idx) => {
                          const cardObj = a.cardId ? cards.find(c => String(c._id) === String(a.cardId)) : null
                          // determine if the original todo (if present) is recurring — if so, do not allow recovery
                          let origIsRecurring = false
                          try {
                            const orig = todos && Array.isArray(todos) ? todos.find(t => String(t._id) === String(a.id)) : null
                            if (orig && orig.recurring) origIsRecurring = true
                          } catch (_) {}
                          // Prefer snapshot from the completed record (cardTitle/cardColor) when present
                          // Prefer the live card data when available so edits to the card
                          // (like color/title) immediately reflect in the completed list.
                          const cardTitle = (cardObj && cardObj.title) ? cardObj.title : (a.cardTitle || (a.cardId ? '—' : '—'))
                          const cardColor = (cardObj && cardObj.color) ? cardObj.color : (a.cardColor || '#000')
                          const isExitingCompleted = completedExitingIds.has(String(a.id))
                          return (
                            <li key={a.id || (completedPage+'-'+idx)} className={(isExitingCompleted ? 'completed-item exit' : 'completed-item')} style={{ padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{a.title}</div>
                                <div className="completed-date completed-date-left muted" style={{ fontSize: 12, marginTop: 6 }}>{formatCompletedAt(a.completedAt)}</div>
                                <div className="muted" style={{ fontSize: 13 }}>{a.description || ''}</div>
                                <div className="muted" style={{ fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span className="card-dot" style={{ background: cardColor }} />
                                    <span>Cartão: {cardTitle}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="completed-right" style={{ whiteSpace: 'nowrap', textAlign: 'right', minWidth: 160 }}>
                                <div className="completed-date completed-date-right" style={{ fontSize: 13, fontWeight: 700 }}>{formatCompletedAt(a.completedAt)}</div>
                                {cardObj && !origIsRecurring && (
                                  <div style={{ marginTop: 8 }}>
                                    <button className="btn" type="button" onClick={() => recoverCompletedActivity(a)} disabled={recoveringIds.has(a.id)} style={{ padding: '6px 10px', fontSize: 13 }}>
                                      {recoveringIds.has(a.id) ? 'Recuperando...' : 'Recuperar'}
                                    </button>
                                  </div>
                                )}
                                {origIsRecurring && (
                                  <div style={{ marginTop: 8 }}>
                                    <button className="btn" type="button" disabled style={{ padding: '6px 10px', fontSize: 13, opacity: 0.6, cursor: 'default' }}>
                                      Não recuperável
                                    </button>
                                  </div>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <div className="muted">Página {completedPage} de {totalPages} — {total} registros</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn secondary" onClick={() => loadCompletedActivitiesFromStorage(Math.max(1, completedPage - 1))} disabled={completedPage <= 1}>Anterior</button>
                          <button className="btn" onClick={() => loadCompletedActivitiesFromStorage(Math.min(totalPages, completedPage + 1))} disabled={completedPage >= totalPages}>Próxima</button>
                        </div>
                      </div>
                    </div>
                  )
                })()
              )}
            </div>
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
                // collect related activities for this card (prefer parentId, fallback to name match only when parentId is null)
                const viewCardId = String(viewCard._id)
                const related = todos.filter(x => {
                  // only consider items that look like activities (not cards)
                  const hasName = x.name && String(x.name).trim().length > 0
                  const hasRecurring = !!x.recurring
                  const hasWeekdays = Array.isArray(x.weekdays) && x.weekdays.length > 0
                  const hasDue = !!x.dueDate
                  const isActivity = hasName || hasRecurring || hasWeekdays || hasDue
                  if (!isActivity) return false

                  // prefer explicit parentId matching
                  try {
                    if (x.parentId && String(x.parentId) === viewCardId) return true
                  } catch (_) {}

                  // fallback: only match by name when there is no parentId stored
                  if ((!x.parentId || x.parentId === null) && hasName && String(x.name).trim() === String(viewCard.title).trim()) return true
                  return false
                }).filter(r => !r.completed)
                if (!related || related.length === 0) {
                  return <p className="muted">Nenhuma atividade neste cartão.</p>
                }
                return (
                  <ul style={{ padding: 0, listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {related.map(r => {
                      const isExiting = exitingIds.has(r._id)
                      const isPending = pendingIds.has(r._id)
                      const entering = viewCard && !isExiting && !isPending
                      const enterRight = enteringFromRightIds.has(String(r._id))
                      return (
                        <li key={r._id} className={"activity-item" + (isExiting ? ' exit' : '') + (enterRight ? ' enter-right' : (entering ? ' animate-in' : ''))} style={{ padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700 }}>{r.title}</div>
                              <div className="muted" style={{ fontSize: 13 }}>{r.description || ''}</div>
                            </div>
                            <div className={"activity-actions" + (entering ? ' animate-in' : '')} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <div className="muted" style={{ fontSize: 13 }}>{r.dueDate ? new Date(r.dueDate).toLocaleString() : ''}</div>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <input type="checkbox" aria-label={`Marcar ${r.title} como concluída`} checked={!!r.completed || optimisticCompletedIds.has(r._id)} disabled={isExiting || isPending} onChange={e => { updateActivityCompletion(r._id, e.target.checked); }} />
                              </label>
                            </div>
                          </div>
                        </li>
                      )
                    })}
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
