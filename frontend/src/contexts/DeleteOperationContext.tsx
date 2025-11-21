'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

type DeleteState = {
  isDeleting: boolean;
  targetId: string | null;
  isActive: boolean;
  operation: 'none' | 'pending' | 'success' | 'error';
};

type DeleteAction =
  | { type: 'START_DELETE'; id: string; isActive: boolean }
  | { type: 'DELETE_SUCCESS' }
  | { type: 'DELETE_ERROR' }
  | { type: 'RESET' };

const initialState: DeleteState = {
  isDeleting: false,
  targetId: null,
  isActive: false,
  operation: 'none',
};

function deleteReducer(state: DeleteState, action: DeleteAction): DeleteState {
  switch (action.type) {
    case 'START_DELETE':
      return {
        ...state,
        isDeleting: true,
        targetId: action.id,
        isActive: action.isActive,
        operation: 'pending',
      };
    case 'DELETE_SUCCESS':
      return {
        ...state,
        operation: 'success',
      };
    case 'DELETE_ERROR':
      return {
        ...state,
        isDeleting: false,
        operation: 'error',
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

type DeleteOperationContextType = {
  state: DeleteState;
  dispatch: React.Dispatch<DeleteAction>;
  performDelete: (
    id: string,
    isActive: boolean,
    deleteFunction: () => Promise<void>,
    onComplete?: () => void,
  ) => Promise<void>;
  isOperationInProgress: React.MutableRefObject<boolean>;
};

const DeleteOperationContext = createContext<
  DeleteOperationContextType | undefined
>(undefined);

export function DeleteOperationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(deleteReducer, initialState);
  const isOperationInProgress = useRef(false);

  useEffect(() => {
    if (state.operation === 'success' && state.isActive) {
      const timer = setTimeout(() => {
        try {
          window.location.pathname = '/dashboard';
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.operation, state.isActive]);

  useEffect(() => {
    if (state.operation === 'success' && !state.isActive) {
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET' });
        document.body.style.pointerEvents = 'auto';
        isOperationInProgress.current = false;

        const sidebarMenu = document.querySelector('.sidebar-menu');
        if (sidebarMenu) {
          sidebarMenu.classList.remove('pointer-events-none');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (state.operation === 'error') {
      document.body.style.pointerEvents = 'auto';
      isOperationInProgress.current = false;

      const sidebarMenu = document.querySelector('.sidebar-menu');
      if (sidebarMenu) {
        sidebarMenu.classList.remove('pointer-events-none');
      }
    }
  }, [state.operation, state.isActive]);

  const performDelete = async (
    id: string,
    isActive: boolean,
    deleteFunction: () => Promise<void>,
    onComplete?: () => void,
  ) => {
    if (isOperationInProgress.current) return;
    isOperationInProgress.current = true;

    document.body.style.pointerEvents = 'none';

    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (sidebarMenu) {
      sidebarMenu.classList.add('pointer-events-none');
    }

    dispatch({ type: 'START_DELETE', id, isActive });

    try {
      await deleteFunction();

      setTimeout(() => {
        dispatch({ type: 'DELETE_SUCCESS' });

        if (!isActive) {
          setTimeout(() => {
            document.body.style.pointerEvents = 'auto';

            if (sidebarMenu) {
              sidebarMenu.classList.remove('pointer-events-none');
            }

            if (onComplete) onComplete();
          }, 100);
        }
      }, 50);
    } catch (error) {
      console.error('Delete operation failed:', error);

      document.body.style.pointerEvents = 'auto';
      isOperationInProgress.current = false;

      if (sidebarMenu) {
        sidebarMenu.classList.remove('pointer-events-none');
      }

      dispatch({ type: 'DELETE_ERROR' });

      if (onComplete) onComplete();
    }
  };

  return (
    <DeleteOperationContext.Provider
      value={{
        state,
        dispatch,
        performDelete,
        isOperationInProgress,
      }}
    >
      {children}
    </DeleteOperationContext.Provider>
  );
}

export function useDeleteOperation() {
  const context = useContext(DeleteOperationContext);
  if (context === undefined) {
    throw new Error(
      'useDeleteOperation must be used within a DeleteOperationProvider',
    );
  }
  return context;
}


