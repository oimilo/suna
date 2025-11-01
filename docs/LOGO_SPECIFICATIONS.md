# Especificações dos Logos - Prophet

## Arquivos de Logo Necessários

### 1. **Logo Principal (Horizontal)**
- **Arquivos**: 
  - `prophet-logo.svg` - Logo colorido/preto para fundo claro
  - `prophet-logo-white.svg` - Logo branco para fundo escuro
- **Dimensões recomendadas**: 
  - Largura: 120-140px
  - Altura: 22-30px
  - Proporção sugerida: 4:1 até 5:1 (mais equilibrado)
- **Uso**: Header da landing page, navegação principal
- **Cores**: 
  - Versão clara: Preto (#000000) ou sua cor de marca
  - Versão escura: Branco (#FFFFFF)
- **Nota**: O código usa width="140" height="22" no desktop e width="120" height="22" no mobile

### 2. **Símbolo/Ícone**
- **Arquivo**: `prophet-symbol.svg`
- **Dimensões**: 124x104px (proporção ~1.2:1, quase quadrado)
- **Uso**: Ícone do app, avatar de agentes, lugares compactos
- **Cores**: Preto ou sua cor de marca (será invertido automaticamente em tema escuro)

### 3. **Favicon**
- **Arquivo**: `favicon.png`
- **Dimensões**: 32x32px
- **Formato**: PNG com transparência
- **Uso**: Ícone do navegador

### 4. **Thumbnails para Compartilhamento**
- **Arquivos**:
  - `thumbnail-light.png` - Para preview em fundo claro
  - `thumbnail-dark.png` - Para preview em fundo escuro
- **Dimensões recomendadas**: 1200x630px (Open Graph)
- **Uso**: Preview quando compartilhado em redes sociais

## Como Substituir os Logos

### Método 1: Substituição Direta
1. Renomeie os arquivos atuais com prefixo `kortix-` para backup
2. Adicione seus novos logos com os nomes corretos na pasta `/frontend/public/`

### Método 2: Via Variáveis de Ambiente
Adicione no arquivo `/frontend/.env.local`:
```env
NEXT_PUBLIC_LOGO_LIGHT=/prophet-logo.svg
NEXT_PUBLIC_LOGO_DARK=/prophet-logo-white.svg
NEXT_PUBLIC_FAVICON=/prophet-symbol.svg
```

## Atualização das Referências

Todas as referências à identidade anterior devem ser substituídas pela nova marca nas variáveis de ambiente:

```env
NEXT_PUBLIC_APP_NAME=Prophet
NEXT_PUBLIC_COMPANY_NAME=Milo
NEXT_PUBLIC_TEAM_NAME=Milo Team
NEXT_PUBLIC_COMPANY_URL=https://oimilo.com
```

## Observações Técnicas

- Os SVGs devem ter `fill="black"` para permitir inversão de cor automática em tema escuro
- O componente `MiloLogo` aplica classe `invert` automaticamente em tema escuro
- Mantenha as proporções originais para evitar distorções
- Use SVG sempre que possível para melhor qualidade em diferentes resoluções