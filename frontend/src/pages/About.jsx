import React from 'react'

export default function About() {
  return (
    <div className="about-page section-bleed">
      <div className="section-inner">
        <h2>Sobre o Crono</h2>
        <p>
          Crono é uma lista de tarefas leve e orientada a prazos — construída para você planejar, priorizar e cumprir suas atividades sem complicação.
        </p>

        <section className="about-features">
          <h3>O que o Crono faz</h3>
          <ul className="feature-list">
            <li>🎯 <strong>Foco em prazos:</strong> cartões mudam de cor conforme o tempo passa para você identificar o que requer atenção agora.</li>
            <li>🔁 <strong>Recorrência:</strong> marque atividades que se repetem e mantenha sua rotina atualizada sem esforço.</li>
            <li>⏰ <strong>Lembretes visuais:</strong> cartões com prazos próximos sobem na lista automaticamente.</li>
            <li>🔒 <strong>Privacidade:</strong> autenticação para manter suas listas pessoais seguras.</li>
            <li>📱 <strong>Responsivo:</strong> funciona tanto no desktop quanto no celular com uma interface simples e rápida.</li>
          </ul>
        </section>

        <section className="about-details">
          <h3>Como os cartões funcionam (resumido)</h3>
          <ol>
            <li>Crie um cartão para um projeto ou área.</li>
            <li>Adicione atividades com data/hora e marque recorrência quando necessário.</li>
            <li>O sistema ordena e destaca automaticamente os cartões conforme a urgência.</li>
          </ol>
        </section>

        <section className="author">
          <h3>Sobre o desenvolvedor</h3>
          <p>
            Desenvolvido por <strong>Euzebio Batista</strong>. O Crono é um projeto pensado para ser simples, útil e expansível — objetivo de integrar notificações, sincronização e integração com calendários no roadmap.
          </p>
          <p className="call-to-action">Se quiser testar ou contribuir, abra uma issue ou PR no repositório do projeto.</p>
        </section>
      </div>
    </div>
  )
}
