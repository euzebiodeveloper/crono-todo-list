import React, { useRef, useState, useEffect } from 'react'

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero section-bleed">
        <div className="section-inner hero-inner">
          <div className="hero-left">
            <img src="/images/complete-logo.png" alt="Crono" className="hero-logo" />
          </div>
          <div className="hero-content">
            <h2 className="hero-title">Organize seu tempo. Vença suas tarefas.</h2>
            <p className="hero-sub">Crono é uma lista de tarefas leve e focada em produtividade — com autenticação, histórico e uma interface simples para desktop e mobile.</p>
            <div className="hero-ctas">
              <a className="btn" href="/register">Crie sua conta</a>
              <a className="btn secondary" href="/about">Saiba mais</a>
            </div>
          </div>
        </div>
      </section>

      

      <section className="section-bleed section-features">
        <div className="section-inner">
          <h3>O que você ganha com o Crono</h3>
          <div className="cards column">
            <article className="card">
              <div className="card-icon">📈</div>
              <h4>Simples e Rápido</h4>
              <p>Interface minimalista para focar no que importa: suas tarefas.</p>
            </article>
            <article className="card">
              <div className="card-icon">📱</div>
              <h4>Multi-dispositivo</h4>
              <p>Use no celular ou desktop — design responsivo e rápido.</p>
            </article>
            <article className="card">
              <div className="card-icon">🔒</div>
              <h4>Privado</h4>
              <p>Autenticação para manter suas listas e cartões seguros.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-bleed gallery-section">
        <div className="section-inner">
          <h3 className="section-title">Galeria</h3>
          <GallerySlider />
        </div>
      </section>

      <section className="section-bleed how-it-works">
        <div className="section-inner">
          <h3>Como funciona</h3>
          {/* Treasure-map style steps */}
          <div className="steps">
          {(() => {
            const steps = [
              { id: 1, title: 'Crie cartões', desc: 'Crie cartões para projetos ou áreas (ex.: Trabalho, Pessoal).', icon: '🗂️' },
              { id: 2, title: 'Adicione atividades', desc: 'Adicione atividades dentro dos cartões com data e hora marcada.', icon: '📝' },
              { id: 3, title: 'Defina recorrência', desc: 'Defina recorrência quando desejar que a atividade se repita.', icon: '🔁' },
              { id: 4, title: 'Aproximação do prazo', desc: 'Aproximação do prazo torna o cartão mais vermelho e altera sua posição automaticamente.', icon: '⏰' }
            ]

            return (
              <>
                <div className="steps-row">
                  {steps.map((s, i) => (
                    <div key={s.id} className="step-card">
                      <div className="step-icon" aria-hidden>{s.icon}</div>
                      <div className="step-body">
                        <div className="step-title">{s.title}</div>
                        <div className="step-desc muted">{s.desc}</div>
                      </div>
                      <div className="step-number">{i + 1}</div>
                    </div>
                  ))}

                  <div className="step-end" title="Fim: X marca o tesouro">✖</div>
                </div>
                <p className="muted steps-note">Você chegou no objetivo final — parabéns! Siga o mapa: cada cartão é um passo. O 'X' marca o objetivo final.</p>
              </>
            )
          })()}
          </div>
        </div>
      </section>

      <section className="section-bleed section-examples">
        <div className="section-inner">
          <h3 className="section-title">Como os cartões são ranqueados</h3>
          <p className="muted">Cada cartão recebe uma cor que indica urgência com base nas atividades internas e nas datas de entrega. A lógica é:</p>
          <ul>
            <li><strong>Branco:</strong> Cartão sem atividades ou quando nenhuma atividade tem data de entrega — sem prioridade.</li>
            <li><strong>Verde:</strong> Há atividade com prazo, mas o prazo mais próximo está distante — estado normal.</li>
            <li><strong>Amarelo:</strong> Prazo se aproximando — atenção necessária.</li>
            <li><strong>Laranja:</strong> Prazo em breve — priorizar esta tarefa.</li>
            <li><strong>Vermelho:</strong> Prazo atingido ou vencido — ação imediata requerida.</li>
          </ul>

          <p className="muted">Thresholds usados (fórmula baseada na hora restante até o prazo mais próximo):</p>
          <ul>
            <li><strong>Vermelho:</strong> faltando &le; 0 horas (já vencido)</li>
            <li><strong>Laranja:</strong> faltando &le; 72 horas (3 dias)</li>
            <li><strong>Amarelo:</strong> faltando &le; 168 horas (7 dias)</li>
            <li><strong>Verde:</strong> mais de 168 horas</li>
          </ul>

          <div className="examples-row" style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <article className="step-card crono-step-card">
              <div className="step-icon" aria-hidden>
                <span className="card-dot" style={{ background: '#bdbdbd' }} />
              </div>
              <div className="step-body">
                <div className="step-title">Sem prazos</div>
                <div className="step-desc muted">Cartão branco: sem atividades com data</div>
              </div>
            </article>

            <article className="step-card crono-step-card">
              <div className="step-icon" aria-hidden>
                <span className="card-dot" style={{ background: '#27ae60' }} />
              </div>
              <div className="step-body">
                <div className="step-title">Verde (normal)</div>
                <div className="step-desc muted">Prazo mais próximo: &gt; 7 dias</div>
              </div>
            </article>

            <article className="step-card crono-step-card">
              <div className="step-icon" aria-hidden>
                <span className="card-dot" style={{ background: '#f1c40f' }} />
              </div>
              <div className="step-body">
                <div className="step-title">Amarelo (atenção)</div>
                <div className="step-desc muted">Prazo mais próximo: ≤ 7 dias</div>
              </div>
            </article>

            <article className="step-card crono-step-card">
              <div className="step-icon" aria-hidden>
                <span className="card-dot" style={{ background: '#ff7f0e' }} />
              </div>
              <div className="step-body">
                <div className="step-title">Laranja (em breve)</div>
                <div className="step-desc muted">Prazo mais próximo: ≤ 3 dias</div>
              </div>
            </article>

            <article className="step-card crono-step-card">
              <div className="step-icon" aria-hidden>
                <span className="card-dot" style={{ background: '#d62728' }} />
              </div>
              <div className="step-body">
                <div className="step-title">Vermelho (urgente)</div>
                <div className="step-desc muted">Prazo atingido ou vencido (0 dias)</div>
              </div>
            </article>
          </div>

          <p className="muted" style={{ marginTop: 12 }}>Observação: internamente o sistema considera a data/hora mais próxima entre as atividades do cartão para determinar a cor; quando não há datas válidas, o cartão fica branco.</p>
        </div>
      </section>

      <footer className="site-footer">
        <small>© {new Date().getFullYear()} Crono — Desenvolvido por Euzebio Batista.</small>
      </footer>
    </div>
  )
}

