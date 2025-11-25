import React from 'react'

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

              // compute earliest/latest and priority, then sort so high urgency (red) shows first
              const prioritized = mock.map(card => {
                const earliest = earliestDate(card.activities)
                const latest = latestDate(card.activities)
                // numeric priority: 3 = high (red), 2 = medium (yellow), 1 = low (green)
                let prio = (() => {
                  if (!earliest) return 1
                  const now = new Date()
                  const diff = (earliest - now) / (1000 * 60 * 60) // hours
                  if (diff <= 24) return 3
                  if (diff <= 72) return 2
                  return 1
                })()
                // Example override: force card with id 'c1' to medium (yellow)
                if (card.id === 'c1') prio = 2
                return { card, earliest, latest, prio }
              }).sort((a, b) => b.prio - a.prio)

              return prioritized.map(item => {
                const { card, earliest, latest, prio } = item
                // determine class from numeric priority so forced prio reflects visually
                const cls = prio === 3 ? 'urgency-high' : prio === 2 ? 'urgency-medium' : 'urgency-low'
                return (
                  <div key={card.id} className={`example-card ${cls} full-width compact`}>
                    <div className="ec-left">
                      <div className="ec-title">{card.title}</div>
                      <div className="ec-sub muted">{card.activities.length} atividades</div>
                    </div>

                    <div className="ec-right">
                      <div className="ec-badge">
                        <div className="ec-dates">
                          <span className="ec-start"><strong>Início:</strong>&nbsp;<span className="date">{formatShort(earliest)}</span></span>
                          <span className="ec-end"><strong>Fim:</strong>&nbsp;<span className="date">{formatShort(latest)}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>

          <p className="muted">Pronto para começar? 🚀 Inspire-se com modelos práticos de cartões e organize suas tarefas em segundos. As cores indicam urgência — verde (baixa), amarelo (média) e vermelho (alta).</p>
        </div>
      </section>

      <footer className="site-footer">
        <small>© {new Date().getFullYear()} Crono — Desenvolvido por Euzebio Batista.</small>
      </footer>
    </div>
  )
}
