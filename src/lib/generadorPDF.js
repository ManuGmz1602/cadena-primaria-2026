import { jsPDF } from "jspdf";

export const generarAcuse = (datos) => {
  const doc = new jsPDF();
  const fecha = new Date().toLocaleDateString();

  // --- ENCABEZADO Y ESPACIO PARA FOLIO ---
  doc.setFillColor(240, 240, 240);
  doc.rect(10, 10, 190, 20, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text("SOLICITUD DE REGISTRO - CADENA DE CAMBIOS 2026", 105, 18, { align: "center" });
  
  doc.setFontSize(12);
  doc.setTextColor(200, 0, 0);
  doc.text(`FOLIO: _________________`, 195, 25, { align: "right" });

  // --- SECCIÓN I: DATOS PERSONALES ---
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text("I. DATOS PERSONALES", 10, 40);
  doc.line(10, 41, 200, 41);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nombre: ${datos.apellido_paterno} ${datos.apellido_materno} ${datos.nombres}`, 10, 48);
  doc.text(`RFC: ${datos.rfc}`, 10, 55);
  doc.text(`CURP: ${datos.curp}`, 80, 55);
  doc.text(`Clave Presupuestal: ${datos.clave_presupuestal}`, 140, 55);
  doc.text(`Función: ${datos.funcion}`, 10, 62);
  doc.text(`Grado de Estudios: ${datos.grado_estudios}`, 140, 62);

  // --- SECCIÓN II: ADSCRIPCIÓN ---
  doc.setFont("helvetica", "bold");
  doc.text("II. DATOS DE ADSCRIPCIÓN", 10, 75);
  doc.line(10, 76, 200, 76);
  doc.setFont("helvetica", "normal");
  if (datos.escuela_trabaja) doc.text(`Escuela: ${datos.escuela_trabaja}`, 10, 83);
  doc.text(`CCT: ${datos.cct}`, 10, 90);
  doc.text(`Zona: ${datos.zona_escolar}`, 80, 90);
  doc.text(`Sector: ${datos.sector}`, 140, 90);
  doc.text(`Localidad: ${datos.localidad}`, 10, 97);
  doc.text(`Municipio: ${datos.municipio}`, 80, 97);
  doc.text(`Sede/Cabecera: ${datos.sede}`, 140, 97);

  // --- SECCIÓN III: ANTIGÜEDAD Y PUNTOS ---
  doc.setFont("helvetica", "bold");
  doc.text("III. ANTIGÜEDAD", 10, 110);
  doc.line(10, 111, 200, 111);
  doc.setFont("helvetica", "normal");
  doc.text(`Ingreso SEP: ${datos.fecha_sep}`, 10, 118);
  doc.text(`Ingreso Zona: ${datos.fecha_zona}`, 80, 118);
  doc.text(`Ingreso C.T.: ${datos.fecha_ct}`, 140, 118);

  if (['JEFE_SECTOR', 'SUPERVISOR', 'DIRECTOR'].includes(datos.funcion)) {
    const puntos = new Date().getFullYear() - new Date(datos.fecha_sep).getFullYear();
    doc.setFont("helvetica", "bold");
    doc.text(`PUNTOS CALCULADOS POR ANTIGÜEDAD: ${puntos > 0 ? puntos : 0}`, 10, 128);
  }

  // --- SECCIÓN IV: DOCUMENTACIÓN A ENTREGAR (SEGÚN WORD) ---
  doc.setFont("helvetica", "bold");
  doc.text("IV. DOCUMENTACIÓN A ENTREGAR (EXPEDIENTE)", 10, 145);
  doc.line(10, 146, 200, 146);
  doc.setFontSize(9);
  const docs = [
    "1. Copia del último talón de pago.",
    "2. Copia de la Clave Presupuestal.",
    "3. Copia de RFC y CURP actualizado.",
    "4. Constancia de servicio original (emitida por la autoridad inmediata).",
    "5. Copia del comprobante del grado máximo de estudios.",
    "6. Solicitud de registro (esta cédula firmada)."
  ];
  docs.forEach((linea, i) => doc.text(linea, 15, 153 + (i * 6)));

  // --- SECCIÓN V: FIRMAS ---
  const firmaY = 240;
  doc.setFontSize(10);
  doc.line(20, firmaY, 90, firmaY);
  doc.text("FIRMA DEL INTERESADO", 55, firmaY + 5, { align: "center" });

  doc.line(120, firmaY, 190, firmaY);
  doc.text("NOMBRE Y FIRMA DE QUIEN RECIBE", 155, firmaY + 5, { align: "center" });

  doc.setFontSize(8);
  doc.text(`Generado el ${fecha} por el Sistema de Registro de Primaria`, 105, 280, { align: "center" });

  doc.save(`Acuse_${datos.rfc}.pdf`);
};