"""
SSL Certificate Verification Utility

Verifica se um site deployado no Cloudflare Pages está acessível via HTTPS
com certificado SSL válido. Útil para evitar erros ERR_SSL_VERSION_OR_CIPHER_MISMATCH
que ocorrem logo após um deploy quando o certificado ainda não foi provisionado.

Este módulo foi criado separadamente para minimizar conflitos com updates do upstream.
"""

import asyncio
import ssl
from typing import Optional

import aiohttp

from core.utils.logger import logger


# Configurações padrão
DEFAULT_MAX_ATTEMPTS = 6  # 6 tentativas
DEFAULT_DELAY_SECONDS = 5.0  # 5 segundos entre tentativas
DEFAULT_TIMEOUT_SECONDS = 10  # timeout por requisição


async def wait_for_ssl_ready(
    url: str,
    max_attempts: int = DEFAULT_MAX_ATTEMPTS,
    delay_seconds: float = DEFAULT_DELAY_SECONDS,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> bool:
    """
    Aguarda até que o certificado SSL de uma URL esteja provisionado e acessível.
    
    Faz polling HTTP/HTTPS tentando acessar a URL até que retorne uma resposta
    válida (sem erros de SSL) ou até atingir o número máximo de tentativas.
    
    Args:
        url: URL completa do site a verificar (ex: https://example.pages.dev)
        max_attempts: Número máximo de tentativas (default: 6)
        delay_seconds: Segundos entre cada tentativa (default: 5.0)
        timeout_seconds: Timeout por requisição em segundos (default: 10)
        
    Returns:
        True se o SSL está pronto e acessível, False se atingiu max_attempts
        
    Example:
        >>> ssl_ready = await wait_for_ssl_ready("https://my-site.pages.dev")
        >>> if ssl_ready:
        ...     print("Site pronto!")
    """
    logger.info(
        "Iniciando verificação de SSL",
        url=url,
        max_attempts=max_attempts,
        delay_seconds=delay_seconds
    )
    
    for attempt in range(1, max_attempts + 1):
        is_ready = await _check_ssl_once(url, timeout_seconds)
        
        if is_ready:
            logger.info(
                "SSL verificado com sucesso",
                url=url,
                attempt=attempt
            )
            return True
        
        if attempt < max_attempts:
            logger.debug(
                "SSL ainda não disponível, aguardando próxima tentativa",
                url=url,
                attempt=attempt,
                next_attempt_in=delay_seconds
            )
            await asyncio.sleep(delay_seconds)
    
    logger.warning(
        "SSL não verificado após todas as tentativas",
        url=url,
        total_attempts=max_attempts
    )
    return False


async def _check_ssl_once(url: str, timeout_seconds: int) -> bool:
    """
    Faz uma única tentativa de verificar se o SSL está acessível.
    
    Args:
        url: URL a verificar
        timeout_seconds: Timeout da requisição
        
    Returns:
        True se conseguiu acessar sem erros de SSL, False caso contrário
    """
    try:
        timeout = aiohttp.ClientTimeout(total=timeout_seconds)
        
        # Criar SSL context padrão (verifica certificados)
        ssl_context = ssl.create_default_context()
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.head(url, ssl=ssl_context, allow_redirects=True) as response:
                # Qualquer resposta HTTP válida indica que SSL está funcionando
                # (mesmo 404, 403, etc - o importante é não ter erro de SSL)
                if response.status < 500:
                    return True
                    
    except aiohttp.ClientSSLError as e:
        # Erro de SSL - certificado ainda não provisionado
        logger.debug(f"SSL error (esperado durante provisionamento): {e}")
        return False
        
    except ssl.SSLError as e:
        # Erro de SSL do módulo ssl
        logger.debug(f"SSL error (esperado durante provisionamento): {e}")
        return False
        
    except aiohttp.ClientConnectorError as e:
        # Erro de conexão - pode ser DNS ainda propagando
        logger.debug(f"Connection error: {e}")
        return False
        
    except asyncio.TimeoutError:
        # Timeout - site pode estar lento ou indisponível
        logger.debug("Timeout ao verificar SSL")
        return False
        
    except Exception as e:
        # Outros erros inesperados
        logger.warning(f"Erro inesperado ao verificar SSL: {e}")
        return False
    
    return False

