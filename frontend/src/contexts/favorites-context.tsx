'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (threadId: string) => void;
  isFavorite: (threadId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_KEY = 'thread-favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Carrega favoritos do localStorage ao montar
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFavorites(new Set(parsed));
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
      }
    }
  }, []);

  // Salva favoritos no localStorage quando mudam
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = useCallback((threadId: string) => {
    console.log('Context: Toggling favorite for:', threadId);
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(threadId)) {
        console.log('Context: Removing from favorites');
        newFavorites.delete(threadId);
      } else {
        console.log('Context: Adding to favorites');
        newFavorites.add(threadId);
      }
      console.log('Context: New favorites:', Array.from(newFavorites));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((threadId: string) => {
    return favorites.has(threadId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}