function GallerySlider() {
  const [index, setIndex] = useState(0)
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)

  useEffect(() => {
    let mounted = true
    async function loadGallery() {
      try {
        const res = await fetch('/images/gallery/gallery.json')
        if (!res.ok) throw new Error('no manifest')
        const json = await res.json()
        if (mounted && Array.isArray(json) && json.length > 0) setItems(json)
      } catch (_) {
        // fallback: default placeholders
        if (mounted && items.length === 0) setItems(new Array(6).fill(null).map((_, i) => ({ id: i, title: `Em breve ${i + 1}` })))
      }
    }
    loadGallery()
    return () => { mounted = false }
  }, [])

  function prev() { setIndex(i => (i - 1 + items.length) % items.length) }
  function next() { setIndex(i => (i + 1) % items.length) }

  // thumbnails: show prev, current, next (wrap-around)
  const len = items.length || 1
  const thumbs = [ (index - 1 + len) % len, index, (index + 1) % len ]
  // ensure thumbnails are unique (avoid duplicate React keys when len < 3)
  const uniqueThumbs = Array.from(new Set(thumbs))

  function openModal(i) { setModalIndex(i); setModalOpen(true) }
  function closeModal() { setModalOpen(false) }
  function modalPrev() { setModalIndex(i => (i - 1 + items.length) % items.length) }
  function modalNext() { setModalIndex(i => (i + 1) % items.length) }

  // keyboard support: when modalOpen (viewing single photo), only allow Escape to close
  useEffect(() => {
    function onKey(e) {
      if (modalOpen) {
        if (e.key === 'Escape') closeModal()
        return
      }
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, items])

  const current = items[index] || { title: '', file: null }

  return (
    <div className="gallery-block">
      <div className="gallery-slider">
        <div className="gallery-main" role="img" aria-label={current.title} onClick={() => openModal(index)}>
          <button className="gallery-arrow left" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); prev(); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M15 18 L9 12 L15 6" />
            </svg>
          </button>
          {current.file ? (
            <img src={`/images/gallery/${current.file}`} alt={current.alt || current.title} style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }} />
          ) : (
            <div className="gallery-main-placeholder">{current.title}</div>
          )}
          <button className="gallery-arrow right" aria-label="Próximo" onClick={(e) => { e.stopPropagation(); next(); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 18 L15 12 L9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="gallery-thumbs">
        {uniqueThumbs.map(i => (
          <button key={items[i] && items[i].id ? `thumb-${items[i].id}` : `thumb-${i}`} className={`thumb ${i === index ? 'active' : ''}`} onClick={() => setIndex(i)} aria-label={`Ir para ${items[i] ? items[i].title : i}`}>
            {items[i] && items[i].file ? (
              <img src={`/images/gallery/${items[i].file}`} alt={items[i].alt || items[i].title} style={{ width: 120, height: 72, objectFit: 'cover', borderRadius: 6 }} />
            ) : (
              <div className="thumb-placeholder">{items[i] ? items[i].title : '—'}</div>
            )}
          </button>
        ))}
      </div>

      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="modal-content gallery-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-main" role="img" aria-label={items[modalIndex] ? items[modalIndex].title : ''}>
              {items[modalIndex] && items[modalIndex].file ? (
                <div className="photo-frame-wrap">
                  <div className="photo-frame">
                    <button className="modal-close photo-close" aria-label="Fechar" onClick={closeModal}>×</button>
                    <img src={`/images/gallery/${items[modalIndex].file}`} alt={items[modalIndex].alt || items[modalIndex].title} />
                  </div>
                  {/* caption removed: don't render title/caption under the photo */}
                </div>
              ) : (
                <div className="gallery-main-placeholder">{items[modalIndex] ? items[modalIndex].title : ''}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
