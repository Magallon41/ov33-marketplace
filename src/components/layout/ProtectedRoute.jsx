import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — Bloquea el renderizado de rutas restringidas.
 * 
 * Uso:
 *   <ProtectedRoute role="admin">
 *     <AdminDashboard />
 *   </ProtectedRoute>
 * 
 * Si el usuario no está autenticado → redirige a /auth
 * Si está autenticado pero no tiene el rol → redirige a /
 * Si está cargando → muestra nada (evita flash de contenido)
 */
export function ProtectedRoute({ children, role }) {
  const { currentUser, loading } = useAuth();

  // Mientras Firebase verifica la sesión, no renderizar nada para evitar
  // que el componente se monte brevemente antes de que el estado esté listo
  if (loading) {
    return null;
  }

  // No autenticado → al login
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // Autenticado pero sin el rol requerido → al home
  if (role && currentUser.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
