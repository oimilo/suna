# Modelos Disponíveis no Prophet/Prophet

## 🆓 Modelos FREE (Plano Gratuito)

1. **Kimi K2** (PADRÃO PARA FREE)
   - ID: `moonshotai/kimi-k2`
   - Backend: `openrouter/moonshotai/kimi-k2`
   - Modelo selecionado por padrão para novos usuários
   - Prioridade: 99

2. **DeepSeek V3** ⭐ (RECOMENDADO)
   - ID: `deepseek/deepseek-chat`
   - Backend: `openrouter/deepseek/deepseek-chat`
   - Excelente para programação, custo baixo
   - Prioridade: 98

## 💎 Modelos PREMIUM (Plano Pro/Pro Max)

1. **Claude Sonnet 4** ⭐ (MAIS AVANÇADO)
   - ID: `claude-sonnet-4`
   - Backend: `anthropic/claude-sonnet-4-20250514`
   - Modelo mais recente da Anthropic (Claude 4)
   - Prioridade: 100 (aparece primeiro)

2. **Grok 4**
   - ID: `grok-4`
   - Backend: `xai/grok-4`
   - Prioridade: 98

3. **Claude 3.7 Sonnet**
   - ID: `sonnet-3.7`
   - Backend: `anthropic/claude-3-7-sonnet-latest`
   - Prioridade: 97

4. **Google Gemini 2.5 Pro**
   - ID: `google/gemini-2.5-pro`
   - Backend: `google/gemini-2.5-pro`
   - Prioridade: 96

5. **GPT-4.1**
   - ID: `gpt-4.1`
   - Backend: `openai/gpt-4.1`
   - Prioridade: 96

6. **Claude 3.5 Sonnet**
   - ID: `sonnet-3.5`
   - Backend: `anthropic/claude-3-5-sonnet-latest`
   - Prioridade: 90

7. **GPT-4o**
   - ID: `gpt-4o`
   - Backend: `openai/gpt-4o`
   - Prioridade: 88

8. **Gemini 2.5 Flash Thinking**
   - ID: `gemini-2.5-flash:thinking`
   - Backend: `google/gemini-2.5-flash:thinking`
   - Prioridade: 84

## 📝 Notas Importantes

- **Modelo Padrão Free**: Kimi K2 (automaticamente selecionado para novos usuários)
- **Modelo Padrão Premium**: Claude Sonnet 4 (modelo mais avançado)
- **Claude Sonnet 4**: É o Claude 4 real, não um alias do 3.5
- **Total de modelos**: 2 Free + 8 Premium = 10 modelos
- Usuários podem trocar livremente entre modelos disponíveis em seu plano
- A seleção é salva no localStorage do navegador

## 🔧 Configuração

- Frontend: `/frontend/src/components/thread/chat-input/_use-model-selection.ts`
- Backend: `/backend/utils/constants.py`