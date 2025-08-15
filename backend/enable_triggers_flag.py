#!/usr/bin/env python3
"""
Script para habilitar a feature flag de triggers
Execute com: python enable_triggers_flag.py
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flags.flags import FeatureFlagManager


async def main():
    manager = FeatureFlagManager()
    
    # Habilitar agent_triggers
    success = await manager.set_flag(
        key="agent_triggers",
        enabled=True,
        description="Habilita o sistema de triggers/automações para agentes"
    )
    
    if success:
        print("✅ Feature flag 'agent_triggers' habilitada com sucesso!")
        
        # Verificar se está realmente habilitada
        is_enabled = await manager.is_enabled("agent_triggers")
        print(f"   Status atual: {'Habilitada' if is_enabled else 'Desabilitada'}")
    else:
        print("❌ Erro ao habilitar feature flag 'agent_triggers'")
        print("   Verifique se o Redis está rodando")


if __name__ == "__main__":
    asyncio.run(main())