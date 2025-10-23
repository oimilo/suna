#!/usr/bin/env python3
"""
Suna Default Agent Management Script (Simplified)

This script provides administrative functions for managing Suna default agents across all users.

Usage:
    # 🚀 MAIN COMMANDS
    python manage_suna_agents.py install-all          # Install Suna for all users who don't have it
    python manage_suna_agents.py stats                # Show Suna agent statistics
    python manage_suna_agents.py install-user <id>    # Install Suna for specific user

Examples:
    python manage_suna_agents.py install-all
    python manage_suna_agents.py stats
    python manage_suna_agents.py install-user 123e4567-e89b-12d3-a456-426614174000

Note: Sync is no longer needed - Suna agents automatically use the current configuration from config.py
"""

import asyncio
import argparse
import sys
import json
import os
from pathlib import Path

# Load environment variables from backend/.env.local before importing backend modules
repo_root = Path(__file__).resolve().parents[4]
env_file = repo_root / "backend" / ".env.local"
if env_file.exists():
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip()
        # remove surrounding quotes if present
        if value and (value[0] == value[-1] == '"' or value[0] == value[-1] == "'"):
            value = value[1:-1]
        os.environ.setdefault(key, value)

# Ensure backend packages are importable
sys.path.append(str(repo_root))
sys.path.append(str(repo_root / "backend"))

from core.utils.suna_default_agent_service import SunaDefaultAgentService
from core.services.supabase import DBConnection
from core.utils.logger import logger


class SunaAgentManager:
    def __init__(self):
        self.service = SunaDefaultAgentService()
        self.db = self.service._db  # reuse underlying connection
    
    async def install_all_users(self):
        """Install Suna agent for all users who don't have it"""
        print("🚀 Installing Suna default agent for all users who don't have it...")
        
        result = await self.service.install_for_all_users()
        
        print(f"✅ Installation completed!")
        print(f"   📦 Installed: {result['installed_count']}")
        print(f"   ❌ Failed: {result['failed_count']}")
        
        if result['failed_count'] > 0:
            print("\n❌ Failed installations:")
            for detail in result['details']:
                if detail['status'] == 'failed':
                    print(f"   - User {detail['account_id']}: {detail.get('error', 'Unknown error')}")
        
        if result['installed_count'] > 0:
            print(f"\n✅ Successfully installed Suna for {result['installed_count']} users")
            
    async def update_config_info(self):
        """Show information about Suna configuration (no sync needed)"""
        print("ℹ️  Suna Configuration Information")
        print("=" * 50)
        print("🔧 Suna agents automatically use the current configuration from config.py")
        print("📝 No sync needed - changes are applied immediately when agents run")
        print("💡 To update Suna behavior, simply modify backend/agent/suna/config.py")
        print("\n✅ All Suna agents are always up-to-date with your latest configuration!")
    
    async def install_user(self, account_id):
        """Install Suna agent for specific user"""
        print(f"🚀 Installing Suna default agent for user {account_id}...")
        
        agent_id = await self.service.install_suna_agent_for_user(account_id)
        
        if agent_id:
            print(f"✅ Successfully installed Suna agent {agent_id} for user {account_id}")
        else:
            print(f"❌ Failed to install Suna agent for user {account_id}")
    
    async def replace_user_agent(self, account_id):
        """Replace Suna agent for specific user (in case of corruption)"""
        print(f"🔄 Replacing Suna agent for user {account_id}...")

        # Install/replace the agent with latest config
        agent_id = await self.service.install_suna_agent_for_user(account_id, replace_existing=True)

        if agent_id:
            print(f"✅ Successfully replaced Suna agent {agent_id} for user {account_id}")
        else:
            print(f"❌ Failed to replace Suna agent for user {account_id}")

    async def replace_all_users(self):
        """Replace the default Suna agent for every user that currently has one."""
        print("🔄 Replacing Suna default agent for all users...")

        client = await self.db.client
        result = await client.table('agents').select('account_id').eq('metadata->>is_suna_default', 'true').execute()
        account_ids = [row['account_id'] for row in result.data or []]

        if not account_ids:
            print("ℹ️  No users with the default Suna agent found.")
            return

        success = 0
        failures = []

        for account_id in account_ids:
            try:
                agent_id = await self.service.install_suna_agent_for_user(account_id, replace_existing=True)
                if agent_id:
                    success += 1
                else:
                    failures.append((account_id, "install_suna_agent_for_user returned None"))
            except Exception as exc:
                failures.append((account_id, str(exc)))

        print(f"✅ Replaced Suna agent for {success} users")
        if failures:
            print(f"❌ Failed to replace for {len(failures)} users:")
            for account_id, error in failures:
                print(f"   - {account_id}: {error}")
    
    async def show_stats(self):
        """Show Suna agent statistics"""
        print("📊 Suna Default Agent Statistics")
        print("=" * 50)
        
        stats = await self.service.get_suna_agent_stats()
        
        if 'error' in stats:
            print(f"❌ Error getting stats: {stats['error']}")
            return
        
        print(f"Total Agents: {stats.get('total_agents', 0)}")
        print(f"Active Agents: {stats.get('active_agents', 0)}")
        print(f"Inactive Agents: {stats.get('inactive_agents', 0)}")
        
        version_dist = stats.get('version_distribution', {})
        if version_dist:
            print(f"\nVersion Distribution:")
            for version, count in version_dist.items():
                print(f"  {version}: {count} agents")
        
        creation_dates = stats.get('creation_dates', {})
        if creation_dates:
            print(f"\nCreation Dates (Last 12 months):")
            for month, count in sorted(creation_dates.items(), reverse=True):
                print(f"  {month}: {count} agents")


async def main():
    parser = argparse.ArgumentParser(
        description="Manage Suna default agents across all users (Simplified)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Main commands
    # Temporarily disable multi-user commands due to network limitations
    # subparsers.add_parser('install-all', help='Install Suna agent for all users who don\'t have it')
    # subparsers.add_parser('replace-all', help='Replace Suna agent for all users that already have it')
    subparsers.add_parser('stats', help='Show Suna agent statistics')
    subparsers.add_parser('config-info', help='Show information about Suna configuration')
    
    # User-specific commands
    install_user_parser = subparsers.add_parser('install-user', help='Install Suna agent for specific user')
    install_user_parser.add_argument('account_id', help='Account ID to install Suna for')
    
    replace_user_parser = subparsers.add_parser('replace-user', help='Replace Suna agent for specific user (if corrupted)')
    replace_user_parser.add_argument('account_id', help='Account ID to replace Suna for')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    manager = SunaAgentManager()
    
    try:
        if args.command == 'stats':
            await manager.show_stats()
        elif args.command == 'config-info':
            await manager.update_config_info()
        elif args.command == 'install-user':
            await manager.install_user(args.account_id)
        elif args.command == 'replace-user':
            await manager.replace_user_agent(args.account_id)
        else:
            parser.print_help()
            
    except KeyboardInterrupt:
        print("\n⚠️  Operation cancelled by user")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        logger.error(f"Script error: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main()) 
