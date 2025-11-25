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
          <h3 className="section-title">Exemplos de Cartões</h3>
          <div className="example-list">
            {/** mock data and compact cards rendering */}
            {(() => {
              const mock = [
                {
                  id: 'c3',
                  title: 'Entrega Cliente',
                  activities: [
                    { title: 'Finalizar relatórios', due: '2025-11-24T09:00:00' },
                    { title: 'Enviar versão final', due: '2025-11-25T11:00:00' }
                  ]
                },
                {
                  id: 'c1',
                  title: 'Projeto Alpha',
                  activities: [
                    { title: 'Planejar milestones', due: '2025-12-31T18:00:00' },
                    { title: 'Reunião com time', due: '2025-12-20T10:00:00' }
                  ]
                },
                {
                  id: 'c2',
                  title: 'Site Update',
                  activities: [
                    { title: 'Atualizar landing', due: '2025-11-30T14:00:00' },
                    { title: 'Testes responsivos', due: '2025-12-01T09:00:00' }
                  ]
                }
              ]

              function earliestDate(activities) {
                if (!activities || activities.length === 0) return null
                return activities.reduce((min, a) => {
                  const d = new Date(a.due)
                  return !min || d < min ? d : min
                }, null)
              }

              function latestDate(activities) {
                if (!activities || activities.length === 0) return null
                return activities.reduce((max, a) => {
                  const d = new Date(a.due)
                  return !max || d > max ? d : max
                }, null)
              }

              function formatShort(d) {
                if (!d) return '-'
                // Format as DD/MM/YYYY - HH:MM:SS (include seconds)
                const day = String(d.getDate()).padStart(2, '0')
                const month = String(d.getMonth() + 1).padStart(2, '0')
                const year = d.getFullYear()
                const hours = String(d.getHours()).padStart(2, '0')
                const minutes = String(d.getMinutes()).padStart(2, '0')
                const seconds = String(d.getSeconds()).padStart(2, '0')
                return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`
              }

              function urgencyClass(d) {
                if (!d) return 'urgency-low'
                const now = new Date()
                const diff = (d - now) / (1000 * 60 * 60) // hours
                if (diff <= 24) return 'urgency-high'
                if (diff <= 72) return 'urgency-medium'
                return 'urgency-low'
              }

              // compute earliest/latest and priority, then render example cards
              const prioritized = mock.map(card => {
                const earliest = earliestDate(card.activities)
                const latest = latestDate(card.activities)
                const urgency = urgencyClass(earliest)

                return (
                  <article key={card.id} className={`example-card ${urgency}`}>
                        <h4>{card.title}</h4>
                        <div className="example-meta">
                          <div><strong>Início:</strong> {formatShort(earliest)}</div>
                          <div><strong>Fim:</strong> {formatShort(latest)}</div>
                        </div>
                      </article>
                )
              })

              return prioritized
            })()}
          </div>
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
  const items = new Array(6).fill(null).map((_, i) => ({ id: i, title: `Em breve ${i + 1}` }))

  function prev() { setIndex(i => (i - 1 + items.length) % items.length) }
  function next() { setIndex(i => (i + 1) % items.length) }

  // thumbnails: show prev, current, next (wrap-around)
  const len = items.length
  const thumbs = [ (index - 1 + len) % len, index, (index + 1) % len ]

  // modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)

  function openModal(i) {
    setModalIndex(i)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function modalPrev() { setModalIndex(i => (i - 1 + items.length) % items.length) }
  function modalNext() { setModalIndex(i => (i + 1) % items.length) }

  // keyboard support (handles both gallery and modal)
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') {
        if (modalOpen) modalPrev()
        else prev()
      }
      if (e.key === 'ArrowRight') {
        if (modalOpen) modalNext()
        else next()
      }
      if (e.key === 'Escape' && modalOpen) closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  return (
    <div className="gallery-block">
      <div className="gallery-slider">
        <button className="gallery-arrow" aria-label="Anterior" onClick={prev}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M15 18 L9 12 L15 6" />
          </svg>
        </button>
        <div className="gallery-main" role="img" aria-label={items[index].title} onClick={() => openModal(index)}>
          <div className="gallery-main-placeholder">{items[index].title}</div>
        </div>
        <button className="gallery-arrow" aria-label="Próximo" onClick={next}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M9 18 L15 12 L9 6" />
          </svg>
        </button>
      </div>

      <div className="gallery-thumbs">
        {thumbs.map(i => (
          <button key={i} className={`thumb ${i === index ? 'active' : ''}`} onClick={() => setIndex(i)} aria-label={`Ir para ${items[i].title}`}>
            <div className="thumb-placeholder">{items[i].title}</div>
          </button>
        ))}
      </div>

      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" aria-label="Fechar" onClick={closeModal}>×</button>
            <div className="modal-main-row">
              <button className="gallery-arrow modal" aria-label="Anterior" onClick={modalPrev}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M15 18 L9 12 L15 6" />
                </svg>
              </button>
              <div className="modal-main" role="img" aria-label={items[modalIndex].title}>
                <div className="gallery-main-placeholder">{items[modalIndex].title}</div>
              </div>
              <button className="gallery-arrow modal" aria-label="Próximo" onClick={modalNext}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M9 18 L15 12 L9 6" />
                </svg>
              </button>
            </div>

            <div className="modal-thumbs">
              {items.map((it, idx) => (
                <button key={it.id} className={`thumb ${idx === modalIndex ? 'active' : ''}`} onClick={() => setModalIndex(idx)} aria-label={`Ir para ${it.title}`}>
                  <div className="thumb-placeholder">{it.title}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
