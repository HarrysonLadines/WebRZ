import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '@/context/AuthContext';

global.fetch = vi.fn();

const ComponenteDePrueba = () => {
  const { user, login, logout } = useAuth();

  return (
    <>
      <div>Usuario: {user ? user.email : 'Sin usuario'}</div>
      <button onClick={() => login({ id: '1', email: 'test@example.com' })}>Iniciar sesión</button>
      <button onClick={logout}>Cerrar sesión</button>
    </>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockReset();
    document.cookie = 'token=; Max-Age=0; path=/'; // Limpiar cookie antes de cada test
  });

  it('obtiene y establece el usuario al montar', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: '1', email: 'test@example.com' } }),
    });

    render(
      <AuthProvider>
        <ComponenteDePrueba />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Usuario: test@example.com/)).toBeDefined();
    });
  });

  it('establece el usuario como null si la obtención falla', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

    render(
      <AuthProvider>
        <ComponenteDePrueba />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Usuario: Sin usuario/)).toBeDefined();
    });
  });

  it('login establece el usuario', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

    render(
      <AuthProvider>
        <ComponenteDePrueba />
      </AuthProvider>
    );

    const botonLogin = screen.getByText('Iniciar sesión');

    // Usamos userEvent para que automáticamente haga el act()
    await userEvent.click(botonLogin);

    // Esperamos que el DOM se actualice con el nuevo usuario
    await waitFor(() => {
      expect(screen.getByText(/Usuario: test@example.com/)).toBeDefined();
    });
  });

  it('logout limpia el usuario y la cookie', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

    render(
      <AuthProvider>
        <ComponenteDePrueba />
      </AuthProvider>
    );

    const botonLogin = screen.getByText('Iniciar sesión');
    await userEvent.click(botonLogin);

    const botonLogout = screen.getByText('Cerrar sesión');
    await userEvent.click(botonLogout);

    await waitFor(() => {
      expect(screen.getByText(/Usuario: Sin usuario/)).toBeDefined();
      expect(document.cookie).not.toContain('token');
    });
  });

  it('useAuth fuera de AuthProvider lanza error', () => {
    const consolaError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ComponenteDePrueba />)).toThrow('useAuth debe ser usado dentro de un AuthProvider');

    consolaError.mockRestore();
  });
});
