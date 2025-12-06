const express = require('express');
const router = express.Router();
const overdueScanner = require('../jobs/overdueScanner');

// Rota para disparar verificação manual de atividades vencidas
// Será chamada pelo GitHub Action a cada 10 minutos
router.post('/check-overdue', async (req, res) => {
  try {
    // Validação simples de segurança (opcional: adicione um token secreto)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Executa a verificação
    await overdueScanner.scanOnce();
    
    res.json({ 
      success: true, 
      message: 'Verificação de atividades vencidas concluída',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar atividades vencidas:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar atividades vencidas',
      message: error.message 
    });
  }
});

module.exports = router;
