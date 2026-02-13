import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import FormularioDocente from './FormularioDocente';
import Admin from './Admin';
import Login from './Login'; // Cambiamos 'Auth' por 'Login' que es tu archivo real

export default function App() {
  const [session, setSession] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) fetchRol(s.user.id);
      else setLoading(false);
    });

    // 2. Escuchar cambios de estado (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) fetchRol(s.user.id);
      else {
        setRol(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Función para buscar si el usuario es Admin o Docente
  const fetchRol = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', userId)
        .single();

      if (data) setRol(data.rol);
      else setRol('docente'); // Por defecto si no está en la tabla
    } catch (e) {
      setRol('docente');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Iniciando sistema...</div>;

  // Lógica de visualización
  if (!session) {
    return <Login />;
  }

  // Si el rol es admin, muestra el visor. Si no, el formulario de registro.
  return rol === 'admin' ? (
    <Admin user={session.user} />
  ) : (
    <FormularioDocente user={session.user} />
  );
}