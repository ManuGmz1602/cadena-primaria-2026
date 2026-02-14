import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import { generarAcuse } from './lib/generadorPDF';

// Componente para etiquetas arriba del recuadro
const CampoNivel = ({ label, children }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333', fontSize: '13px' }}>{label}</label>
    {children}
  </div>
);

export default function FormularioDocente({ user }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: user.id,
    funcion: '', 
    apellido_paterno: '', apellido_materno: '', nombres: '',
    rfc: '', curp: '', clave_presupuestal: '', 
    escuela_trabaja: '', cct: '', zona_escolar: '1', sector: '1',
    localidad: '', municipio: '', cabecera: '', sede: '',
    grado_estudios: 'LICENCIATURA',
    fecha_sep: '', fecha_zona: '', fecha_ct: '', antiguedad_funcion_fecha: '',
    calle_numero: '', colonia: '', poblacion: '', domicilio_municipio: '', telefono: '',
    correo_electronico: user.email,
    es_matrimonio: false, rfc_conyuge: ''
  });

  const handleChange = (f, v) => setFormData(p => ({ ...p, [f]: v.toUpperCase ? v.toUpperCase() : v }));

  // Calculadora de puntos: 1 por año en SEP (Solo Directivos/Supervisores/Jefes) [cite: 18, 19, 84]
  const calcularPuntos = () => {
    if (!['JEFE_SECTOR', 'SUPERVISOR', 'DIRECTOR'].includes(formData.funcion) || !formData.fecha_sep) return 0;
    const ingreso = new Date(formData.fecha_sep);
    const hoy = new Date();
    let puntos = hoy.getFullYear() - ingreso.getFullYear();
    return puntos > 0 ? puntos : 0;
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de CCT: 2 números, 3 letras, 4 números, 1 letra [cite: 11, 39, 66]
    const cctRegex = /^\d{2}[A-Z]{3}\d{4}[A-Z]{1}$/;
    if (!cctRegex.test(formData.cct)) {
      return alert("ERROR: El formato de la Clave C.T. es incorrecto (Ejemplo: 07DPR0001X)");
    }

    // Validación de Teléfono: 10 dígitos [cite: 29, 55, 82]
    if (formData.telefono.length !== 10) {
      return alert("ERROR: El teléfono debe tener exactamente 10 dígitos.");
    }

    setLoading(true);

    const datosEnvio = { ...formData };
    
    // Limpieza de fechas para evitar error 400 en Supabase
    ['fecha_sep', 'fecha_zona', 'fecha_ct', 'antiguedad_funcion_fecha'].forEach(f => {
      if (!datosEnvio[f]) datosEnvio[f] = null;
    });

    const { error } = await supabase.from('registros_primaria').upsert([datosEnvio]);

    if (error) {
      if (error.message.includes('unique_rfc')) {
        alert("ERROR: Este RFC ya tiene un registro en el sistema.");
      } else {
        alert("ERROR AL GUARDAR: " + error.message);
      }
    } else {
      alert("¡REGISTRO GUARDADO CON ÉXITO!");
      generarAcuse(formData); 
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '25px', maxWidth: '1100px', margin: '20px auto', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Arial' }}>
      <header style={{ background: '#003366', color: 'white', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>SISTEMA DE REGISTRO - PRIMARIA 2026</h2>
        <button onClick={() => supabase.auth.signOut()} style={{ background: '#d9534f', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>SALIR</button>
      </header>

      <form onSubmit={handleSubmit}>
        {/* SELECCIÓN DE CATEGORÍA ACTUALIZADA [cite: 10, 57, 58] */}
        <CampoNivel label="CATEGORÍA / FUNCIÓN (SELECCIONE PARA DESPLEGAR CAMPOS)">
          <select value={formData.funcion} onChange={e => handleChange('funcion', e.target.value)} required style={{ width: '100%', padding: '12px', border: '2px solid #003366', borderRadius: '5px', fontWeight: 'bold' }}>
            <option value="">-- SELECCIONE UNA OPCIÓN --</option>
            <option value="JEFE_SECTOR">JEFE DE SECTOR</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="DIRECTOR">DIRECTOR TÉCNICO</option>
            <option value="DOCENTE">DOCENTE</option>
            <option value="PAAE_ASISTENTE">PAAE ASISTENTE DE SERVICIO</option>
            <option value="PAAE_SECRETARIO">PAAE SECRETARIO(A)</option>
          </select>
        </CampoNivel>

        {formData.funcion && (
          <>
            {/* I. DATOS PERSONALES [cite: 5-9] */}
            <h3 style={{ borderBottom: '2px solid #003366', color: '#003366', marginTop: '25px' }}>I. DATOS PERSONALES</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              <CampoNivel label="Apellido Paterno"><input type="text" value={formData.apellido_paterno} onChange={e => handleChange('apellido_paterno', e.target.value)} required style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="Apellido Materno"><input type="text" value={formData.apellido_materno} onChange={e => handleChange('apellido_materno', e.target.value)} required style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="Nombre(s)"><input type="text" value={formData.nombres} onChange={e => handleChange('nombres', e.target.value)} required style={{width: '100%', padding: '8px'}}/></CampoNivel>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              <CampoNivel label="RFC"><input type="text" value={formData.rfc} onChange={e => handleChange('rfc', e.target.value)} required maxLength={13} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="CURP"><input type="text" value={formData.curp} onChange={e => handleChange('curp', e.target.value)} required maxLength={18} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="Clave Presupuestal"><input type="text" value={formData.clave_presupuestal} onChange={e => handleChange('clave_presupuestal', e.target.value)} required style={{width: '100%', padding: '8px'}}/></CampoNivel>
            </div>

            {/* II. DATOS DE ADSCRIPCIÓN [cite: 11-17] */}
            <h3 style={{ borderBottom: '2px solid #003366', color: '#003366', marginTop: '25px' }}>II. DATOS DE ADSCRIPCIÓN</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
              {['DOCENTE', 'PAAE_ASISTENTE', 'PAAE_SECRETARIO', 'DIRECTOR'].includes(formData.funcion) && (
                <CampoNivel label="Escuela donde trabaja"><input type="text" value={formData.escuela_trabaja} onChange={e => handleChange('escuela_trabaja', e.target.value)} required style={{width: '100%', padding: '8px'}}/></CampoNivel>
              )}
              <CampoNivel label="Clave de C.T. (Ej: 07DPR1234A)"><input type="text" value={formData.cct} onChange={e => handleChange('cct', e.target.value)} required style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="No. de Zona">
                <select value={formData.zona_escolar} onChange={e => handleChange('zona_escolar', e.target.value)} style={{width: '100%', padding: '8px'}}>
                  {Array.from({length: 175}, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
              </CampoNivel>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <CampoNivel label="Sector">
                <select value={formData.sector} onChange={e => handleChange('sector', e.target.value)} style={{width: '100%', padding: '8px'}}>
                  {Array.from({length: 30}, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
              </CampoNivel>
              <CampoNivel label="Localidad"><input type="text" value={formData.localidad} onChange={e => handleChange('localidad', e.target.value)} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="Municipio"><input type="text" value={formData.municipio} onChange={e => handleChange('municipio', e.target.value)} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label={['JEFE_SECTOR', 'SUPERVISOR', 'DIRECTOR'].includes(formData.funcion) ? "Cabecera" : "Sede/Cabecera de Zona"}><input type="text" value={formData.sede} onChange={e => handleChange('sede', e.target.value)} style={{width: '100%', padding: '8px'}}/></CampoNivel>
            </div>

            {/* III. ANTIGÜEDAD [cite: 18-22] */}
            <h3 style={{ borderBottom: '2px solid #003366', color: '#003366', marginTop: '25px' }}>III. ANTIGÜEDAD</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <CampoNivel label="Ingreso SEP (A-M-D)"><input type="date" value={formData.fecha_sep} onChange={e => handleChange('fecha_sep', e.target.value)} required style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="Ingreso Zona"><input type="date" value={formData.fecha_zona} onChange={e => handleChange('fecha_zona', e.target.value)} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="Ingreso C.T."><input type="date" value={formData.fecha_ct} onChange={e => handleChange('fecha_ct', e.target.value)} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              {['JEFE_SECTOR', 'SUPERVISOR', 'DIRECTOR'].includes(formData.funcion) && (
                <CampoNivel label="Antigüedad en Función"><input type="date" value={formData.antiguedad_funcion_fecha} onChange={e => handleChange('antiguedad_funcion_fecha', e.target.value)} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              )}
            </div>

            {/* IV. DOMICILIO Y CONTACTO [cite: 24-30] */}
            <h3 style={{ borderBottom: '2px solid #003366', color: '#003366', marginTop: '25px' }}>IV. DOMICILIO Y CONTACTO</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
              <CampoNivel label="Calle y Número"><input type="text" value={formData.calle_numero} onChange={e => handleChange('calle_numero', e.target.value)} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="Colonia"><input type="text" value={formData.colonia} onChange={e => handleChange('colonia', e.target.value)} style={{width: '100%', padding: '8px'}}/></CampoNivel>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <CampoNivel label="Población"><input type="text" value={formData.poblacion} onChange={e => handleChange('poblacion', e.target.value)} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="Municipio (Particular)"><input type="text" value={formData.domicilio_municipio} onChange={e => handleChange('domicilio_municipio', e.target.value)} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              <CampoNivel label="Teléfono (10 dígitos)"><input type="tel" value={formData.telefono} onChange={e => handleChange('telefono', e.target.value)} maxLength={10} style={{width: '100%', padding: '8px'}}/></CampoNivel>
              {/* CAMPO DE NIVEL EDUCATIVO / GRADO DE ESTUDIOS ACTUALIZADO  */}
              <CampoNivel label="Nivel / Grado Estudios">
                <select value={formData.grado_estudios} onChange={e => handleChange('grado_estudios', e.target.value)} style={{width: '100%', padding: '8px'}}>
                  <option value="PRIMARIA">PRIMARIA</option>
                  <option value="SECUNDARIA">SECUNDARIA</option>
                  <option value="PREPARATORIA">PREPARATORIA</option>
                  <option value="LICENCIATURA">LICENCIATURA</option>
                  <option value="MAESTRIA">MAESTRÍA</option>
                  <option value="DOCTORADO">DOCTORADO</option>
                </select>
              </CampoNivel>
            </div>

            {/* OPCIÓN MATRIMONIO */}
            <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #003366' }}>
              <label style={{ cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" checked={formData.es_matrimonio} onChange={e => handleChange('es_matrimonio', e.target.checked)} style={{ marginRight: '10px' }} />
                ¿SOLICITA CAMBIO POR MATRIMONIO?
              </label>
              {formData.es_matrimonio && (
                <div style={{ marginTop: '10px' }}>
                  <CampoNivel label="RFC DEL CÓNYUGE">
                    <input type="text" value={formData.rfc_conyuge} onChange={e => handleChange('rfc_conyuge', e.target.value)} maxLength={13} style={{ width: '250px', padding: '8px', border: '1px solid #d9534f' }} />
                  </CampoNivel>
                </div>
              )}
            </div>

            {/* PUNTOS PARA DIRECTIVOS [cite: 84] */}
            {['JEFE_SECTOR', 'SUPERVISOR', 'DIRECTOR'].includes(formData.funcion) && (
              <div style={{ padding: '15px', background: '#003366', color: 'white', borderRadius: '5px', marginTop: '20px', textAlign: 'center' }}>
                <strong style={{ fontSize: '16px' }}>PUNTOS POR ANTIGÜEDAD CALCULADOS (1 POR AÑO): {calcularPuntos()}</strong>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || formData.validado} 
              style={{ 
                width: '100%', 
                padding: '15px', 
                background: formData.validado ? '#666' : '#003366', 
                color: 'white', 
                fontWeight: 'bold',
                marginTop: '20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {formData.validado 
                ? `REGISTRO VALIDADO Y BLOQUEADO (FOLIO: ${formData.folio})` 
                : (loading ? 'PROCESANDO...' : 'FINALIZAR REGISTRO')}
            </button>
          </>
        )}
      </form>
    </div>
  );
}