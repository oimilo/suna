// Sistema de debug logger que salva logs em localStorage
export class DebugLogger {
  private static instance: DebugLogger;
  private logs: Array<{ timestamp: string; type: string; message: string; data?: any }> = [];
  private readonly MAX_LOGS = 500;
  private readonly STORAGE_KEY = 'debug_file_detection_logs';

  private constructor() {
    // Carrega logs existentes do localStorage
    this.loadLogs();
  }

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao carregar logs do localStorage:', e);
    }
  }

  private saveLogs() {
    try {
      // Mantém apenas os últimos MAX_LOGS registros
      if (this.logs.length > this.MAX_LOGS) {
        this.logs = this.logs.slice(-this.MAX_LOGS);
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Erro ao salvar logs no localStorage:', e);
    }
  }

  log(type: string, message: string, data?: any) {
    // Lista de tipos que queremos salvar
    const debugTypes = [
      'DEBUG-USEEFFECT',
      'DEBUG-DETECT', 
      'DEBUG-DELIVERY',
      'DEBUG-EXTRACT',
      'DEBUG-MAIN-FILE',
      'DEBUG-PANEL'
    ];
    
    // Só salva se for um tipo de debug que nos interessa
    if (debugTypes.includes(type)) {
      const timestamp = new Date().toISOString();
      const logEntry = { timestamp, type, message, data };
      
      // Adiciona ao array
      this.logs.push(logEntry);
      
      // Salva no localStorage
      this.saveLogs();
    }
    
    // Sempre loga no console (para não perder outros logs importantes)
    const color = this.getColorForType(type);
    console.log(
      `%c[${type}]%c ${message}`,
      `color: ${color}; font-weight: bold`,
      'color: inherit',
      data || ''
    );
  }

  private getColorForType(type: string): string {
    const colors: Record<string, string> = {
      'DEBUG-USEEFFECT': '#9333ea',
      'DEBUG-DETECT': '#3b82f6',
      'DEBUG-DELIVERY': '#10b981',
      'DEBUG-EXTRACT': '#f59e0b',
      'MAIN-FILE': '#ef4444',
      'PANEL': '#6366f1',
    };
    return colors[type] || '#6b7280';
  }

  clear() {
    this.logs = [];
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('Logs limpos com sucesso');
  }

  getLogs() {
    return this.logs;
  }

  exportLogs(): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    };
    return JSON.stringify(exportData, null, 2);
  }

  downloadLogs() {
    const data = this.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Logs baixados com sucesso!');
  }

  printSummary() {
    console.log('=== RESUMO DOS LOGS ===');
    console.log('Total de logs:', this.logs.length);
    
    // Agrupa por tipo
    const byType = this.logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Logs por tipo:', byType);
    
    // Últimos 10 logs
    console.log('\nÚltimos 10 logs:');
    this.logs.slice(-10).forEach(log => {
      console.log(`${log.timestamp} [${log.type}] ${log.message}`);
    });
  }
}

// Exporta uma instância global para facilitar o uso
export const debugLogger = DebugLogger.getInstance();

// Adiciona comandos globais no window para debug
if (typeof window !== 'undefined') {
  (window as any).debugLogger = {
    clear: () => debugLogger.clear(),
    export: () => debugLogger.exportLogs(),
    download: () => debugLogger.downloadLogs(),
    summary: () => debugLogger.printSummary(),
    logs: () => debugLogger.getLogs(),
    help: () => {
      console.log(`
=== DEBUG LOGGER - COMANDOS DISPONÍVEIS ===

debugLogger.clear()     - Limpa todos os logs
debugLogger.export()    - Retorna logs como JSON string
debugLogger.download()  - Baixa logs como arquivo JSON
debugLogger.summary()   - Mostra resumo dos logs
debugLogger.logs()      - Retorna array com todos os logs
debugLogger.help()      - Mostra esta ajuda

Os logs são salvos automaticamente no localStorage.
Máximo de ${debugLogger['MAX_LOGS'] || 500} logs são mantidos.
      `);
    }
  };
  
  console.log('🔍 Debug Logger carregado! Digite debugLogger.help() para ver comandos disponíveis.');
}