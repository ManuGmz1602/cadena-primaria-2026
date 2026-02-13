import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { generarAcuse } from './lib/generadorPDF';

// Componente para visualizar y editar datos en modo administrador
const CampoEspejo = ({ label, value, onChange, disabled, type = "text" }) => (
  <div style={{ marginBottom: '12px' }}>
    <label style={{ display: 'block', fontWeight: 'bold', fontSize: '12px', color: '#444' }}>{label}</label>
    <input 
      type={type}
      value={value || ''} 
      onChange={e => onChange(e.target.value.toUpperCase())} 
      disabled={disabled}
      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: disabled ? '#f9f9f9' : '#fff' }}
    />
  </div>
);

export default function Admin() {
  const [registros, setRegistros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRegistros = async () => {
    const { data } = await supabase.from('registros_primaria').select('*').order('created_at', { ascending: false });
    setRegistros(data || []);
  };

  useEffect(() => { fetchRegistros(); }, []);

  const handleUpdate = (campo, valor) => setEditando({ ...editando, [campo]: valor });

  const finalizarRevision = async () => {
    if (!window.confirm("¿Confirma que todos los datos coinciden con el expediente físico? El registro se bloqueará.")) return;
    setLoading(true);

    try {
      // Lógica de Folios según Categoría [cite: 10]
      let prefijo = "DOC";
      if (editando.es_matrimonio) prefijo = "MAT";
      else if (editando.funcion === "DIRECTOR") prefijo = "DIR";
      else if (editando.funcion === "SUPERVISOR") prefijo = "SUP";
      else if (editando.funcion === "JEFE_SECTOR") prefijo = "JEF";
      else if (editando.funcion.includes("PAAE")) prefijo = "PAE";

      let folioFinal = "";
      // Validación de matrimonio compartido
      if (editando.es_matrimonio && editando.rfc_conyuge) {
        const { data: pareja } = await supabase.from('registros_primaria')
          .select('folio').eq('rfc', editando.rfc_conyuge).not('folio', 'is', null).maybeSingle();
        if (pareja) folioFinal = pareja.folio;
      }

      if (!folioFinal) {
        const { data: u } = await supabase.from('registros_primaria').select('folio')
          .ilike('folio', `${prefijo}-%`).order('folio', { ascending: false }).limit(1);
        let n = 1;
        if (u?.length > 0) n = parseInt(u[0].folio.split('-')[1]) + 1;
        folioFinal = `${prefijo}-${String(n).padStart(5, '0')}`;
      }

      const { error } = await supabase.from('registros_primaria').update({
        ...editando, folio: folioFinal, validado: true
      }).eq('id', editando.id);

      if (error) throw error;
      alert("Folio asignado: " + folioFinal);
      generarAcuse({ ...editando, folio: folioFinal });
      setEditando(null);
      fetchRegistros();
    } catch (e) { alert("Error: " + e.message); }
    finally { setLoading(false); }
  };

  const filtrados = registros.filter(r => r.rfc.includes(busqueda.toUpperCase()) || r.apellido_paterno.includes(busqueda.toUpperCase()));

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* BUSCADOR */}
<div style={{ 
  background: '#003366', 
  color: 'white', 
  padding: '20px', 
  borderRadius: '8px', 
  marginBottom: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
}}>
  <div>
    <h2 style={{ margin: 0, fontSize: '20px' }}>PANEL DE CONTROL ADMINISTRATIVO</h2>
    <input 
      type="text" 
      placeholder="BUSCAR RFC O APELLIDO..." 
      onChange={e => setBusqueda(e.target.value.toUpperCase())} 
      style={{ width: '350px', padding: '10px', marginTop: '10px', borderRadius: '4px', border: 'none' }} 
    />
  </div>
  
  <button 
    onClick={() => {
      if(window.confirm("¿Desea salir del sistema?")) {
        supabase.auth.signOut();
      }
    }} 
    style={{ 
      background: '#d9534f', 
      color: 'white', 
      border: 'none', 
      padding: '12px 20px', 
      borderRadius: '5px', 
      fontWeight: 'bold', 
      cursor: 'pointer',
      transition: '0.3s'
    }}
    onMouseOver={(e) => e.target.style.background = '#c9302c'}
    onMouseOut={(e) => e.target.style.background = '#d9534f'}
  >
    CERRAR SESIÓN
  </button>
</div>

      {!editando ? (
        <table style={{ width: '100%', background: 'white', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#eee', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>RFC</th>
              <th>NOMBRE</th>
              <th>FUNCIÓN</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{r.rfc}</td>
                <td>{`${r.apellido_paterno} ${r.nombres}`}</td>
                <td>{r.funcion}</td>
                <td>{r.validado ? <b style={{color:'green'}}>{r.folio}</b> : <span style={{color:'orange'}}>PENDIENTE</span>}</td>
                <td>
                  <button onClick={() => setEditando(r)} style={{ padding: '6px 12px', cursor: 'pointer', background: '#003366', color: 'white', border: 'none', borderRadius: '4px' }}>
                    {r.validado ? 'VER DATOS' : 'REVISAR Y COTEJAR'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ background: 'white', padding: '25px', borderRadius: '10px', border: '2px solid #003366' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', marginBottom: '20px' }}>
            <h3>EXPEDIENTE DIGITAL COMPLETO: {editando.rfc}</h3>
            <button onClick={() => setEditando(null)} style={{ height: '35px', marginTop: '15px' }}>CERRAR REVISIÓN</button>
          </div>

          {/* GRID DE DATOS 100% ESPEJO [cite: 5-83] */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div style={{ gridColumn: 'span 4', background: '#003366', color: 'white', padding: '5px 10px' }}>I. DATOS PERSONALES Y FILIACIÓN</div>
            <CampoEspejo label="Apellido Paterno" value={editando.apellido_paterno} onChange={v => handleUpdate('apellido_paterno', v)} disabled={editando.validado} />
            <CampoEspejo label="Apellido Materno" value={editando.apellido_materno} onChange={v => handleUpdate('apellido_materno', v)} disabled={editando.validado} />
            <CampoEspejo label="Nombre(s)" value={editando.nombres} onChange={v => handleUpdate('nombres', v)} disabled={editando.validado} />
            <CampoEspejo label="RFC" value={editando.rfc} onChange={v => handleUpdate('rfc', v)} disabled={editando.validado} />
            <CampoEspejo label="CURP" value={editando.curp} onChange={v => handleUpdate('curp', v)} disabled={editando.validado} />
            <CampoEspejo label="Clave Presupuestal" value={editando.clave_presupuestal} onChange={v => handleUpdate('clave_presupuestal', v)} disabled={editando.validado} />
            <CampoEspejo label="Función Seleccionada" value={editando.funcion} disabled={true} />
            <CampoEspejo label="Grado Máximo Estudios" value={editando.grado_estudios} onChange={v => handleUpdate('grado_estudios', v)} disabled={editando.validado} />

            <div style={{ gridColumn: 'span 4', background: '#003366', color: 'white', padding: '5px 10px' }}>II. DATOS DE ADSCRIPCIÓN (CENTRO DE TRABAJO)</div>
            {editando.escuela_trabaja && <CampoEspejo label="Escuela donde trabaja" value={editando.escuela_trabaja} onChange={v => handleUpdate('escuela_trabaja', v)} disabled={editando.validado} />}
            <CampoEspejo label="Clave C.T." value={editando.cct} onChange={v => handleUpdate('cct', v)} disabled={editando.validado} />
            <CampoEspejo label="Zona Escolar" value={editando.zona_escolar} onChange={v => handleUpdate('zona_escolar', v)} disabled={editando.validado} />
            <CampoEspejo label="Sector" value={editando.sector} onChange={v => handleUpdate('sector', v)} disabled={editando.validado} />
            <CampoEspejo label="Localidad" value={editando.localidad} onChange={v => handleUpdate('localidad', v)} disabled={editando.validado} />
            <CampoEspejo label="Municipio" value={editando.municipio} onChange={v => handleUpdate('municipio', v)} disabled={editando.validado} />
            <CampoEspejo label="Cabecera" value={editando.cabecera} onChange={v => handleUpdate('cabecera', v)} disabled={editando.validado} />
            <CampoEspejo label="Sede" value={editando.sede} onChange={v => handleUpdate('sede', v)} disabled={editando.validado} />

            <div style={{ gridColumn: 'span 4', background: '#003366', color: 'white', padding: '5px 10px' }}>III. ANTIGÜEDAD Y CONTACTO</div>
            <CampoEspejo label="Ingreso SEP (AAAA-MM-DD)" value={editando.fecha_sep} onChange={v => handleUpdate('fecha_sep', v)} disabled={editando.validado} type="date" />
            <CampoEspejo label="Ingreso Zona (AAAA-MM-DD)" value={editando.fecha_zona} onChange={v => handleUpdate('fecha_zona', v)} disabled={editando.validado} type="date" />
            <CampoEspejo label="Ingreso C.T. (AAAA-MM-DD)" value={editando.fecha_ct} onChange={v => handleUpdate('fecha_ct', v)} disabled={editando.validado} type="date" />
            <CampoEspejo label="Teléfono (10 dígitos)" value={editando.telefono} onChange={v => handleUpdate('telefono', v)} disabled={editando.validado} />
            <CampoEspejo label="Correo Electrónico" value={editando.correo_electronico} onChange={v => handleUpdate('correo_electronico', v)} disabled={editando.validado} />
            
            <div style={{ gridColumn: 'span 4', background: '#003366', color: 'white', padding: '5px 10px' }}>IV. DOMICILIO PARTICULAR</div>
            <CampoEspejo label="Calle y Número" value={editando.calle_numero} onChange={v => handleUpdate('calle_numero', v)} disabled={editando.validado} />
            <CampoEspejo label="Colonia" value={editando.colonia} onChange={v => handleUpdate('colonia', v)} disabled={editando.validado} />
            <CampoEspejo label="Población" value={editando.poblacion} onChange={v => handleUpdate('poblacion', v)} disabled={editando.validado} />
            <CampoEspejo label="Municipio Particular" value={editando.domicilio_municipio} onChange={v => handleUpdate('domicilio_municipio', v)} disabled={editando.validado} />
          </div>

          {editando.es_matrimonio && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '5px' }}>
              <b>SOLICITUD POR MATRIMONIO ACTIVA:</b> RFC del Cónyuge: {editando.rfc_conyuge}
            </div>
          )}

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            {!editando.validado ? (
              <button onClick={finalizarRevision} disabled={loading} style={{ background: '#28a745', color: 'white', padding: '15px 60px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                {loading ? 'PROCESANDO...' : 'VALIDAR TODO Y GENERAR FOLIO FINAL'}
              </button>
            ) : (
              <div style={{ padding: '15px', background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '5px' }}>
                <h3>VALIDACIÓN CONCLUIDA - FOLIO ASIGNADO: {editando.folio}</h3>
                <button onClick={() => generarAcuse(editando)} style={{ background: '#003366', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>REIMPRIMIR ACUSE OFICIAL</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}