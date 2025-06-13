// ========== Función para formatear moneda ==========
function formatCurrency(value) {
  return Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

document.addEventListener('DOMContentLoaded', () => {
  // Splash screen behavior
  const splash = document.getElementById('splash');
  const entrarApp = document.getElementById('entrarApp');

  function ocultarSplash() {
    if (splash) {
      splash.classList.remove('splash-visible');
      setTimeout(() => {
        splash.style.display = 'none';
      }, 800);
    }
  }

  if (entrarApp && splash) {
    entrarApp.addEventListener('click', ocultarSplash);
    setTimeout(ocultarSplash, 6000); // 6 segundos
  }

  // ========== VARIABLES ==========
  const { jsPDF } = window.jspdf;
  const facturasContainer = document.getElementById('facturas');
  const dineroRecibido = document.getElementById('dineroRecibido');
  const rebajaInput = document.getElementById('rebaja');
  const resultado = document.getElementById('resultado');
  const errorDiv = document.getElementById('error');
  const historialDiv = document.getElementById('historial');
  const btnAgregar = document.getElementById('btnAgregar');
  const btnGuardar = document.getElementById('btnGuardar');
  const btnLimpiar = document.getElementById('btnLimpiar');
  const btnAplicarRebaja = document.getElementById('btnAplicarRebaja');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const toggleSonido = document.getElementById('toggleSonido');
  const toggleTema = document.getElementById('toggleTema');
  const filtroFecha = document.getElementById('filtroFecha');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const estadisticas = document.getElementById('estadisticas');
  const facturaForm = document.getElementById('facturaForm');
  const feedbackDiv = document.getElementById('feedback');
  const btnBorrarHistorial = document.getElementById('btnBorrarHistorial');
  const btnDescargarHistorial = document.getElementById('btnDescargarHistorial');
  const btnExportarPDF = document.getElementById('btnExportarPDF');

  const textos = {
    sinTransacciones: 'No hay transacciones en el historial.',
    eliminar: 'Eliminar',
    guardar: 'Guardado en historial',
    borrado: 'Entrada eliminada',
    errorRebajaNegativa: 'La rebaja no puede ser negativa.',
    errorRebajaMayor: 'La rebaja no puede ser mayor al total de las facturas.',
    errorHistorial: 'No se pudo guardar el historial.',
    errorFacturas: 'Añade facturas válidas para guardar.',
    noEntradasExportar: 'No hay entradas para exportar.',
    errorPDF: 'No se pudo exportar PDF (autoTable no cargado)',
    historialBorrado: 'Historial borrado',
    camposLimpiados: 'Campos limpiados'
  };

  let sonidoHabilitado = true;
  let currentPage = 1;
  const itemsPerPage = 10;
  let historial = [];

  // ========== BLOQUE CAMBIO DE TEMA CLARO/OSCURO ==========
  function cargarTema() {
    const temaGuardado = localStorage.getItem('tema');
    if (temaGuardado === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      toggleTema.textContent = '☀️ Tema Claro';
    } else {
      document.body.setAttribute('data-theme', 'light');
      toggleTema.textContent = '🌙 Tema Oscuro';
    }
  }

  toggleTema.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('tema', isDark ? 'light' : 'dark');
    toggleTema.textContent = isDark ? '🌙 Tema Oscuro' : '☀️ Tema Claro';
    feedback(isDark ? 'Tema claro activado' : 'Tema oscuro activado');
  });

  // ========== FEEDBACK VISUAL ANIMADO ==========
  function feedback(msg) {
    if (feedbackDiv) {
      feedbackDiv.textContent = msg;
      feedbackDiv.style.display = 'block';
      feedbackDiv.className = 'feedback';
      setTimeout(() => {
        feedbackDiv.style.display = 'none';
      }, 2500);
    }
  }

  // ========== BLOQUE DE GUARDADO Y RESTAURACIÓN ==========
  const FORM_STATE_KEY = 'formularioTemporal';

  function guardarFormularioTemporal() {
    const facturas = Array.from(document.querySelectorAll('#facturas input')).map(x => x.value);
    const recibido = dineroRecibido.value;
    const rebaja = rebajaInput.value;
    localStorage.setItem(FORM_STATE_KEY, JSON.stringify({ facturas, recibido, rebaja }));
  }

  function restaurarFormularioTemporal() {
    const datos = localStorage.getItem(FORM_STATE_KEY);
    if (!datos) return;
    try {
      const { facturas, recibido, rebaja } = JSON.parse(datos);
      facturasContainer.innerHTML = '';
      if (facturas && facturas.length) {
        facturas.forEach(val => agregarFactura(val));
      } else {
        agregarFactura();
      }
      dineroRecibido.value = recibido || '';
      rebajaInput.value = rebaja || '';
      calcularAutomatico();
    } catch (e) {
      localStorage.removeItem(FORM_STATE_KEY);
      agregarFactura();
    }
  }

  // ========== SONIDO ==========
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudioContext() {
    if (!AudioContext) return false;
    if (!audioCtx) {
      try {
        audioCtx = new AudioContext();
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  function playBeep() {
    if (!sonidoHabilitado || !initAudioContext()) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), 100);
  }

  function playError() {
    if (!sonidoHabilitado || !initAudioContext()) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
  }

  function playDestruction() {
    if (!sonidoHabilitado || !initAudioContext()) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    setTimeout(() => oscillator.stop(), 350);
  }

  // ========== LOCALSTORAGE E HISTORIAL ==========
  function isLocalStorageAvailable() {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadHistorial() {
    if (!isLocalStorageAvailable()) return [];
    try {
      const stored = localStorage.getItem('historial');
      return stored ? JSON.parse(stored).filter(validarEntrada) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistorial() {
    if (!isLocalStorageAvailable()) return;
    try {
      localStorage.setItem('historial', JSON.stringify(historial));
    } catch (e) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = textos.errorHistorial;
    }
  }

  function validarEntrada(item) {
    return item && typeof item === 'object' &&
      ['fecha', 'totalFacturas', 'rebaja', 'total', 'recibido', 'devuelto']
        .every(key => key in item && item[key] !== undefined && item[key] !== null);
  }

  // ========== TABS ==========
  function switchTab(tabId) {
    tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    tabContents.forEach(content => content.classList.toggle('active', content.id === `${tabId}-tab`));
    if (tabId === 'historial') mostrarHistorial();
    playBeep();
  }

  // ========== FACTURAS ==========
  function renderFacturas() {
    if (facturasContainer.childElementCount === 0) agregarFactura();
  }

  function agregarFactura(valor = '') {
    const div = document.createElement('div');
    div.className = 'factura-item';
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.min = '0';
    input.placeholder = 'Monto de factura';
    input.setAttribute('aria-label', 'Monto de factura');
    if (valor) input.value = valor;
    input.addEventListener('input', () => {
      const val = input.value.trim();
      if (!val || isNaN(val)) return;
      const numero = parseFloat(val);
      if (!isNaN(numero) && numero >= 0) {
        input.classList.remove('error');
      } else {
        input.classList.add('error');
      }
      calcularAutomatico();
      guardarFormularioTemporal();
    });
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = textos.eliminar;
    deleteBtn.setAttribute('aria-label', 'Eliminar factura');
    deleteBtn.addEventListener('click', () => {
      div.remove();
      calcularAutomatico();
      guardarFormularioTemporal();
      playDestruction();
      feedback(textos.borrado);
    });
    div.appendChild(input);
    div.appendChild(deleteBtn);
    facturasContainer.appendChild(div);
    input.focus();
    playBeep();
  }

  function obtenerSumaFacturas() {
    let suma = 0;
    document.querySelectorAll('#facturas input').forEach(input => {
      const val = parseFloat(input.value);
      if (isNaN(val) || val <= 0) {
        input.classList.add('error');
      } else {
        input.classList.remove('error');
        suma += val;
      }
    });
    const rebaja = parseFloat(rebajaInput.value) || 0;
    if (rebaja < 0) {
      rebajaInput.classList.add('error');
      errorDiv.style.display = 'block';
      errorDiv.textContent = textos.errorRebajaNegativa;
      playError();
      return null;
    }
    if (rebaja > suma) {
      rebajaInput.classList.add('error');
      errorDiv.style.display = 'block';
      errorDiv.textContent = textos.errorRebajaMayor;
      playError();
      return null;
    }
    errorDiv.style.display = 'none';
    return { totalFacturas: suma, rebaja };
  }

  function calcularAutomatico() {
    errorDiv.style.display = 'none';
    const suma = obtenerSumaFacturas();
    if (suma === null) {
      resultado.innerHTML = '';
      return;
    }
    const { totalFacturas, rebaja } = suma;
    const totalAjustado = totalFacturas - rebaja;
    const recibido = parseFloat(dineroRecibido.value) || 0;
    const devuelto = recibido - totalAjustado;

    let mensajeDinero = '';
    if (devuelto < 0) {
      mensajeDinero = `<span style="color:#ff4444;">Dinero a recibir: ${formatCurrency(Math.abs(devuelto))}</span>`;
    } else {
      mensajeDinero = `Dinero a devolver: ${formatCurrency(devuelto)}`;
    }

    resultado.innerHTML = `
      Total Facturas: ${formatCurrency(totalFacturas)}<br>
      Rebaja: ${formatCurrency(rebaja)}<br>
      Total Ajustado: ${formatCurrency(totalAjustado)}<br>
      ${mensajeDinero}
    `;
  }

  dineroRecibido.addEventListener('input', () => {
    calcularAutomatico();
    guardarFormularioTemporal();
  });

  rebajaInput.addEventListener('input', () => {
    calcularAutomatico();
    guardarFormularioTemporal();
  });

  facturasContainer.addEventListener('input', guardarFormularioTemporal);

  // ========== GUARDAR HISTORIAL ==========
  function guardarHistorial() {
    const suma = obtenerSumaFacturas();
    if (suma === null || suma.totalFacturas === 0) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = textos.errorFacturas;
      playError();
      return;
    }
    const { totalFacturas, rebaja } = suma;
    const totalAjustado = totalFacturas - rebaja;
    const recibido = parseFloat(dineroRecibido.value) || 0;
    const devuelto = recibido - totalAjustado;
    const fechaObj = new Date();
    const fecha = fechaObj.toLocaleString();
    const fechaISO = fechaObj.toISOString().slice(0, 10); // "YYYY-MM-DD"
    historial.unshift({
      fecha,
      fechaISO,
      transaccionNum: historial.filter(i => i.fechaISO === fechaISO).length + 1,
      totalFacturas,
      rebaja,
      total: totalAjustado,
      recibido,
      devuelto
    });
    saveHistorial();
    limpiarCampos();
    localStorage.removeItem(FORM_STATE_KEY); // limpiar temporal
    switchTab('historial');
    mostrarHistorial();
    playBeep();
    feedback(textos.guardar);
  }

  // ========== LIMPIAR CAMPOS ==========
  function limpiarCampos() {
    facturasContainer.innerHTML = '';
    dineroRecibido.value = '';
    rebajaInput.value = '';
    resultado.innerHTML = '';
    errorDiv.style.display = 'none';
    agregarFactura();
    localStorage.removeItem(FORM_STATE_KEY);
    playBeep();
    feedback(textos.camposLimpiados);
  }

  // ========== MOSTRAR HISTORIAL ==========
  function mostrarHistorial(page = 1) {
    historial = loadHistorial();
    const filteredHistorial = filtroFecha?.value
      ? historial.filter(item => item.fechaISO === filtroFecha.value)
      : historial;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedHistorial = filteredHistorial.slice(start, end);

    if (historialDiv) {
      historialDiv.innerHTML = paginatedHistorial.map((item, index) => `
        <div>
          <span>Transacción ${item.transaccionNum} - <strong>${item.fecha}</strong>: Total: ${formatCurrency(item.total)}</span>
          <button class="delete-btn" type="button" onclick="eliminarEntrada(${start + index})">${textos.eliminar}</button>
        </div>
      `).join('');

      if (paginatedHistorial.length === 0) {
        historialDiv.innerHTML = `<p>${textos.sinTransacciones}</p>`;
      }
    }

    if (pageInfo) {
      pageInfo.textContent = `Página ${page} de ${Math.max(1, Math.ceil(filteredHistorial.length / itemsPerPage))}`;
    }

    if (prevPage) prevPage.disabled = page === 1;
    if (nextPage) nextPage.disabled = end >= filteredHistorial.length;

    actualizarEstadisticas(filteredHistorial);
    actualizarGraficaResumen(filteredHistorial);
    currentPage = page;
  }

  function actualizarEstadisticas(historialFiltrado) {
    if (!estadisticas || !historialFiltrado || historialFiltrado.length === 0) {
      estadisticas.textContent = '';
      return;
    }
    const sumaTotal = historialFiltrado.reduce((acc, item) => acc + item.total, 0);
    const sumaRecibido = historialFiltrado.reduce((acc, item) => acc + item.recibido, 0);
    const sumaDevuelto = historialFiltrado.reduce((acc, item) => acc + item.devuelto, 0);
    estadisticas.innerHTML = `
      <strong>Estadísticas del filtro:</strong><br>
      Suma total: ${formatCurrency(sumaTotal)}<br>
      Suma recibido: ${formatCurrency(sumaRecibido)}<br>
      Suma devuelto: ${formatCurrency(sumaDevuelto)}<br>
      Transacciones: ${historialFiltrado.length}
    `;
  }

  // ========== ELIMINAR ENTRADA DEL HISTORIAL ==========
  function eliminarEntrada(index) {
    historial.splice(index, 1);
    saveHistorial();
    const totalPages = Math.max(1, Math.ceil(historial.length / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    mostrarHistorial(currentPage);
    playDestruction();
    feedback(textos.borrado);
  }

  window.eliminarEntrada = eliminarEntrada;

  // ========== EXPORTAR Y DESCARGAR HISTORIAL ==========
  function descargarHistorial() {
    historial = loadHistorial();
    if (historial.length === 0) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = textos.noEntradasExportar;
      playError();
      return;
    }
    let csv = 'Fecha,Total Facturas,Rebaja,Total,Recibido,Devuelto\n';
    historial.forEach(item => {
      csv += `${item.fecha},${item.totalFacturas},${item.rebaja},${item.total},${item.recibido},${item.devuelto}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    playBeep();
    feedback('Historial descargado');
  }

  function exportarHistorialPDF() {
    historial = loadHistorial();
    if (historial.length === 0) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = textos.noEntradasExportar;
      playError();
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Historial de Transacciones', 20, 20);
    const headers = [['Fecha', 'Total Facturas', 'Rebaja', 'Total', 'Recibido', 'Devuelto']];
    const data = historial.map(item => [
      item.fecha,
      item.totalFacturas.toFixed(2),
      item.rebaja.toFixed(2),
      item.total.toFixed(2),
      item.recibido.toFixed(2),
      item.devuelto.toFixed(2)
    ]);
    if (typeof doc.autoTable === 'function') {
      doc.autoTable({ head: headers, body: data, startY: 30 });
      doc.save(`historial_transacciones_${new Date().toISOString().split('T')[0]}.pdf`);
      playBeep();
      feedback('Historial PDF generado');
    } else {
      errorDiv.style.display = 'block';
      errorDiv.textContent = textos.errorPDF;
      playError();
    }
  }

  // ========== BORRAR HISTORIAL COMPLETO ==========
  function borrarHistorial() {
    if (confirm('¿Seguro que quieres borrar todo el historial?')) {
      historial = [];
      saveHistorial();
      mostrarHistorial();
      playDestruction();
      feedback(textos.historialBorrado);
    }
  }

  // ========== EVENTOS ==========
  toggleSonido.addEventListener('click', () => {
    sonidoHabilitado = !sonidoHabilitado;
    toggleSonido.textContent = `🔊 Sonido: ${sonidoHabilitado ? 'Activado' : 'Desactivado'}`;
    playBeep();
    feedback(`Sonido ${sonidoHabilitado ? 'activado' : 'desactivado'}`);
  });

  filtroFecha?.addEventListener('input', () => {
    currentPage = 1;
    mostrarHistorial();
  });

  prevPage?.addEventListener('click', () => {
    if (currentPage > 1) mostrarHistorial(currentPage - 1);
  });

  nextPage?.addEventListener('click', () => {
    mostrarHistorial(currentPage + 1);
  });

  if (tabButtons && tabButtons.length > 0) {
    tabButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  }

  btnAgregar?.addEventListener('click', () => {
    agregarFactura();
    guardarFormularioTemporal();
  });

  btnGuardar?.addEventListener('click', guardarHistorial);
  btnLimpiar?.addEventListener('click', limpiarCampos);
  btnAplicarRebaja?.addEventListener('click', calcularAutomatico);
  btnBorrarHistorial?.addEventListener('click', borrarHistorial);
  btnDescargarHistorial?.addEventListener('click', descargarHistorial);
  btnExportarPDF?.addEventListener('click', exportarHistorialPDF);
  facturaForm?.addEventListener('submit', e => {
    e.preventDefault();
    guardarHistorial();
  });

  // ========== INICIALIZACIÓN ==========
  cargarTema();
  renderFacturas();
  restaurarFormularioTemporal();
  mostrarHistorial();
  switchTab('facturas');
});

// === GRAFICA RESUMEN ===
function actualizarGraficaResumen(historialFiltrado) {
  const canvas = document.getElementById('graficaResumen');
  if (!canvas) return;

  const agrupado = {};
  historialFiltrado.forEach(item => {
    agrupado[item.fechaISO] = (agrupado[item.fechaISO] || 0) + item.total;
  });

  const labels = Object.keys(agrupado);
  const data = Object.values(agrupado);

  if (window.graficaResumenChart) {
    window.graficaResumenChart.destroy();
  }

  if (data.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  window.graficaResumenChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Total por día',
        data,
        backgroundColor: '#1976d2'
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Resumen diario de totales'
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatCurrency(value)
          }
        }
      }
    }
  });
}
