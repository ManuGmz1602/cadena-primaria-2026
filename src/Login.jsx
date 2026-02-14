import React, { useState } from 'react';
import { supabase } from './lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Insertamos el perfil inicial para que el sistema deje de "Sincronizar"
        await supabase.from('perfiles').insert([{ id: data.user.id, rol: 'docente' }]);
        alert("¡Cuenta creada! Ya puedes iniciar sesión.");
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5', fontFamily: 'Arial' }}>
      <form onSubmit={handleAuth} style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '320px' }}>
        <h2 style={{ textAlign: 'center', color: '#003366' }}>{isRegistering ? 'Regístrate' : 'Registro Cadena de Cambio 2026 Primaria'}</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '20px' }} required />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#003366', color: 'white', border: 'none', cursor: 'pointer' }}>
          {loading ? 'CARGANDO...' : (isRegistering ? 'CREAR CUENTA' : 'ENTRAR')}
        </button>
        <p onClick={() => setIsRegistering(!isRegistering)} style={{ textAlign: 'center', marginTop: '15px', color: '#003366', cursor: 'pointer', fontSize: '14px' }}>
          {isRegistering ? '¿Ya tienes cuenta? Entra aquí' : '¿No tienes cuenta? Regístrate aquí'}
        </p>
      </form>
    </div>
  );
}