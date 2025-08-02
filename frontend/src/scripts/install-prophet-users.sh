#!/bin/bash

# Script para instalar o agente Prophet para usuários específicos

echo "🚀 Instalando agente Prophet para usuários..."

# IDs dos usuários que precisam do agente Prophet
USERS=(
    "SEU_ACCOUNT_ID_AQUI"
    "anasoaresthome@gmail.com_ACCOUNT_ID"
)

# Navegar para o diretório do backend
cd /Users/lucasthome/Desktop/prophet-suna/suna/backend

# Instalar para cada usuário
for USER_ID in "${USERS[@]}"; do
    echo "📦 Instalando para usuário: $USER_ID"
    python -m utils.scripts.manage_suna_agents install-user "$USER_ID"
done

echo "✅ Instalação concluída!"