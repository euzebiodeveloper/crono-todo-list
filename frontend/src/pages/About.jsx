import React from 'react'

export default function About() {
  return (
    <div className="about-page section-bleed">
      <div className="section-inner">
        <h2>Sobre o Crono</h2>
        <p>O Crono é uma aplicação pensada para ajudar a gerenciar tarefas com foco em prazos e prioridades.</p>

        <section className="about-features">
          <h3>Visão geral</h3>
          <p>O sistema organiza o trabalho em cartões (containers). Cada cartão pode conter várias atividades com data e hora. As atividades podem ser marcadas como recorrentes. Conforme os prazos se aproximam, o sistema destaca os cartões visualmente para priorização rápida.</p>
        </section>

        <section className="about-details">
          <h3>Dinâmica dos cartões</h3>
          <ul>
            <li>Cartões mudam de cor do verde para o vermelho conforme o prazo se aproxima.</li>
            <li>Cartões com prioridade mais alta sobem na lista automaticamente.</li>
            <li>Em caso de empate por data, o cartão mais antigo assume prioridade.</li>
          </ul>
        </section>

        <section className="author">
          <h3>Desenvolvedor</h3>
          <p>Criado e mantido por <strong>Euzebio Batista</strong>. O projeto é open-source e planejado para evoluir com sincronização, notificações e integração com calendários.</p>
        </section>
      </div>
    </div>
  )
}
