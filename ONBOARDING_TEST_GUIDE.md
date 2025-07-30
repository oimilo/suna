# 🎯 Guia de Teste do Sistema de Onboarding

Este guia explica como testar o novo sistema de onboarding sem precisar criar contas novas.

## 🚀 Como Testar

### 1. **Reset Rápido via URL**
Adicione `?reset=onboarding` na URL para resetar o onboarding:
```
http://localhost:3000/dashboard?reset=onboarding
```

### 2. **Usando os Dev Controls**
No canto inferior esquerdo da tela, você verá os **Onboarding Dev Controls** com:

- **Botão Reset**: Reseta todo o progresso do onboarding
- **Botão Skip All**: Marca tudo como completo
- **Status em tempo real**: Mostra o estado atual de cada etapa
- **Controles manuais**: Toggle individual para cada estado

### 3. **Fluxo de Onboarding**

1. **Mensagem de Boas-vindas** 🎉
   - Aparece automaticamente para novos usuários
   - Opções: "Fazer Tour Guiado" ou "Começar a Usar"

2. **Tour Interativo** 🎯
   - 5 steps mostrando as principais funcionalidades:
     - Seletor de projetos
     - Botão nova conversa
     - Seletor de modelos
     - Área de trabalho
     - Campo de mensagem

3. **Checklist de Progresso** ✅
   - Aparece no sidebar esquerdo
   - Mostra progresso em tempo real
   - 6 tarefas para completar

## 🛠️ Comandos Úteis

### Resetar Onboarding via Console
```javascript
// No console do navegador:
localStorage.removeItem('onboarding-storage');
location.reload();
```

### Forçar Estado Específico
```javascript
// Mostrar apenas o tour:
const store = JSON.parse(localStorage.getItem('onboarding-storage'));
store.state.hasSeenWelcome = true;
store.state.hasCompletedTour = false;
localStorage.setItem('onboarding-storage', JSON.stringify(store));
location.reload();
```

## 🎮 Dev Controls - Funcionalidades

- **Reset**: Volta tudo ao estado inicial
- **Skip All**: Marca tudo como completo e pula o onboarding
- **Toggle Welcome**: Liga/desliga o estado "viu boas-vindas"
- **Toggle Tour**: Liga/desliga o estado "completou tour"
- **Tour +1/-1**: Avança ou volta steps do tour manualmente
- **Dev Mode**: Mantém os controles visíveis em produção

## 📝 Estados do Onboarding

O sistema rastreia:
- `hasSeenWelcome`: Se viu a mensagem de boas-vindas
- `hasCompletedTour`: Se completou o tour guiado
- `hasCreatedFirstProject`: Se criou o primeiro projeto
- `hasRunFirstCommand`: Se executou o primeiro comando
- `tourStep`: Qual step do tour está atualmente
- `checklistSteps`: Array com o progresso de cada tarefa

## 🔧 Personalização

Para adicionar novos steps no tour, edite:
```
/frontend/src/components/onboarding/OnboardingTour.tsx
```

Para modificar a mensagem de boas-vindas:
```
/frontend/src/components/onboarding/WelcomeAnnouncement.tsx
```

## ⚠️ Notas Importantes

1. O onboarding só aparece uma vez por usuário (usa localStorage)
2. Em produção, os Dev Controls ficam ocultos (a menos que Dev Mode esteja ativo)
3. O progresso é salvo automaticamente
4. O tour pode ser pausado e retomado

## 🐛 Troubleshooting

**Tour não aparece?**
- Verifique se `hasSeenWelcome` está true
- Verifique se `hasCompletedTour` está false

**Mensagem de boas-vindas não aparece?**
- Verifique se `hasSeenWelcome` está false
- Tente resetar via URL ou Dev Controls

**Checklist não aparece?**
- Verifique se o onboarding está completo
- O checklist se esconde quando todas as tarefas são completadas