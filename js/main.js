// Estado global cargado desde localStorage
let transacciones = JSON.parse(localStorage.getItem("transacciones")) || [
  {
    id: 1,
    tipo: "ingreso",
    descripcion: "Venta de productos en tienda",
    monto: 4500000,
  },
  {
    id: 2,
    tipo: "gasto",
    descripcion: "Pago de servicios e internet",
    monto: 1800000,
  },
];

let myChart = null;

// Formateador de moneda
const formatCOP = (num) => "$ " + Math.round(num).toLocaleString("es-CO");

// 1. ANIMACIÓN DE CONTADORES NUMÉRICOS (GSAP)
function animarContador(elementId, valorFinal) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let obj = { val: 0 };
  gsap.to(obj, {
    val: valorFinal,
    duration: 1.2,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = formatCOP(obj.val);
    },
  });
}

// 2. RENDERIZAR Y ANIMAR GRÁFICO (Chart.js)
function actualizarGrafico(ingresos, gastos) {
  const canvas = document.getElementById("financeChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (myChart) myChart.destroy();

  // 1. Crear degradados líquidos para las barras/anillos
  const gradientIngresos = ctx.createLinearGradient(0, 0, 0, 250);
  gradientIngresos.addColorStop(0, "#2e7d32"); // Verde esmeralda
  gradientIngresos.addColorStop(1, "#81c784"); // Verde claro neón

  const gradientGastos = ctx.createLinearGradient(0, 0, 0, 250);
  gradientGastos.addColorStop(0, "#c62828"); // Rojo rubí
  gradientGastos.addColorStop(1, "#ff8a80"); // Rosa coral

  const flujoNeto = ingresos - gastos;

  // 2. Plugin para escribir el Balance en el centro de la dona
  const centerTextPlugin = {
    id: "centerText",
    beforeDraw(chart) {
      const { width, height, ctx } = chart;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Etiqueta superior
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillStyle = "#666666";
      ctx.fillText("DISPONIBLE", width / 2, height / 2 - 12);

      // Monto central
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillStyle = flujoNeto >= 0 ? "#2e7d32" : "#c62828";
      ctx.fillText(formatCOP(flujoNeto), width / 2, height / 2 + 10);

      ctx.restore();
    },
  };

  // 3. Configuración avanzada de Chart.js
  myChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Ingresos", "Gastos"],
      datasets: [
        {
          data: [ingresos, gastos],
          backgroundColor: [gradientIngresos, gradientGastos],
          borderWidth: 0,
          borderRadius: 10, // Esquinas redondeadas en los arcos
          spacing: 8, // Espaciado elegante entre segmentos
          hoverOffset: 12, // Efecto de expansión al pasar el cursor
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "78%", // Anillo más delgado y estilizado
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1400,
        easing: "easeInOutQuart",
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 20,
            font: {
              family: "'Segoe UI', sans-serif",
              size: 12,
              weight: "bold",
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(136, 14, 79, 0.9)", // Color corporativo con transparencia
          titleFont: { size: 13, weight: "bold" },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return `${context.label}: $ ${context.raw.toLocaleString("es-CO")}`;
            },
          },
        },
      },
    },
    plugins: [centerTextPlugin],
  });
}

// 3. ACTUALIZAR INTERFAZ Y HISTORIAL (CRUD)
function render() {
  const listEl = document.getElementById("transaction-list");
  if (!listEl) return;

  listEl.innerHTML = "";
  let totalIngresos = 0,
    totalGastos = 0;

  transacciones.forEach((t) => {
    if (t.tipo === "ingreso") totalIngresos += t.monto;
    else totalGastos += t.monto;

    const li = document.createElement("li");
    li.className = "transaction-item";
    li.innerHTML = `
            <div class="transaction-info">
                <strong>${t.descripcion}</strong>
                <span>${t.tipo.toUpperCase()}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="transaction-value" style="color: ${t.tipo === "ingreso" ? "var(--verde-exito)" : "var(--rojo-gasto)"}">
                    ${t.tipo === "ingreso" ? "+" : "-"}${formatCOP(t.monto)}
                </span>
                <button onclick="eliminarRegistro(${t.id})" style="border:none; background:none; cursor:pointer;">🗑️</button>
            </div>
        `;
    listEl.appendChild(li);
  });

  // Ejecutar animaciones de contadores
  animarContador("ingresos-total", totalIngresos);
  animarContador("gastos-total", totalGastos);
  animarContador("flujo-neto", totalIngresos - totalGastos);

  // Guardar y refrescar gráfico
  localStorage.setItem("transacciones", JSON.stringify(transacciones));
  actualizarGrafico(totalIngresos, totalGastos);
}

// 4. EVENTO PARA REGISTRAR MOVIMIENTOS + CONFETI
document
  .getElementById("finance-form")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();
    const tipo = document.getElementById("tipo").value;
    const descripcion = document.getElementById("descripcion").value;
    const monto = parseFloat(document.getElementById("monto").value);

    if (!monto || monto <= 0) return;

    transacciones.unshift({ id: Date.now(), tipo, descripcion, monto });
    render();
    this.reset();

    // Lanzar confeti si el ingreso es alto
    if (tipo === "ingreso" && monto >= 200000) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  });

// 5. ELIMINAR REGISTRO CON ALERTA
function eliminarRegistro(id) {
  Swal.fire({
    title: "¿Eliminar transacción?",
    text: "No podrás revertir este cambio",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f06292",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, borrar",
  }).then((result) => {
    if (result.isConfirmed) {
      transacciones = transacciones.filter((t) => t.id !== id);
      render();
      Swal.fire("¡Borrado!", "El registro ha sido eliminado.", "success");
    }
  });
}

// Inicializar al cargar
document.addEventListener("DOMContentLoaded", render);

// --- SISTEMA DE PARTÍCULAS DE FONDO INTERACTIVO ---
const canvas = document.getElementById("bg-canvas");

// Solo ejecuta las partículas si el canvas realmente existe en la página actual
if (canvas) {
  const ctx = canvas.getContext("2d");

  let particles = [];
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 15 + 5;
      this.speedY = Math.random() * 0.8 + 0.2;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.4 + 0.1;
      this.color = Math.random() > 0.5 ? "240, 98, 146" : "255, 224, 130";
    }
    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      if (this.y < -20) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 35; i++) {
    particles.push(new Particle());
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animateParticles);
  }
  animateParticles();
}

// --- RELOJ DIGITAL EN TIEMPO REAL ---
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const clockEl = document.getElementById("live-clock");
  if (clockEl) clockEl.textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

function cambiarVista(vistaId) {
  document
    .querySelectorAll(".view-section")
    .forEach((sec) => (sec.style.display = "none"));
  const target = document.getElementById(vistaId);
  if (target) target.style.display = "block";

  const vistaBienvenida = document.getElementById("view-bienvenida");
  const vistaFinanciero = document.getElementById("view-financiero");
  const vistaAhorro = document.getElementById("view-ahorro");
  const vistaDeudas = document.getElementById("view-deudas");
  const vistaSimulador = document.getElementById("view-simulador"); // Declarar simulador

  const seccionAsistentes = document.getElementById("asistentes");
  const seccionFundadoras = document.getElementById("seccion-fundadoras");

  // 1. Ocultar todas las vistas primero
  if (vistaBienvenida) vistaBienvenida.style.display = "none";
  if (seccionAsistentes) seccionAsistentes.style.display = "none";
  if (seccionFundadoras) seccionFundadoras.style.display = "none";
  if (vistaFinanciero) vistaFinanciero.style.display = "none";
  if (vistaAhorro) vistaAhorro.style.display = "none";
  if (vistaDeudas) vistaDeudas.style.display = "none";
  if (vistaSimulador) vistaSimulador.style.display = "none"; // Ocultar simulador

  // 2. Mostrar la vista seleccionada usando switch
  switch (vistaId) {
    case "view-financiero":
      if (vistaFinanciero) vistaFinanciero.style.display = "block";
      break;

    case "view-ahorro":
      if (vistaAhorro) vistaAhorro.style.display = "block";
      if (typeof renderizarFinanzasPersonales === "function") {
        renderizarFinanzasPersonales();
      }
      break;

    case "view-simulador":
      if (vistaSimulador) vistaSimulador.style.display = "block";
      break;

    case "view-deudas":
      document
        .querySelectorAll(".view-section")
        .forEach((s) => (s.style.display = "none"));
      const vistaDeudasTarget = document.getElementById("view-deudas");
      if (vistaDeudasTarget) {
        vistaDeudasTarget.style.display = "block";
      }
      if (typeof renderizarDeudas === "function") {
        renderizarDeudas();
      }
      break;

    default:
      // Vista de inicio / bienvenida por defecto
      if (vistaBienvenida) vistaBienvenida.style.display = "block";
      if (seccionAsistentes) seccionAsistentes.style.display = "block";
      if (seccionFundadoras) seccionFundadoras.style.display = "block";
      break;
  }

  // 3. Actualizar clases activas en los botones de navegación
  const tabs = document.querySelectorAll(".nav-tab, .finance-tab-btn-fix");
  tabs.forEach((tab) => tab.classList.remove("active"));

  if (vistaId === "view-ahorro") {
    const btnAhorro = document.getElementById("btn-tab-ahorro");
    if (btnAhorro) btnAhorro.classList.add("active");
  } else if (vistaId === "view-simulador") {
    // Si puedes asignar un ID único a tu enlace del simulador (ej. id="btn-tab-simulador"), puedes activarlo aquí
    const btnSimulador = document.getElementById("btn-tab-simulador");
    if (btnSimulador) btnSimulador.classList.add("active");
  } else if (vistaId === "view-deudas") {
    const btnDeudas = document.getElementById("btn-tab-deudas");
    if (btnDeudas) btnDeudas.classList.add("active");
  } else if (vistaId === "view-financiero") {
    const btnFinanciero = document.getElementById("btn-tab-financiero");
    if (btnFinanciero) btnFinanciero.classList.add("active");
  } else {
    const tabsNav = document.querySelectorAll(".nav-tab");
    if (tabsNav[0]) tabsNav[0].classList.add("active");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}
window.scrollTo({ top: 0, behavior: "smooth" });

// --- ANIMACIÓN CONTINUA PARA EL BANNER DE CONTADURÍA ---
function animarHeroContable() {
  gsap.to(".animated-scale", {
    y: -8,
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
  gsap.to(".c1", {
    x: 30,
    y: -20,
    rotation: 360,
    duration: 3,
    repeat: -1,
    yoyo: true,
  });
  gsap.to(".c2", {
    x: -30,
    y: 20,
    rotation: -360,
    duration: 4,
    repeat: -1,
    yoyo: true,
  });
  gsap.to(".c3", { y: -30, scale: 1.2, duration: 2.5, repeat: -1, yoyo: true });
}

document.addEventListener("DOMContentLoaded", () => {
  animarHeroContable();
});

// --- EFECTO DE INCLINACIÓN 3D (TILT) EN TARJETAS DE FUNDADORAS ---
function init3DTilt() {
  const cards = document.querySelectorAll(".creator-card-3d");

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotateX = (-y / rect.height) * 15;
      const rotateY = (x / rect.width) * 15;

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        duration: 0.3,
        ease: "power1.out",
      });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.4)",
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", init3DTilt);

// --- ANIMACIÓN DE LEVITACIÓN FLOTANTE PARA AVATARES (GSAP) ---
function animarAvataresFlotantes() {
  // Levitación desfasada para dar movimiento dinámico
  gsap.to(".float-1", {
    y: -22,
    duration: 2.8,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  gsap.to(".float-2", {
    y: -28,
    duration: 3.2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: 0.4,
  });

  gsap.to(".float-3", {
    y: -20,
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: 0.8,
  });
}

document.addEventListener("DOMContentLoaded", () => {
  animarAvataresFlotantes();
});

// --- INTERACTIVIDAD AVANZADA PARA LOS AVATARES ---
function inicializarAvataresInteractivos() {
  const avatares = document.querySelectorAll(".interactive-avatar");

  // 1. Seguimiento del Cursor (Efecto Parallax)
  document.addEventListener("mousemove", (e) => {
    const mouseX = (window.innerWidth / 2 - e.pageX) / 40;
    const mouseY = (window.innerHeight / 2 - e.pageY) / 40;

    // Mueve ligeramente los avatares en dirección opuesta al cursor para dar profundidad
    gsap.to(avatares, {
      x: -mouseX,
      y: -mouseY,
      duration: 0.8,
      ease: "power2.out",
    });
  });

  // 2. Eventos Hover y Click para cada avatar
  avatares.forEach((avatar) => {
    const originalSrc = avatar.src;
    // Truco: Agregamos parámetros a la API de DiceBear para cambiar la boca y ojos
    const happySrc = originalSrc + "&mouth=smile,twinkle&eyes=happy";
    const nombre = avatar.getAttribute("alt");

    // Al pasar el mouse: Cambia la cara y hace un salto elástico
    avatar.addEventListener("mouseenter", () => {
      avatar.src = happySrc;
      gsap.to(avatar, {
        scale: 1.15,
        rotation: 5,
        duration: 0.4,
        ease: "back.out(2)",
      });
    });

    // Al quitar el mouse: Vuelve a la normalidad
    avatar.addEventListener("mouseleave", () => {
      avatar.src = originalSrc;
      gsap.to(avatar, {
        scale: 1,
        rotation: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    });

    // Al hacer clic: Diálogo interactivo
    avatar.addEventListener("click", () => {
      let mensaje = "";
      let color = "#880e4f";

      if (nombre === "Catalina") {
        mensaje =
          "¡Hola! Analiza siempre tu flujo neto disponible antes de reinvertir.";
      } else if (nombre === "Camila") {
        mensaje =
          "Recuerda registrar cada gasto, por pequeño que sea. ¡El orden es clave!";
        color = "#2e7d32";
      } else if (nombre === "Marta") {
        mensaje =
          "Tus proyecciones financieras van por excelente camino. Sigue así.";
        color = "#f57f17";
      }

      // Mostrar notificación tipo "Toast"
      Swal.fire({
        title: `${nombre} dice:`,
        text: mensaje,
        icon: "info",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        background: "rgba(255, 255, 255, 0.95)",
        color: color,
      });
    });
  });
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", inicializarAvataresInteractivos);

// --- ANIMACIONES DE ENTRADA HERO (GSAP) ---
function animarEntradaHero() {
  // Tipeo de máquina de escribir
  const text = "El futuro financiero de tu pyme, hoy.";
  let i = 0;
  const speed = 60; // velocidad de tipeo en ms
  const targetEl = document.getElementById("typed-title");

  function typeWriter() {
    if (i < text.length && targetEl) {
      targetEl.innerHTML += text.charAt(i);
      i++;
      setTimeout(typeWriter, speed);
    }
  }

  // Si el elemento existe, lo limpiamos e iniciamos el tipeo
  if (targetEl) {
    targetEl.innerHTML = "";
    setTimeout(typeWriter, 400); // Retraso antes de empezar
  }

  // Animación en cascada de los elementos
  gsap.from(".hero-badge-anim", {
    y: -20,
    opacity: 0,
    duration: 0.8,
    delay: 0.2,
  });
  gsap.from(".hero-subtitle", { y: 20, opacity: 0, duration: 0.8, delay: 0.6 });
  gsap.from(".stat-box", {
    y: 30,
    opacity: 0,
    duration: 0.6,
    stagger: 0.2,
    delay: 0.8,
  });

  // Zoom suave al módulo de chat
  gsap.from(".chat-widget", {
    scale: 0.9,
    opacity: 0,
    y: 40,
    duration: 1,
    ease: "back.out(1.5)",
    delay: 0.5,
  });
}

// --- LÓGICA DEL ASISTENTE VIRTUAL (CHATBOT) ---
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBody = document.getElementById("chat-body");

// Base de conocimientos simulada para el Bot
const respuestasBot = [
  {
    claves: ["hola", "buenas", "saludos"],
    res: "¡Hola! ¿Cómo va el flujo de caja hoy? Puedes consultarme sobre métricas o estrategias.",
  },
  {
    claves: ["estrategia", "peyea", "plan", "posicion"],
    res: "Diseñar una matriz PEYEA es excelente para evaluar la postura estratégica frente a tu industria. Te sugiero revisar primero la estabilidad financiera de la empresa.",
  },
  {
    claves: ["cultura", "organizacion", "equipo"],
    res: "Una cultura organizacional sólida se refleja directamente en la rentabilidad operativa. Un equipo alineado reduce costos innecesarios.",
  },
  {
    claves: ["gasto", "compras", "costo"],
    res: "Recuerda que todo gasto debe registrarse en el módulo 'Movimientos'. Revisa siempre si es un gasto fijo o variable.",
  },
  {
    claves: ["ingreso", "ventas", "ganancia"],
    res: "¡Las ventas son el motor! No olvides apartar un porcentaje para el fondo de reserva de liquidez.",
  },
];

function responderChat(mensajeUsuario) {
  const msj = mensajeUsuario.toLowerCase();
  let respuestaFinal =
    "Interesante. Te recomiendo ir a la pestaña 'Módulo Financiero' para registrar tus números y ver el panorama completo.";

  // Buscar coincidencia en la base de conocimientos
  for (const item of respuestasBot) {
    if (item.claves.some((clave) => msj.includes(clave))) {
      respuestaFinal = item.res;
      break;
    }
  }

  // Simular tiempo de pensamiento del bot
  setTimeout(() => {
    agregarMensaje(respuestaFinal, "bot-msg");
  }, 800);
}

function agregarMensaje(texto, tipo) {
  if (!chatBody) return;
  const wrap = document.createElement("div");
  wrap.className = `msg-wrapper ${tipo}`;
  wrap.innerHTML = `<div class="msg-bubble">${texto}</div>`;
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight; // Auto-scroll hacia abajo
}

if (chatForm) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = chatInput.value.trim();
    if (texto === "") return;

    agregarMensaje(texto, "user-msg");
    chatInput.value = "";
    responderChat(texto);
  });
}

function limpiarChat() {
  if (chatBody) {
    chatBody.innerHTML = `
            <div class="msg-wrapper bot-msg">
                <div class="msg-bubble">Chat reiniciado. ¿En qué más puedo ayudarte?</div>
            </div>`;
  }
}

// Ejecutar al iniciar la página
document.addEventListener("DOMContentLoaded", () => {
  animarEntradaHero();
});

// --- ANIMACIÓN DEL MOTOR CONTABLE 3D ---
function animarMotorContable() {
  // 1. Las barras crecen con un efecto elástico desde cero
  gsap.from(".sa-bar", {
    scaleY: 0,
    opacity: 0,
    duration: 1.8,
    stagger: 0.2, // Aparece una tras otra
    ease: "elastic.out(1, 0.6)",
    delay: 0.5,
  });

  // 2. El anillo holográfico gira lentamente en perspectiva
  gsap.to(".sa-platform", {
    rotationZ: 360,
    duration: 25,
    repeat: -1,
    ease: "none",
  });

  // 3. Levitación suave y desfasada para las etiquetas de datos
  gsap.to(".sa-badge-tax", {
    y: -15,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
  gsap.to(".sa-badge-rev", {
    y: -20,
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: 0.5,
  });

  // 4. El botón de acción hace un pulso sutil para invitar al clic
  gsap.to(".sa-btn-anim", {
    scale: 1.03,
    boxShadow: "0 10px 25px rgba(233, 30, 99, 0.4)",
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

// Llama a la función al cargar la página (puedes ponerla junto a tus otras inicializaciones)
document.addEventListener("DOMContentLoaded", () => {
  animarMotorContable();
});

// --- ASISTENTES FINANCIEROS DINÁMICOS (MENSAJES ROTATIVOS) ---
function inicializarAsistentesDinamicos() {
  const msgMaracuyaEl = document.getElementById("msg-maracuya");
  const msgOreoEl = document.getElementById("msg-oreo");

  if (!msgMaracuyaEl || !msgOreoEl) return;

  // Base de conocimientos de Maracuyá (Enfocada en crecimiento, ahorro e ingresos)
  const consejosMaracuya = [
    "¡Miau! Recuerda destinar al menos el 10% de tus ventas de hoy al fondo de reserva.",
    "Si logras aumentar tu ticket promedio ofreciendo servicios adicionales, tu liquidez mejorará.",
    "El flujo neto está positivo, ¡es un excelente momento para planear inversiones estratégicas!",
    "Revisa tus cuentas por cobrar. Mantener una cartera sana es vital para el crecimiento.",
  ];

  // Base de conocimientos de Oreo (Enfocado en auditoría, gastos y control)
  const consejosOreo = [
    "Atención a los gastos fijos. Revisa la lista de insumos para no comprar de más a fin de mes.",
    "Los 'gastos hormiga' silenciosos son mi especialidad... ¡y los estoy vigilando de cerca!",
    "Mantén tus recibos y facturas organizadas. Una auditoría impecable previene sanciones.",
    "Antes de aprobar una compra grande, verifica en el gráfico si afecta tu presupuesto de riesgo.",
  ];

  let indexMaracuya = 0;
  let indexOreo = 0;

  // Función para rotar mensajes con efecto Fade
  function cambiarMensaje(elemento, arrayConsejos, indexVariable) {
    // 1. Ocultar el texto actual
    elemento.style.opacity = 0;
    elemento.style.transform = "translateY(5px)";

    // 2. Cambiar el texto después de que termine la animación de ocultado
    setTimeout(() => {
      indexVariable = (indexVariable + 1) % arrayConsejos.length;
      elemento.textContent = arrayConsejos[indexVariable];

      // 3. Mostrar el nuevo texto
      elemento.style.opacity = 1;
      elemento.style.transform = "translateY(0)";
    }, 500); // 500ms coincide con la transición CSS

    return indexVariable; // Retornamos el índice actualizado
  }

  // Ejecutar el cambio cada 7.5 segundos
  setInterval(() => {
    indexMaracuya = cambiarMensaje(
      msgMaracuyaEl,
      consejosMaracuya,
      indexMaracuya,
    );
    indexOreo = cambiarMensaje(msgOreoEl, consejosOreo, indexOreo);
  }, 7500);
}

// Inicializar cuando la página cargue
document.addEventListener("DOMContentLoaded", inicializarAsistentesDinamicos);

// --- ASISTENTES FINANCIEROS DINÁMICOS (MENSAJES ROTATIVOS) ---
function inicializarAsistentesDinamicos() {
  const msgMaracuyaEl = document.getElementById("msg-maracuya");
  const msgOreoEl = document.getElementById("msg-oreo");

  if (!msgMaracuyaEl || !msgOreoEl) return;

  // Base de conocimientos de Maracuyá (Enfocada en crecimiento, ahorro e ingresos)
  const consejosMaracuya = [
    "¡Miau! Recuerda destinar al menos el 10% de tus ventas de hoy al fondo de reserva.",
    "Si logras aumentar tu ticket promedio ofreciendo servicios adicionales, tu liquidez mejorará.",
    "El flujo neto está positivo, ¡es un excelente momento para planear inversiones estratégicas!",
    "Revisa tus cuentas por cobrar. Mantener una cartera sana es vital para el crecimiento.",
  ];

  // Base de conocimientos de Oreo (Enfocado en auditoría, gastos y control)
  const consejosOreo = [
    "Atención a los gastos fijos. Revisa la lista de insumos para no comprar de más a fin de mes.",
    "Los 'gastos hormiga' silenciosos son mi especialidad... ¡y los estoy vigilando de cerca!",
    "Mantén tus recibos y facturas organizadas. Una auditoría impecable previene sanciones.",
    "Antes de aprobar una compra grande, verifica en el gráfico si afecta tu presupuesto de riesgo.",
  ];

  let indexMaracuya = 0;
  let indexOreo = 0;

  // Función para rotar mensajes con efecto Fade
  function cambiarMensaje(elemento, arrayConsejos, indexVariable) {
    // 1. Ocultar el texto actual
    elemento.style.opacity = 0;
    elemento.style.transform = "translateY(5px)";

    // 2. Cambiar el texto después de que termine la animación de ocultado
    setTimeout(() => {
      indexVariable = (indexVariable + 1) % arrayConsejos.length;
      elemento.textContent = arrayConsejos[indexVariable];

      // 3. Mostrar el nuevo texto
      elemento.style.opacity = 1;
      elemento.style.transform = "translateY(0)";
    }, 500); // 500ms coincide con la transición CSS

    return indexVariable; // Retornamos el índice actualizado
  }

  // Ejecutar el cambio cada 7.5 segundos
  setInterval(() => {
    indexMaracuya = cambiarMensaje(
      msgMaracuyaEl,
      consejosMaracuya,
      indexMaracuya,
    );
    indexOreo = cambiarMensaje(msgOreoEl, consejosOreo, indexOreo);
  }, 7500);
}

// Inicializar cuando la página cargue
document.addEventListener("DOMContentLoaded", inicializarAsistentesDinamicos);

// --- CONTROL DE SUB-PESTAÑAS DEL MÓDULO FINANCIERO ---
function cambiarSubPestana(idPanel, elementoBoton) {
  // 1. Ocultar todos los paneles
  const paneles = document.querySelectorAll(".finance-content-pane");
  paneles.forEach((panel) => {
    panel.style.display = "none";
  });

  // 2. Quitar la clase 'active' de todos los botones
  const botones = document.querySelectorAll(".finance-tab-btn");
  botones.forEach((btn) => {
    btn.classList.remove("active");
  });

  // 3. Mostrar el panel seleccionado y activar su botón
  document.getElementById(idPanel).style.display = "block";
  elementoBoton.classList.add("active");
}

// --- LÓGICA DE ONBOARDING (SIMULACIÓN DE REGISTRO) ---
function iniciarInventario() {
  const nombreNegocio = document.getElementById("business-name").value;
  const tipoNegocio = document.getElementById("business-type").value;

  if (nombreNegocio.trim() === "") {
    Swal.fire({
      icon: "warning",
      title: "Campo vacío",
      text: "Por favor, ingresa el nombre de tu emprendimiento para continuar.",
      confirmButtonColor: "#e91e63",
    });
    return;
  }

  // Ocultar formulario de onboarding con animación
  gsap.to("#onboarding-panel", {
    opacity: 0,
    scale: 0.9,
    duration: 0.4,
    onComplete: () => {
      document.getElementById("onboarding-panel").style.display = "none";

      // Mostrar el dashboard de inventario
      const invDash = document.getElementById("inventory-dashboard");
      invDash.style.display = "block";

      // Animación de entrada para el dashboard
      gsap.from(invDash, { opacity: 0, y: 20, duration: 0.5 });

      // Bienvenida personalizada
      Swal.fire({
        icon: "success",
        title: `¡Entorno creado!`,
        text: `El sistema está listo para gestionar el inventario de ${nombreNegocio}.`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
    },
  });
}

// --- BASE DE DATOS LOCAL SIMULADA PARA EL INVENTARIO ---
let inventarioData = [];

// Función que arranca el inventario al enviar el Onboarding
function iniciarInventario() {
  const nombreNegocio = document.getElementById("business-name").value;
  const tipoNegocio = document.getElementById("business-type").value;

  if (nombreNegocio.trim() === "") {
    Swal.fire({
      icon: "warning",
      title: "¡Espera!",
      text: "Por favor, ingresa el nombre de tu emprendimiento.",
      confirmButtonColor: "#e91e63",
    });
    return;
  }

  // Asignar el nombre en la cabecera del inventario
  document.getElementById("display-business-name").innerText = nombreNegocio;

  // Cargar productos iniciales según el sector seleccionado
  if (tipoNegocio === "agro") {
    inventarioData = [
      {
        id: 1,
        emoji: "🌱",
        nombre: "Fertilizante Orgánico",
        cantidad: 45,
        costo: 25000,
      },
      {
        id: 2,
        emoji: "🌽",
        nombre: "Semillas de Maíz",
        cantidad: 120,
        costo: 15000,
      },
      {
        id: 3,
        emoji: "💧",
        nombre: "Sistema de Riego",
        cantidad: 8,
        costo: 180000,
      },
    ];
  } else if (tipoNegocio === "comida") {
    inventarioData = [
      {
        id: 1,
        emoji: "🥑",
        nombre: "Aguacates Hass",
        cantidad: 60,
        costo: 3000,
      },
      {
        id: 2,
        emoji: "🍅",
        nombre: "Tomate Chonto",
        cantidad: 50,
        costo: 2500,
      },
      {
        id: 3,
        emoji: "🧀",
        nombre: "Queso Campesino",
        cantidad: 20,
        costo: 12000,
      },
    ];
  } else {
    // Por defecto (Tienda / Retail / Servicios)
    inventarioData = [
      {
        id: 1,
        emoji: "📦",
        nombre: "Producto Base A",
        cantidad: 30,
        costo: 10000,
      },
      {
        id: 2,
        emoji: "🏷️",
        nombre: "Kit de Mercancía B",
        cantidad: 15,
        costo: 45000,
      },
      {
        id: 3,
        emoji: "⚡",
        nombre: "Accesorio Estándar",
        cantidad: 50,
        costo: 8000,
      },
    ];
  }

  // Ocultar Onboarding y mostrar el Dashboard con animación
  gsap.to("#onboarding-panel", {
    opacity: 0,
    scale: 0.9,
    duration: 0.3,
    onComplete: () => {
      document.getElementById("onboarding-panel").style.display = "none";
      const invDash = document.getElementById("inventory-dashboard");
      invDash.style.display = "block";
      gsap.from(invDash, { opacity: 0, y: 20, duration: 0.4 });

      // Renderizar la información en pantalla
      renderizarInventario();
    },
  });
}

// Función para pintar las tarjetas y la tabla en el HTML
function renderizarInventario() {
  const gridCards = document.getElementById("inventory-cards-grid");
  const tableBody = document.getElementById("inventory-table-body");

  gridCards.innerHTML = "";
  tableBody.innerHTML = "";

  inventarioData.forEach((prod) => {
    let totalStock = prod.cantidad * prod.costo;

    // 1. Crear Tarjeta Visual
    gridCards.innerHTML += `
            <div style="background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 15px; border-left: 5px solid #e91e63;">
                <div style="font-size: 2.5rem; background: #fce4ec; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 16px;">
                    ${prod.emoji}
                </div>
                <div style="flex: 1;">
                    <h5 style="margin: 0 0 4px 0; color: #333; font-size: 1rem;">${prod.nombre}</h5>
                    <span style="color: #e91e63; font-weight: 800; font-size: 1.1rem;">Stock: ${prod.cantidad}</span>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button onclick="cambiarCantidad(${prod.id}, -1)" style="background: #f5f5f5; border: none; width: 28px; height: 28px; border-radius: 50%; font-weight: bold; cursor: pointer;">-</button>
                        <button onclick="cambiarCantidad(${prod.id}, 1)" style="background: #fce4ec; color: #e91e63; border: none; width: 28px; height: 28px; border-radius: 50%; font-weight: bold; cursor: pointer;">+</button>
                    </div>
                </div>
            </div>
        `;

    // 2. Crear Fila de la Tabla
    tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: 600; color: #444;">${prod.emoji} ${prod.nombre}</td>
                <td style="padding: 12px; font-weight: bold; color: #e91e63;">${prod.cantidad} unids.</td>
                <td style="padding: 12px; color: #666;">$${prod.costo.toLocaleString()}</td>
                <td style="padding: 12px; font-weight: bold; color: #2e7d32;">$${totalStock.toLocaleString()}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="eliminarProducto(${prod.id})" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `;
  });
}

// Función para sumar o restar cantidades rápidamente desde las tarjetas
function cambiarCantidad(id, cambio) {
  const producto = inventarioData.find((p) => p.id === id);
  if (producto) {
    producto.cantidad += cambio;
    if (producto.cantidad < 0) producto.cantidad = 0;
    renderizarInventario();
  }
}

// Función interactiva para agregar un nuevo producto usando SweetAlert2
function abrirModalProducto() {
  Swal.fire({
    title: "Agregar Nuevo Producto",
    html: `
            <input type="text" id="swal-emoji" class="swal2-input" placeholder="Emoji (Ej: 📱)">
            <input type="text" id="swal-nombre" class="swal2-input" placeholder="Nombre del producto">
            <input type="number" id="swal-cantidad" class="swal2-input" placeholder="Cantidad inicial">
            <input type="number" id="swal-costo" class="swal2-input" placeholder="Costo unitario ($)">
        `,
    confirmButtonText: "Guardar Producto",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const emoji = document.getElementById("swal-emoji").value || "📦";
      const nombre = document.getElementById("swal-nombre").value;
      const cantidad = parseInt(document.getElementById("swal-cantidad").value);
      const costo = parseFloat(document.getElementById("swal-costo").value);

      if (!nombre || isNaN(cantidad) || isNaN(costo)) {
        Swal.showValidationMessage(
          "Por favor completa todos los campos correctamente.",
        );
      }
      return { emoji, nombre, cantidad, costo };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const nuevo = {
        id: Date.now(),
        emoji: result.value.emoji,
        nombre: result.value.nombre,
        cantidad: result.value.cantidad,
        costo: result.value.costo,
      };
      inventarioData.push(nuevo);
      renderizarInventario();
      Swal.fire({
        icon: "success",
        title: "¡Producto añadido!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  });
}

// Función para eliminar un producto de la lista
function eliminarProducto(id) {
  inventarioData = inventarioData.filter((p) => p.id !== id);
  renderizarInventario();
}

function iniciarInventario() {
  const nombreNegocio = document.getElementById("business-name").value;
  const tipoNegocio = document.getElementById("business-type").value;

  if (nombreNegocio.trim() === "") {
    Swal.fire({
      icon: "warning",
      title: "¡Espera!",
      text: "Por favor, ingresa el nombre de tu emprendimiento.",
      confirmButtonColor: "#e91e63",
    });
    return;
  }

  // Guardar datos en la cabecera superior
  document.getElementById("display-business-name").innerText = nombreNegocio;

  let nombreSectorText = "Comercio / Retail";
  if (tipoNegocio === "agro") {
    nombreSectorText = "Agro-tecnología";
    inventarioData = [
      {
        id: 1,
        emoji: "🌱",
        nombre: "Fertilizante Orgánico",
        cantidad: 45,
        costo: 25000,
      },
      {
        id: 2,
        emoji: "🌽",
        nombre: "Semillas de Maíz",
        cantidad: 120,
        costo: 15000,
      },
      {
        id: 3,
        emoji: "💧",
        nombre: "Sistema de Riego",
        cantidad: 8,
        costo: 180000,
      },
    ];
  } else if (tipoNegocio === "comida") {
    nombreSectorText = "Restaurante / Alimentos";
    inventarioData = [
      {
        id: 1,
        emoji: "🥑",
        nombre: "Aguacates Hass",
        cantidad: 60,
        costo: 3000,
      },
      {
        id: 2,
        emoji: "🍅",
        nombre: "Tomate Chonto",
        cantidad: 50,
        costo: 2500,
      },
      {
        id: 3,
        emoji: "🧀",
        nombre: "Queso Campesino",
        cantidad: 20,
        costo: 12000,
      },
    ];
  } else if (tipoNegocio === "servicios") {
    nombreSectorText = "Servicios / Consultoría";
    inventarioData = [
      {
        id: 1,
        emoji: "💻",
        nombre: "Horas de Asesoría",
        cantidad: 10,
        costo: 50000,
      },
      {
        id: 2,
        emoji: "📑",
        nombre: "Plantillas Digitales",
        cantidad: 25,
        costo: 20000,
      },
    ];
  } else {
    inventarioData = [
      {
        id: 1,
        emoji: "📦",
        nombre: "Producto Base A",
        cantidad: 30,
        costo: 10000,
      },
      {
        id: 2,
        emoji: "🏷️",
        nombre: "Kit de Mercancía B",
        cantidad: 15,
        costo: 45000,
      },
    ];
  }

  document.getElementById("display-business-sector").innerText =
    nombreSectorText;

  // Transición suave
  gsap.to("#onboarding-panel", {
    opacity: 0,
    scale: 0.9,
    duration: 0.3,
    onComplete: () => {
      document.getElementById("onboarding-panel").style.display = "none";
      const invDash = document.getElementById("inventory-dashboard");
      invDash.style.display = "block";
      gsap.from(invDash, { opacity: 0, y: 15, duration: 0.4 });
      renderizarInventario();
    },
  });
}

function renderizarInventario() {
  const gridCards = document.getElementById("inventory-cards-grid");
  const tableBody = document.getElementById("inventory-table-body");

  gridCards.innerHTML = "";
  tableBody.innerHTML = "";

  let valorTotalGlobal = 0;

  inventarioData.forEach((prod) => {
    let totalStock = prod.cantidad * prod.costo;
    valorTotalGlobal += totalStock;

    // Tarjeta visual
    gridCards.innerHTML += `
            <div style="background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 15px; border-left: 5px solid #e91e63;">
                <div style="font-size: 2.5rem; background: #fce4ec; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 16px;">
                    ${prod.emoji}
                </div>
                <div style="flex: 1;">
                    <h5 style="margin: 0 0 4px 0; color: #333; font-size: 1rem;">${prod.nombre}</h5>
                    <span style="color: #e91e63; font-weight: 800; font-size: 1.1rem;">Stock: ${prod.cantidad}</span>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button onclick="cambiarCantidad(${prod.id}, -1)" style="background: #f5f5f5; border: none; width: 28px; height: 28px; border-radius: 50%; font-weight: bold; cursor: pointer;">-</button>
                        <button onclick="cambiarCantidad(${prod.id}, 1)" style="background: #fce4ec; color: #e91e63; border: none; width: 28px; height: 28px; border-radius: 50%; font-weight: bold; cursor: pointer;">+</button>
                    </div>
                </div>
            </div>
        `;

    // Fila de tabla
    tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: 600; color: #444;">${prod.emoji} ${prod.nombre}</td>
                <td style="padding: 12px; font-weight: bold; color: #e91e63;">${prod.cantidad} unids.</td>
                <td style="padding: 12px; color: #666;">$${prod.costo.toLocaleString()}</td>
                <td style="padding: 12px; font-weight: bold; color: #2e7d32;">$${totalStock.toLocaleString()}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="eliminarProducto(${prod.id})" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `;
  });

  // Actualizar el valor total en la tarjeta superior
  document.getElementById("total-inventory-value").innerText =
    `$${valorTotalGlobal.toLocaleString()}`;
}
function renderizarInventario() {
  const gridCards = document.getElementById("inventory-cards-grid");
  const tableBody = document.getElementById("inventory-table-body");

  gridCards.innerHTML = "";
  tableBody.innerHTML = "";

  let valorTotalGlobal = 0;
  let unidadesTotalesGlobal = 0;

  inventarioData.forEach((prod) => {
    let totalStock = prod.cantidad * prod.costo;
    valorTotalGlobal += totalStock;
    unidadesTotalesGlobal += prod.cantidad;

    // Tarjeta visual de producto
    gridCards.innerHTML += `
            <div style="background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 15px; border-left: 5px solid #e91e63;">
                <div style="font-size: 2.5rem; background: #fce4ec; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 16px;">
                    ${prod.emoji}
                </div>
                <div style="flex: 1;">
                    <h5 style="margin: 0 0 4px 0; color: #333; font-size: 1rem;">${prod.nombre}</h5>
                    <span style="color: #e91e63; font-weight: 800; font-size: 1.1rem;">Stock: ${prod.cantidad}</span>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button onclick="cambiarCantidad(${prod.id}, -1)" style="background: #f5f5f5; border: none; width: 28px; height: 28px; border-radius: 50%; font-weight: bold; cursor: pointer;">-</button>
                        <button onclick="cambiarCantidad(${prod.id}, 1)" style="background: #fce4ec; color: #e91e63; border: none; width: 28px; height: 28px; border-radius: 50%; font-weight: bold; cursor: pointer;">+</button>
                    </div>
                </div>
            </div>
        `;

    // Fila de la tabla
    tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: 600; color: #444;">${prod.emoji} ${prod.nombre}</td>
                <td style="padding: 12px; font-weight: bold; color: #e91e63;">${prod.cantidad} unids.</td>
                <td style="padding: 12px; color: #666;">$${prod.costo.toLocaleString()}</td>
                <td style="padding: 12px; font-weight: bold; color: #2e7d32;">$${totalStock.toLocaleString()}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="eliminarProducto(${prod.id})" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `;
  });

  // Actualizar contadores en las tarjetas superiores de métricas
  document.getElementById("total-inventory-value").innerText =
    `$${valorTotalGlobal.toLocaleString()}`;
  document.getElementById("total-units-count").innerText =
    `${unidadesTotalesGlobal} unids.`;
  document.getElementById("total-items-count").innerText =
    `${inventarioData.length} productos`;
}
// --- BASE DE DATOS DE FINANZAS EMPRESA ---

// Función para renderizar el módulo de empresa
function renderizarFinanzasEmpresa() {
  const tableBody = document.getElementById("empresa-table-body");
  tableBody.innerHTML = "";

  let totalIngresos = 0;
  let totalGastos = 0;

  transaccionesEmpresa.forEach((t) => {
    if (t.tipo === "ingreso") {
      totalIngresos += t.monto;
    } else {
      totalGastos += t.monto;
    }

    let badgeColor = t.tipo === "ingreso" ? "#2e7d32" : "#c62828";
    let signoMonto = t.tipo === "ingreso" ? "+" : "-";

    tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: 700; color: ${badgeColor}; text-transform: uppercase; font-size: 0.85rem;">${t.tipo}</td>
                <td style="padding: 12px; font-weight: 600; color: #444;">${t.desc}</td>
                <td style="padding: 12px; color: #666;">${t.categoria}</td>
                <td style="padding: 12px; font-weight: bold; color: ${badgeColor};">${signoMonto}$${t.monto.toLocaleString()}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="eliminarTransaccionEmpresa(${t.id})" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `;
  });

  let utilidadNeta = totalIngresos - totalGastos;

  // Actualizar tarjetas de métricas
  document.getElementById("empresa-ingresos").innerText =
    `$${totalIngresos.toLocaleString()}`;
  document.getElementById("empresa-gastos").innerText =
    `$${totalGastos.toLocaleString()}`;

  const utilElem = document.getElementById("empresa-utilidad");
  utilElem.innerText = `$${utilidadNeta.toLocaleString()}`;
  utilElem.style.color = utilidadNeta >= 0 ? "#1565c0" : "#c62828";

  // Consejo dinámico de Dante y Federico
  actualizarConsejoAsistentes(totalIngresos, totalGastos, utilidadNeta);
}

// Función de consejería de los perros Dante y Federico
function actualizarConsejoAsistentes(ingresos, gastos, utilidad) {
  const cajaConsejo = document.getElementById("asistentes-consejo-empresa");
  if (!cajaConsejo) return;

  if (ingresos === 0 && gastos === 0) {
    cajaConsejo.innerHTML =
      "¡Guau! Soy Dante y él es Federico. Aún no hay movimientos registrados. ¡Usa el botón superior para agregar tu primera venta o gasto! 🐾";
  } else if (utilidad > 0) {
    cajaConsejo.innerHTML = `¡Guau, excelente trabajo! <strong>Dante</strong> (el perro blanco) está feliz con tus ventas, y <strong>Federico</strong> (el perro café) dice que vas por buen camino con una utilidad neta de <strong>$${utilidad.toLocaleString()}</strong>. ¡Sigue así! 🦴✨`;
  } else {
    cajaConsejo.innerHTML = `¡Atención! <strong>Federico</strong> (el perro café) está preocupado porque los gastos superan a los ingresos. <strong>Dante</strong> te recomienda enfocar esfuerzos en aumentar las ventas para equilibrar la caja. 🐕‍🦺📉`;
  }
}

// Modal interactivo para registrar movimientos empresariales
function abrirModalTransaccionEmpresa() {
  Swal.fire({
    title: "Registrar Movimiento Empresa",
    html: `
            <select id="swal-tipo" class="swal2-input" style="width: 80%;">
                <option value="ingreso">🟢 Ingreso (Venta / Entrada)</option>
                <option value="gasto">🔴 Gasto (Costo / Operativo)</option>
            </select>
            <input type="text" id="swal-desc" class="swal2-input" placeholder="Descripción (Ej: Venta de producto)">
            <input type="text" id="swal-cat" class="swal2-input" placeholder="Categoría (Ej: Ventas, Arriendo, Insumos)">
            <input type="number" id="swal-monto" class="swal2-input" placeholder="Monto total ($)">
        `,
    confirmButtonText: "Guardar Movimiento",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const tipo = document.getElementById("swal-tipo").value;
      const desc = document.getElementById("swal-desc").value;
      const categoria = document.getElementById("swal-cat").value || "General";
      const monto = parseFloat(document.getElementById("swal-monto").value);

      if (!desc || isNaN(monto) || monto <= 0) {
        Swal.showValidationMessage(
          "Por favor completa una descripción y un monto válido.",
        );
      }
      return { tipo, desc, categoria, monto };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const nuevaTransaccion = {
        id: Date.now(),
        tipo: result.value.tipo,
        desc: result.value.desc,
        categoria: result.value.categoria,
        monto: result.value.monto,
      };
      transaccionesEmpresa.push(nuevaTransaccion);
      renderizarFinanzasEmpresa();
      Swal.fire({
        icon: "success",
        title: "¡Movimiento registrado!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  });
}

// Eliminar movimiento
function eliminarTransaccionEmpresa(id) {
  transaccionesEmpresa = transaccionesEmpresa.filter((t) => t.id !== id);
  renderizarFinanzasEmpresa();
}

// Función principal para renderizar el módulo y actualizar gráficos y consejeros
function renderizarFinanzasEmpresa() {
  const tableBody = document.getElementById("empresa-table-body");
  tableBody.innerHTML = "";

  let totalIngresos = 0;
  let totalGastos = 0;

  transaccionesEmpresa.forEach((t) => {
    if (t.tipo === "ingreso") {
      totalIngresos += t.monto;
    } else {
      totalGastos += t.monto;
    }

    let badgeColor = t.tipo === "ingreso" ? "#2e7d32" : "#c62828";
    let signoMonto = t.tipo === "ingreso" ? "+" : "-";

    tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: 700; color: ${badgeColor}; text-transform: uppercase; font-size: 0.85rem;">${t.tipo}</td>
                <td style="padding: 12px; font-weight: 600; color: #444;">${t.desc}</td>
                <td style="padding: 12px; color: #666;">${t.categoria}</td>
                <td style="padding: 12px; font-weight: bold; color: ${badgeColor};">${signoMonto}$${t.monto.toLocaleString()}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="eliminarTransaccionEmpresa(${t.id})" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `;
  });

  let utilidadNeta = totalIngresos - totalGastos;

  // Actualizar tarjetas numéricas
  document.getElementById("empresa-ingresos").innerText =
    `$${totalIngresos.toLocaleString()}`;
  document.getElementById("empresa-gastos").innerText =
    `$${totalGastos.toLocaleString()}`;

  const utilElem = document.getElementById("empresa-utilidad");
  utilElem.innerText = `$${utilidadNeta.toLocaleString()}`;
  utilElem.style.color = utilidadNeta >= 0 ? "#1565c0" : "#c62828";

  // Actualizar mensajes dinámicos de Dante y Federico
  actualizarConsejosDanteYFederico(totalIngresos, totalGastos, utilidadNeta);

  // Renderizar o actualizar el gráfico animado
  actualizarGraficoEmpresa(totalIngresos, totalGastos, utilidadNeta);
}

// Consejos especializados de Dante (Lobo) y Federico (Perro Café)
function actualizarConsejosDanteYFederico(ingresos, gastos, utilidad) {
  const danteText = document.getElementById("dante-consejo");
  const federicoText = document.getElementById("federico-consejo");
  if (!danteText || !federicoText) return;

  if (ingresos === 0 && gastos === 0) {
    danteText.innerText =
      "¡Aúlla! Registra tus ventas para planear estrategias de crecimiento.";
    federicoText.innerText =
      "Mantén el control de cada peso invertido en costos operativos.";
    return;
  }

  if (utilidad > 0) {
    danteText.innerText = `¡Excelente! Tenemos un margen positivo. Es momento de reinvertir en stock. 🐺✨`;
    federicoText.innerText = `Control firme: Los gastos están cubiertos y hay ganancia neta. ¡Buen trabajo! 🐕`;
  } else {
    danteText.innerText = `¡Cuidado! Las ventas están bajas frente al volumen de operación. 🐺📉`;
    federicoText.innerText = `Alerta de caja: Los gastos superan los ingresos. Debemos recortar costos de inmediato. 🐕⚠️`;
  }
}

// Función para crear/actualizar el gráfico animado con Chart.js
function actualizarGraficoEmpresa(ingresos, gastos, utilidad) {
  const ctx = document.getElementById("graficoEmpresa");
  if (!ctx) return;

  if (miGraficoEmpresa) {
    miGraficoEmpresa.data.datasets[0].data = [
      ingresos,
      gastos,
      Math.max(utilidad, 0),
    ];
    miGraficoEmpresa.update();
    return;
  }

  miGraficoEmpresa = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Ingresos", "Gastos", "Utilidad Neta"],
      datasets: [
        {
          data: [ingresos, gastos, Math.max(utilidad, 0)],
          backgroundColor: ["#2e7d32", "#c62828", "#1565c0"],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            font: { size: 11, family: "sans-serif", weight: "bold" },
          },
        },
      },
      animation: {
        animateScale: true,
        animateRotate: true,
      },
    },
  });
}
let transaccionesEmpresa = [
  {
    id: 1,
    tipo: "ingreso",
    desc: "Venta inicial de mercancía",
    categoria: "Ventas",
    monto: 350000,
    aplicaIva: true,
  },
  {
    id: 2,
    tipo: "gasto",
    desc: "Compra de materia prima / insumos",
    categoria: "Inventario",
    monto: 120000,
    aplicaIva: false,
  },
];

let miGraficoEmpresa = null;

// Renderizar módulo financiero completo
function renderizarFinanzasEmpresa() {
  const tableBody = document.getElementById("empresa-table-body");
  tableBody.innerHTML = "";

  let totalIngresos = 0;
  let totalIva = 0;
  let totalGastos = 0;

  transaccionesEmpresa.forEach((t) => {
    let ivaMonto = t.aplicaIva ? t.monto * 0.19 : 0;

    if (t.tipo === "ingreso") {
      totalIngresos += t.monto;
      totalIva += ivaMonto;
    } else {
      totalGastos += t.monto;
    }

    let badgeColor = t.tipo === "ingreso" ? "#2e7d32" : "#c62828";
    let signoMonto = t.tipo === "ingreso" ? "+" : "-";

    tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: 700; color: ${badgeColor}; text-transform: uppercase; font-size: 0.85rem;">${t.tipo}</td>
                <td style="padding: 12px; font-weight: 600; color: #444;">${t.desc}</td>
                <td style="padding: 12px; color: #666;">${t.categoria}</td>
                <td style="padding: 12px; font-weight: bold; color: ${badgeColor};">${signoMonto}$${t.monto.toLocaleString()}</td>
                <td style="padding: 12px; color: #6a1b9a;">${t.aplicaIva ? "$" + ivaMonto.toLocaleString() : "N/A"}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="eliminarTransaccionEmpresa(${t.id})" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `;
  });

  let utilidadNeta = totalIngresos - totalGastos;

  // Actualizar tarjetas de métricas
  document.getElementById("empresa-ingresos").innerText =
    `$${totalIngresos.toLocaleString()}`;
  document.getElementById("empresa-iva").innerText =
    `$${totalIva.toLocaleString()}`;
  document.getElementById("empresa-gastos").innerText =
    `$${totalGastos.toLocaleString()}`;

  const utilElem = document.getElementById("empresa-utilidad");
  utilElem.innerText = `$${utilidadNeta.toLocaleString()}`;
  utilElem.style.color = utilidadNeta >= 0 ? "#1565c0" : "#c62828";

  // Evaluar Alertas KPI Inteligentes
  evaluarAlertasKPI(totalIngresos, totalGastos, utilidadNeta);

  // Actualizar Dante y Federico
  actualizarConsejosDanteYFederico(totalIngresos, totalGastos, utilidadNeta);

  // Actualizar Gráfico
  actualizarGraficoEmpresa(totalIngresos, totalGastos, utilidadNeta);

  // Resetear o actualizar simulador
  simularEscenarios();
}

// 1. Panel de Alertas Inteligentes (KPI Net)
function evaluarAlertasKPI(ingresos, gastos, utilidad) {
  const box = document.getElementById("kpi-alert-box");
  const text = document.getElementById("kpi-alert-text");
  if (!box || !text) return;

  let margen = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;

  if (ingresos === 0 && gastos === 0) {
    box.style.background = "#e3f2fd";
    box.style.borderColor = "#1565c0";
    text.innerHTML =
      "<strong>Salud Inicial:</strong> Registra transacciones para activar las auditorías de rendimiento automatizadas.";
  } else if (margen >= 30) {
    box.style.background = "#e8f5e9";
    box.style.borderColor = "#2e7d32";
    text.innerHTML = `<strong>¡Excelente Margen (${margen.toFixed(1)}%)!</strong> Tu rentabilidad operativa es sólida y tienes espacio para expansión.`;
  } else if (margen > 0) {
    box.style.background = "#fff3e0";
    box.style.borderColor = "#ef6c00";
    text.innerHTML = `<strong>Margen Moderado (${margen.toFixed(1)}%):</strong> Cuidado con los costos operativos; intenta optimizar suministros.`;
  } else {
    box.style.background = "#ffebee";
    box.style.borderColor = "#c62828";
    text.innerHTML = `<strong>¡Alerta Roja de Liquidez!</strong> Los gastos operativos superan los ingresos netos. Se requiere corrección inmediata.`;
  }
}

// 2. Simulador de Escenarios en Tiempo Real
function simularEscenarios() {
  const sliderVentas = document.getElementById("slider-ventas");
  const sliderCostos = document.getElementById("slider-costos");
  const resSimulacion = document.getElementById("simulacion-resultado");
  if (!sliderVentas || !sliderCostos || !resSimulacion) return;

  document.getElementById("slider-ventas-val").innerText =
    `${sliderVentas.value}%`;
  document.getElementById("slider-costos-val").innerText =
    `${sliderCostos.value}%`;

  let totalIngresos = transaccionesEmpresa
    .filter((t) => t.tipo === "ingreso")
    .reduce((acc, t) => acc + t.monto, 0);
  let totalGastos = transaccionesEmpresa
    .filter((t) => t.tipo === "gasto")
    .reduce((acc, t) => acc + t.monto, 0);

  let ingresosSim = totalIngresos * (1 + parseFloat(sliderVentas.value) / 100);
  let gastosSim = totalGastos * (1 + parseFloat(sliderCostos.value) / 100);
  let utilidadSim = ingresosSim - gastosSim;

  resSimulacion.innerText = `$${utilidadSim.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  resSimulacion.style.color = utilidadSim >= 0 ? "#2e7d32" : "#c62828";
}

// 3. Modal con opción de IVA al registrar movimiento
function abrirModalTransaccionEmpresa() {
  Swal.fire({
    title: "Registrar Movimiento Empresa",
    html: `
            <select id="swal-tipo" class="swal2-input" style="width: 80%;">
                <option value="ingreso">🟢 Ingreso (Venta / Entrada)</option>
                <option value="gasto">🔴 Gasto (Costo / Operativo)</option>
            </select>
            <input type="text" id="swal-desc" class="swal2-input" placeholder="Descripción (Ej: Venta de producto)">
            <input type="text" id="swal-cat" class="swal2-input" placeholder="Categoría (Ej: Ventas, Arriendo, Insumos)">
            <input type="number" id="swal-monto" class="swal2-input" placeholder="Monto base ($)">
            <div style="margin-top: 10px; text-align: left; padding-left: 10%;">
                <label style="font-size: 0.9rem; color: #444; cursor: pointer;">
                    <input type="checkbox" id="swal-iva" checked> ¿Aplica IVA (19%)?
                </label>
            </div>
        `,
    confirmButtonText: "Guardar Movimiento",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const tipo = document.getElementById("swal-tipo").value;
      const desc = document.getElementById("swal-desc").value;
      const categoria = document.getElementById("swal-cat").value || "General";
      const monto = parseFloat(document.getElementById("swal-monto").value);
      const aplicaIva = document.getElementById("swal-iva").checked;

      if (!desc || isNaN(monto) || monto <= 0) {
        Swal.showValidationMessage(
          "Por favor completa una descripción y un monto válido.",
        );
      }
      return { tipo, desc, categoria, monto, aplicaIva };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const nuevaTransaccion = {
        id: Date.now(),
        tipo: result.value.tipo,
        desc: result.value.desc,
        categoria: result.value.categoria,
        monto: result.value.monto,
        aplicaIva: result.value.aplicaIva,
      };
      transaccionesEmpresa.push(nuevaTransaccion);
      renderizarFinanzasEmpresa();
      Swal.fire({
        icon: "success",
        title: "¡Movimiento registrado con éxito!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  });
}

// --- GENERADOR DE REPORTE EJECUTIVO (VERSIÓN BLINDADA DE UNA SOLA PÁGINA) ---
function generarReporteEjecutivo() {
  let totalIngresos = transaccionesEmpresa
    .filter((t) => t.tipo === "ingreso")
    .reduce((acc, t) => acc + t.monto, 0);
  let totalGastos = transaccionesEmpresa
    .filter((t) => t.tipo === "gasto")
    .reduce((acc, t) => acc + t.monto, 0);
  let totalIva = transaccionesEmpresa
    .filter((t) => t.tipo === "ingreso" && t.aplicaIva)
    .reduce((acc, t) => acc + t.monto * 0.19, 0);
  let utilidad = totalIngresos - totalGastos;
  let fechaActual = new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let nombreNegocioElem = document.getElementById("display-business-name");
  let nombreNegocio = nombreNegocioElem
    ? nombreNegocioElem.innerText
    : "Mi Emprendimiento";

  // Creamos la ventana emergente de forma segura
  let ventanaReporte = window.open("", "_blank");
  if (!ventanaReporte) {
    alert("Por favor permite las ventanas emergentes para ver el reporte.");
    return;
  }

  // Estructura HTML limpia y autocontenida diseñada estrictamente para 1 sola hoja carta
  let contenidoHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Reporte Gerencial - ${nombreNegocio}</title>
            <style>
                @page {
                    size: letter;
                    margin: 12mm;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #ffffff;
                    color: #333333;
                    margin: 0;
                    padding: 10px;
                }
                .report-wrapper {
                    max-width: 750px;
                    margin: 0 auto;
                    border-top: 5px solid #880e4f;
                    padding-top: 15px;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #fce4ec;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                .header h2 {
                    color: #880e4f;
                    font-size: 1.3rem;
                    margin: 0 0 3px 0;
                }
                .header p {
                    color: #666;
                    font-size: 0.75rem;
                    margin: 0;
                }
                .badge {
                    background: #fce4ec;
                    color: #880e4f;
                    padding: 4px 10px;
                    border-radius: 15px;
                    font-size: 0.65rem;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-bottom: 12px;
                }
                .metric-card {
                    background: #fafafa;
                    border-radius: 8px;
                    padding: 10px;
                    border-left: 4px solid #880e4f;
                }
                .metric-card.green { border-left-color: #2e7d32; }
                .metric-card.purple { border-left-color: #6a1b9a; }
                .metric-card.red { border-left-color: #c62828; }
                
                .metric-card span {
                    font-size: 0.6rem;
                    color: #666;
                    font-weight: 700;
                    display: block;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }
                .metric-card strong {
                    font-size: 1rem;
                    color: #222;
                }
                .utilidad-box {
                    background: #f0f7ff;
                    border-radius: 8px;
                    padding: 10px;
                    border-left: 4px solid #1565c0;
                    text-align: center;
                    margin-bottom: 15px;
                }
                h3 {
                    color: #880e4f;
                    font-size: 0.95rem;
                    margin-top: 15px;
                    margin-bottom: 8px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 4px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.75rem;
                    margin-bottom: 15px;
                }
                th, td {
                    padding: 6px 8px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                th {
                    background-color: #fdf2f8;
                    color: #880e4f;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 0.65rem;
                }
                .footer {
                    margin-top: 15px;
                    text-align: center;
                    font-size: 0.7rem;
                    color: #666;
                    border-top: 1px solid #eee;
                    padding-top: 8px;
                }
                .actions-bar {
                    margin-top: 20px;
                    text-align: center;
                }
                .btn-print {
                    background: #880e4f;
                    color: white;
                    border: none;
                    padding: 10px 25px;
                    border-radius: 20px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 0.85rem;
                    box-shadow: 0 4px 15px rgba(136,14,79,0.3);
                }
                @media print {
                    .actions-bar { display: none; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="report-wrapper">
                <div class="header">
                    <div>
                        <h2>Reporte Gerencial: ${nombreNegocio}</h2>
                        <p>Análisis Financiero, Flujo de Caja y Auditoría Fiscal</p>
                    </div>
                    <span class="badge">Oficial 🐾</span>
                </div>

                <p style="color: #555; font-size: 0.8rem; margin-bottom: 12px;">
                    <strong>Fecha:</strong> ${fechaActual} | <strong>Emitido por:</strong> Dante & Federico (Consejo Directivo)
                </p>

                <div class="metrics-grid">
                    <div class="metric-card green">
                        <span>Ingresos Netos</span>
                        <strong style="color: #2e7d32;">$${totalIngresos.toLocaleString()}</strong>
                    </div>
                    <div class="metric-card purple">
                        <span>IVA (19%)</span>
                        <strong style="color: #6a1b9a;">$${totalIva.toLocaleString()}</strong>
                    </div>
                    <div class="metric-card red">
                        <span>Gastos Operativos</span>
                        <strong style="color: #c62828;">$${totalGastos.toLocaleString()}</strong>
                    </div>
                </div>

                <div class="utilidad-box">
                    <span style="font-size: 0.7rem; color: #1565c0; font-weight: 700; display: block; margin-bottom: 2px;">Utilidad Neta (Ganancia Real)</span>
                    <strong style="font-size: 1.2rem; color: #1565c0;">$${utilidad.toLocaleString()}</strong>
                </div>

                <h3>Historial Detallado de Operaciones</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                            <th>Monto Base</th>
                            <th>IVA (19%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transaccionesEmpresa
                          .map((t) => {
                            let ivaCalc = t.aplicaIva ? t.monto * 0.19 : 0;
                            let colorTipo =
                              t.tipo === "ingreso" ? "#2e7d32" : "#c62828";
                            return `
                                <tr>
                                    <td style="font-weight: bold; color: ${colorTipo}; text-transform: uppercase;">${t.tipo}</td>
                                    <td>${t.desc}</td>
                                    <td>${t.categoria}</td>
                                    <td style="font-weight: bold;">$${t.monto.toLocaleString()}</td>
                                    <td style="color: #6a1b9a;">${t.aplicaIva ? "$" + ivaCalc.toLocaleString() : "N/A"}</td>
                                </tr>
                            `;
                          })
                          .join("")}
                    </tbody>
                </table>

                <div class="footer">
                    <p>💡 <em>Consejo Directivo:</em> Mantén este reporte actualizado para auditorías de inversión y crecimiento escalable.</p>
                </div>

                <div class="actions-bar">
                    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en una sola página (PDF)</button>
                </div>
            </div>
        </body>
        </html>
    `;

  // Inyectar el HTML de forma segura asegurando la carga completa
  ventanaReporte.document.open();
  ventanaReporte.document.write(contenidoHTML);
  ventanaReporte.document.close();
}

// Consejos de Dante y Federico
function actualizarConsejosDanteYFederico(ingresos, gastos, utilidad) {
  const danteText = document.getElementById("dante-consejo");
  const federicoText = document.getElementById("federico-consejo");
  if (!danteText || !federicoText) return;

  if (ingresos === 0 && gastos === 0) {
    danteText.innerText =
      "¡Aúlla! Registra tus ventas para planear estrategias de crecimiento.";
    federicoText.innerText =
      "Mantén el control de cada peso invertido en costos operativos.";
    return;
  }

  if (utilidad > 0) {
    danteText.innerText = `¡Excelente! Margen corporativo saludable. Es hora de expandir mercado. 🐺✨`;
    federicoText.innerText = `Control de caja perfecto: Los gastos están controlados frente a las entradas. 🐕`;
  } else {
    danteText.innerText = `¡Cuidado! Las ventas deben acelerarse para superar los costos fijos. 🐺📉`;
    federicoText.innerText = `Alerta de gastos: Debemos recortar operaciones no esenciales de inmediato. 🐕⚠️`;
  }
}

// Gráfico con Chart.js
function actualizarGraficoEmpresa(ingresos, gastos, utilidad) {
  const ctx = document.getElementById("graficoEmpresa");
  if (!ctx) return;

  if (miGraficoEmpresa) {
    miGraficoEmpresa.data.datasets[0].data = [
      ingresos,
      gastos,
      Math.max(utilidad, 0),
    ];
    miGraficoEmpresa.update();
    return;
  }

  miGraficoEmpresa = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Ingresos", "Gastos", "Utilidad Neta"],
      datasets: [
        {
          data: [ingresos, gastos, Math.max(utilidad, 0)],
          backgroundColor: ["#2e7d32", "#c62828", "#1565c0"],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, font: { size: 11, weight: "bold" } },
        },
      },
    },
  });
}

// --- BASE DE DATOS LOCAL DE FACTURACIÓN ELECTRÓNICA ---
let listaFacturas = [
  {
    id: 1,
    nro: "FE-1001",
    cliente: "Juan Camilo Romero",
    nitCliente: "1070000000",
    fecha: "2026-08-22",
    producto: "Fertilizante Orgánico x 5kg",
    cantidad: 2,
    precioUnitario: 50000,
    aplicaIva: true,
  },
];

// Renderizar tabla de facturas
function renderizarFacturas() {
  const tbody = document.getElementById("facturas-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  listaFacturas.forEach((f) => {
    let subtotal = f.cantidad * f.precioUnitario;
    let iva = f.aplicaIva ? subtotal * 0.19 : 0;
    let total = subtotal + iva;

    tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #880e4f;">${f.nro}</td>
                <td style="padding: 12px; font-weight: 600; color: #444;">${f.cliente} <br><span style="font-size: 0.8rem; color: #777;">NIT/CC: ${f.nitCliente}</span></td>
                <td style="padding: 12px; color: #666;">${f.fecha}</td>
                <td style="padding: 12px; font-weight: bold; color: #2e7d32;">$${total.toLocaleString()}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="generarPDFFactura(${f.id})" style="background: #fce4ec; color: #880e4f; border: none; padding: 6px 12px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 0.85rem;" title="Ver Factura PDF">📄 Ver PDF</button>
                </td>
            </tr>
        `;
  });
}

// Modal para crear nueva factura electrónica
function abrirModalFactura() {
  let siguienteNro = `FE-100${listaFacturas.length + 1}`;

  Swal.fire({
    title: "Generar Factura Electrónica",
    html: `
            <input type="text" id="fac-nro" class="swal2-input" value="${siguienteNro}" placeholder="Número de Factura">
            <input type="text" id="fac-cliente" class="swal2-input" placeholder="Nombre o Razón Social del Cliente">
            <input type="text" id="fac-nit" class="swal2-input" placeholder="NIT o Cédula del Cliente">
            <input type="text" id="fac-prod" class="swal2-input" placeholder="Descripción del producto o servicio">
            <input type="number" id="fac-cant" class="swal2-input" placeholder="Cantidad" value="1">
            <input type="number" id="fac-precio" class="swal2-input" placeholder="Precio unitario ($)">
            <div style="margin-top: 10px; text-align: left; padding-left: 10%;">
                <label style="font-size: 0.9rem; color: #444; cursor: pointer;">
                    <input type="checkbox" id="fac-iva" checked> Aplicar IVA (19%)
                </label>
            </div>
        `,
    confirmButtonText: "Generar y Guardar Factura",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const nro = document.getElementById("fac-nro").value;
      const cliente = document.getElementById("fac-cliente").value;
      const nitCliente = document.getElementById("fac-nit").value;
      const producto = document.getElementById("fac-prod").value;
      const cantidad = parseInt(document.getElementById("fac-cant").value);
      const precioUnitario = parseFloat(
        document.getElementById("fac-precio").value,
      );
      const aplicaIva = document.getElementById("fac-iva").checked;

      if (
        !cliente ||
        !producto ||
        isNaN(precioUnitario) ||
        precioUnitario <= 0
      ) {
        Swal.showValidationMessage(
          "Por favor completa los campos obligatorios correctamente.",
        );
      }
      return {
        nro,
        cliente,
        nitCliente,
        producto,
        cantidad,
        precioUnitario,
        aplicaIva,
      };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const nueva = {
        id: Date.now(),
        nro: result.value.nro,
        cliente: result.value.cliente,
        nitCliente: result.value.nitCliente || "222222222 (Consumidor Final)",
        fecha: new Date().toISOString().split("T")[0],
        producto: result.value.producto,
        cantidad: result.value.cantidad,
        precioUnitario: result.value.precioUnitario,
        aplicaIva: result.value.aplicaIva,
      };
      listaFacturas.push(nueva);
      renderizarFacturas();
      Swal.fire({
        icon: "success",
        title: "¡Factura generada con éxito!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  });
}

function generarPDFFactura(id) {
  let fac = listaFacturas.find((f) => f.id === id);
  if (!fac) return;

  let subtotal = fac.cantidad * fac.precioUnitario;
  let iva = fac.aplicaIva ? subtotal * 0.19 : 0;
  let total = subtotal + iva;
  let cufeSimulado = "a3f5b7c9e1d2f4a6b8c0d2e4f6a8b0c2d4e6f8a0"; // CUFE simulado DIAN

  let nombreNegocioElem = document.getElementById("display-business-name");
  let nombreNegocio = nombreNegocioElem
    ? nombreNegocioElem.innerText
    : "Mi Emprendimiento S.A.S.";

  let contenidoHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Factura Electrónica - ${fac.nro}</title>
            <style>
                @page { size: letter; margin: 12mm; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: #ffffff; color: #333; margin: 0; padding: 15px;
                }
                .invoice-box {
                    max-width: 750px; margin: 0 auto; border: 1px solid #eee; padding: 30px;
                    border-radius: 16px; box-shadow: 0 5px 20px rgba(0,0,0,0.05);
                }
                .top-header { display: flex; justify-content: space-between; border-bottom: 2px solid #880e4f; padding-bottom: 15px; margin-bottom: 20px; }
                .top-header h2 { color: #880e4f; margin: 0; font-size: 1.5rem; }
                .invoice-info { text-align: right; }
                .invoice-info h4 { color: #555; margin: 0 0 5px 0; }
                .client-box { background: #fafafa; padding: 15px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #880e4f; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9rem; }
                th, td { padding: 10px 12px; border-bottom: 1px solid #eee; text-align: left; }
                th { background: #fdf2f8; color: #880e4f; font-weight: bold; }
                .totals-box { display: flex; justify-content: flex-end; margin-bottom: 30px; }
                .totals-table { width: 300px; font-size: 0.9rem; }
                .totals-table td { padding: 6px 10px; border: none; }
                .cufe-box { background: #f8f9fa; border: 1px dashed #ccc; padding: 10px; border-radius: 8px; font-size: 0.75rem; color: #666; word-break: break-all; margin-bottom: 20px; }
                .footer { text-align: center; font-size: 0.75rem; color: #880e4f; border-top: 1px solid #eee; padding-top: 10px; }
                .actions { text-align: center; margin-top: 20px; }
                .btn-print { background: #880e4f; color: white; border: none; padding: 10px 25px; border-radius: 20px; font-weight: bold; cursor: pointer; }
                @media print { .actions { display: none; } body { padding: 0; } .invoice-box { border: none; box-shadow: none; padding: 0; } }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="top-header">
                    <div>
                        <h2>${nombreNegocio}</h2>
                        <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #666;">NIT: 900.123.456-1 | Régimen Común</p>
                        <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: #666;">Facturación Electrónica DIAN</p>
                    </div>
                    <div class="invoice-info">
                        <h3 style="color: #880e4f; margin: 0;">FACTURA ELECTRÓNICA</h3>
                        <h4 style="color: #e91e63; margin: 4px 0;">${fac.nro}</h4>
                        <p style="margin: 0; font-size: 0.8rem; color: #666;">Fecha: ${fac.fecha}</p>
                    </div>
                </div>

                <div class="client-box">
                    <strong style="color: #880e4f; display: block; margin-bottom: 4px;">DATOS DEL ADQUIRENTE (CLIENTE)</strong>
                    <span><strong>Razón Social:</strong> ${fac.cliente}</span><br>
                    <span><strong>NIT / C.C.:</strong> ${fac.nitCliente}</span>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Descripción del Producto / Servicio</th>
                            <th style="text-align: center;">Cantidad</th>
                            <th style="text-align: right;">Precio Unitario</th>
                            <th style="text-align: right;">Total Item</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${fac.producto}</td>
                            <td style="text-align: center;">${fac.cantidad}</td>
                            <td style="text-align: right;">$${fac.precioUnitario.toLocaleString()}</td>
                            <td style="text-align: right; font-weight: bold;">$${subtotal.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="totals-box">
                    <table class="totals-table">
                        <tr>
                            <td><strong>Subtotal:</strong></td>
                            <td style="text-align: right;">$${subtotal.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td><strong>IVA (19%):</strong></td>
                            <td style="text-align: right;">$${iva.toLocaleString()}</td>
                        </tr>
                        <tr style="border-top: 2px solid #880e4f; font-size: 1.1rem; color: #880e4f;">
                            <td><strong>TOTAL PAGAR:</strong></td>
                            <td style="text-align: right; font-weight: bold;">$${total.toLocaleString()}</td>
                        </tr>
                    </table>
                </div>

                <div class="cufe-box">
                    <strong>CUFE (Código Único de Factura Electrónica - DIAN):</strong><br>
                    ${cufeSimulado}
                </div>

                <div class="footer">
                    <p>Esta factura se asimila en sus efectos legal a una letra de cambio (Art. 774 del Código de Comercio). Autoriza DIAN Resolución N° 187600000000</p>
                </div>

                <div class="actions">
                    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar Factura PDF</button>
                </div>
            </div>
        </body>
        </html>
    `;

  // Creamos un Blob seguro que Live Server y cualquier navegador interpretarán sin bloqueos
  let blob = new Blob([contenidoHtml], { type: "text/html" });
  let url = URL.createObjectURL(blob);

  let ventanaFactura = window.open(url, "_blank");
  if (!ventanaFactura) {
    alert("Permite las ventanas emergentes para visualizar la factura.");
  }
}

// Inicializar la tabla de facturas al cargar o cambiar a la pestaña
document.addEventListener("DOMContentLoaded", () => {
  renderizarFacturas();
});

// Función para abrir la vista independiente de Facturación DIAN sin rastro de otros módulos
// Función para abrir la vista independiente de Facturación DIAN
function abrirModuloFacturacionExclusivo() {
  // Ocultar todo el contenedor maestro de la app principal
  const mainApp = document.getElementById("main-app-container");
  if (mainApp) mainApp.style.display = "none";

  // Mostrar exclusivamente la vista independiente de facturación
  const vistaIndependiente = document.getElementById(
    "vista-facturacion-independiente",
  );
  if (vistaIndependiente) {
    vistaIndependiente.style.display = "block";
    renderizarFacturasIndependiente();
  }
}

// Función para regresar al panel principal
function cerrarModuloFacturacionExclusivo() {
  // Ocultar la vista de facturación
  const vistaIndependiente = document.getElementById(
    "vista-facturacion-independiente",
  );
  if (vistaIndependiente) {
    vistaIndependiente.style.display = "none";
  }

  // Volver a mostrar toda la app principal
  const mainApp = document.getElementById("main-app-container");
  if (mainApp) mainApp.style.display = "block";
}

// Función para regresar al panel principal de inventario
function cerrarModuloFacturacionExclusivo() {
  const vistaIndependiente = document.getElementById(
    "vista-facturacion-independiente",
  );
  if (vistaIndependiente) {
    vistaIndependiente.style.display = "none";
  }

  // Restaurar la visualización del inventario principal
  const tabInventario = document.getElementById("tab-inventario");
  if (tabInventario) tabInventario.style.display = "block";
}

// Función para regresar al panel principal
function cerrarModuloFacturacionExclusivo() {
  const vistaIndependiente = document.getElementById(
    "vista-facturacion-independiente",
  );
  if (vistaIndependiente) {
    vistaIndependiente.style.display = "none";
  }
  // Volver a mostrar la pestaña de Inventario por defecto
  const tabInventario = document.getElementById("tab-inventario");
  if (tabInventario) tabInventario.style.display = "block";
}

// Renderizar en la tabla de la vista independiente
function renderizarFacturasIndependiente() {
  const tbody = document.getElementById("facturas-table-body-independiente");
  if (!tbody) return;
  tbody.innerHTML = "";

  listaFacturas.forEach((f) => {
    let subtotal = f.cantidad * f.precioUnitario;
    let iva = f.aplicaIva ? subtotal * 0.19 : 0;
    let total = subtotal + iva;

    tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 14px; font-weight: bold; color: #880e4f;">${f.nro}</td>
                <td style="padding: 14px; font-weight: 600; color: #444;">${f.cliente} <br><span style="font-size: 0.8rem; color: #777;">NIT/CC: ${f.nitCliente}</span></td>
                <td style="padding: 14px; color: #666;">${f.fecha}</td>
                <td style="padding: 14px; font-weight: bold; color: #2e7d32;">$${total.toLocaleString()}</td>
                <td style="padding: 14px; text-align: center;">
                    <button onclick="generarPDFFactura(${f.id})" style="background: #fce4ec; color: #880e4f; border: none; padding: 8px 16px; border-radius: 14px; font-weight: bold; cursor: pointer; font-size: 0.9rem;" title="Ver Factura PDF">📄 Descargar Factura PDF</button>
                </td>
            </tr>
        `;
  });
}
// --- LÓGICA DE FINANZAS PERSONALES Y AHORRO ---
let datosAhorroPersonal = JSON.parse(
  localStorage.getItem("misAhorrosPersonales"),
) || [{ id: 1, desc: "Ahorro Inicial", monto: 300000 }];

function renderizarFinanzasPersonales() {
  let totalAhorrado = datosAhorroPersonal.reduce(
    (acc, item) => acc + item.monto,
    0,
  );
  const lblAhorro = document.getElementById("lbl-ahorro-total");
  if (lblAhorro) lblAhorro.innerText = `$${totalAhorrado.toLocaleString()}`;

  actualizarGraficoPersonal(totalAhorrado);
  actualizarConsejosDanteFedericoAhorro(totalAhorrado);
  calcularGastosHormiga();
  calcularReglaPresupuesto();
}

function actualizarGraficoPersonal(ahorrado) {
  const ctx = document.getElementById("graficoAhorroPersonal");
  if (!ctx) return;

  let meta = 2000000;
  let restante = Math.max(meta - ahorrado, 0);

  if (miGraficoAhorroPersonal) {
    miGraficoAhorroPersonal.data.datasets[0].data = [ahorrado, restante];
    miGraficoAhorroPersonal.update();
    return;
  }

  miGraficoAhorroPersonal = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Ahorrado Actual", "Restante para Meta"],
      datasets: [
        {
          data: [ahorrado, restante],
          backgroundColor: ["#2e7d32", "#e0e0e0"],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, font: { weight: "bold" } },
        },
      },
    },
  });
}

function actualizarConsejosDanteFedericoAhorro(ahorrado) {
  const danteMsg = document.getElementById("dante-ahorro-estado");
  const federicoMsg = document.getElementById("federico-ahorro-estado");
  if (!danteMsg || !federicoMsg) return;

  if (ahorrado >= 1000000) {
    danteMsg.innerText =
      "¡Impresionante acumulación! Tienes una base sólida para explorar fondos de inversión. 🐺✨";
    federicoMsg.innerText =
      "Excelente disciplina de caja personal. Mantén este ritmo y cumplirás la meta sin afanes. 🐕";
  } else {
    danteMsg.innerText =
      "¡Aúlla! Vamos a incrementar el aporte quincenal para acelerar el fondo de emergencia. 🐺🚀";
    federicoMsg.innerText =
      "Cuidado con los gastos hormiga de la semana. ¡Cada moneda guardada cuenta! 🐕⚠️";
  }
}

// Simulador de Gastos Hormiga
function calcularGastosHormiga() {
  const input = document.getElementById("gasto-hormiga-input");
  const resultado = document.getElementById("resultado-hormiga");
  if (!input || !resultado) return;

  let diario = parseFloat(input.value) || 0;
  let anual = diario * 365;
  resultado.innerText = `$${anual.toLocaleString()}`;
}

// Calculadora Regla 50/30/20
function calcularReglaPresupuesto() {
  const input = document.getElementById("ingreso-mensual-input");
  if (!input) return;

  let ingreso = parseFloat(input.value) || 0;
  document.getElementById("regla-50").innerText =
    `$${(ingreso * 0.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  document.getElementById("regla-30").innerText =
    `$${(ingreso * 0.3).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  document.getElementById("regla-20").innerText =
    `$${(ingreso * 0.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function abrirModalAhorroPersonal() {
  Swal.fire({
    title: "Abonar a tus Ahorros",
    html: `
            <input type="text" id="swal-desc-ahorro" class="swal2-input" placeholder="Descripción (Ej: Quincena, Regalo)">
            <input type="number" id="swal-monto-ahorro" class="swal2-input" placeholder="Monto a abonar ($)">
        `,
    confirmButtonText: "Guardar Abono",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const desc = document.getElementById("swal-desc-ahorro").value;
      const monto = parseFloat(
        document.getElementById("swal-monto-ahorro").value,
      );

      if (!desc || isNaN(monto) || monto <= 0) {
        Swal.showValidationMessage(
          "Por favor ingresa una descripción y un monto válido.",
        );
      }
      return { desc, monto };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      datosAhorroPersonal.push({
        id: Date.now(),
        desc: result.value.desc,
        monto: result.value.monto,
      });
      localStorage.setItem(
        "misAhorrosPersonales",
        JSON.stringify(datosAhorroPersonal),
      );
      renderizarFinanzasPersonales();
      Swal.fire({
        icon: "success",
        title: "¡Abono registrado con éxito!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}
// Variables de configuración de ahorro personal
let configAhorroo = JSON.parse(localStorage.getItem("configMetaCapital")) || {
  capitalInicial: 300000,
  metaPersonal: 2000000,
};

let abonosAhorroo = JSON.parse(localStorage.getItem("listaAbonosAhorro")) || [];

function renderizarFinanzasPersonales() {
  let totalAbonos = abonosAhorro.reduce((acc, item) => acc + item.monto, 0);
  let ahorroTotalActual = configAhorro.capitalInicial + totalAbonos;

  // Actualizar etiquetas en pantalla
  const lblAhorro = document.getElementById("lbl-ahorro-total");
  const lblMeta = document.getElementById("lbl-meta-total");
  if (lblAhorro) lblAhorro.innerText = `$${ahorroTotalActual.toLocaleString()}`;
  if (lblMeta)
    lblMeta.innerText = `$${configAhorro.metaPersonal.toLocaleString()}`;

  actualizarGraficoPersonal(ahorroTotalActual, configAhorro.metaPersonal);
  actualizarConsejoChichico(ahorroTotalActual, configAhorro.metaPersonal);
}

function actualizarConsejoChichico(actual, meta) {
  const msg = document.getElementById("chichico-consejo-msg");
  if (!msg) return;

  let porcentaje = (actual / meta) * 100;
  if (porcentaje >= 75) {
    msg.innerText =
      "¡Vas a toda marcha! Estás a nada de cruzar la meta. ¡No aferres el freno ahora! 🏁🔥";
  } else if (porcentaje >= 40) {
    msg.innerText =
      "¡Buen ritmo en la vía! El motor del ahorro ya está caliente, sigue metiendo cambios positivos. 🛣️💨";
  } else {
    msg.innerText =
      "¡Prit-prit! Vamos arrancando en primera marcha. Cuidado con los huecos de los gastos hormiga. 🛵⚠️";
  }
}

function configurarMetaYCapital() {
  Swal.fire({
    title: "Configurar Ruta de Ahorro",
    html: `
            <label style="font-size: 0.85rem; font-weight: bold; display: block; text-align: left; margin-bottom: 5px;">¿Con cuánto dinero inicias actualmente? ($)</label>
            <input type="number" id="swal-capital-ini" class="swal2-input" value="${configAhorro.capitalInicial}" placeholder="Capital inicial">
            
            <label style="font-size: 0.85rem; font-weight: bold; display: block; text-align: left; margin-top: 10px; margin-bottom: 5px;">¿Cuál es tu meta total de ahorro? ($)</label>
            <input type="number" id="swal-meta-fin" class="swal2-input" value="${configAhorro.metaPersonal}" placeholder="Meta de ahorro">
        `,
    confirmButtonText: "Guardar Configuración",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const capital = parseFloat(
        document.getElementById("swal-capital-ini").value,
      );
      const meta = parseFloat(document.getElementById("swal-meta-fin").value);

      if (isNaN(capital) || isNaN(meta) || meta <= 0) {
        Swal.showValidationMessage(
          "Por favor ingresa valores numéricos válidos.",
        );
      }
      return { capital, meta };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      configAhorro.capitalInicial = result.value.capital;
      configAhorro.metaPersonal = result.value.meta;
      localStorage.setItem("configMetaCapital", JSON.stringify(configAhorro));
      renderizarFinanzasPersonales();
      Swal.fire({
        icon: "success",
        title: "¡Ruta actualizada!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}
// Configuración por defecto de Ahorro con Chichico
let configAhorro = JSON.parse(
  localStorage.getItem("configMetaCapitalChichico"),
) || {
  capitalInicial: 300000,
  metaPersonal: 2000000,
};

let abonosAhorro =
  JSON.parse(localStorage.getItem("listaAbonosAhorroChichico")) || [];
let miGraficoAhorroPersonal = null;

function renderizarFinanzasPersonales() {
  let totalAbonos = abonosAhorro.reduce((acc, item) => acc + item.monto, 0);
  let ahorroTotalActual = configAhorro.capitalInicial + totalAbonos;

  const lblAhorro = document.getElementById("lbl-ahorro-total");
  const lblMeta = document.getElementById("lbl-meta-total");
  if (lblAhorro) lblAhorro.innerText = `$${ahorroTotalActual.toLocaleString()}`;
  if (lblMeta)
    lblMeta.innerText = `$${configAhorro.metaPersonal.toLocaleString()}`;

  actualizarGraficoPersonal(ahorroTotalActual, configAhorro.metaPersonal);
  actualizarConsejoChichico(ahorroTotalActual, configAhorro.metaPersonal);
  calcularGastosHormiga();
  calcularReglaPresupuesto();
}

function actualizarGraficoPersonal(ahorrado, meta) {
  const ctx = document.getElementById("graficoAhorroPersonal");
  if (!ctx) return;

  let restante = Math.max(meta - ahorrado, 0);

  if (miGraficoAhorroPersonal) {
    miGraficoAhorroPersonal.data.datasets[0].data = [ahorrado, restante];
    miGraficoAhorroPersonal.update();
    return;
  }

  miGraficoAhorroPersonal = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Ahorrado Actual", "Restante para Meta"],
      datasets: [
        {
          data: [ahorrado, restante],
          backgroundColor: ["#2e7d32", "#e0e0e0"],
          borderWidth: 3,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 14, font: { weight: "bold", size: 12 } },
        },
      },
    },
  });
}

function actualizarConsejoChichico(actual, meta) {
  const msg = document.getElementById("chichico-consejo-msg");
  if (!msg) return;

  let porcentaje = (actual / meta) * 100;
  if (porcentaje >= 75) {
    msg.innerText =
      "¡Vas a toda marcha! Estás a nada de cruzar la meta. ¡No frenes ahora! 🏁🔥";
  } else if (porcentaje >= 40) {
    msg.innerText =
      "¡Buen ritmo en la vía! El motor del ahorro ya está caliente, sigue metiendo cambios positivos. 🛣️💨";
  } else {
    msg.innerText =
      "¡Prit-prit! Vamos arrancando en primera marcha. Cuidado con los huecos de los gastos hormiga. 🛵⚠️";
  }
}

function configurarMetaYCapital() {
  Swal.fire({
    title: "Configurar Ruta de Ahorro",
    html: `
            <label style="font-size: 0.85rem; font-weight: bold; display: block; text-align: left; margin-bottom: 5px;">¿Con cuánto dinero inicias actualmente? ($)</label>
            <input type="number" id="swal-capital-ini" class="swal2-input" value="${configAhorro.capitalInicial}" placeholder="Capital inicial">
            
            <label style="font-size: 0.85rem; font-weight: bold; display: block; text-align: left; margin-top: 10px; margin-bottom: 5px;">¿Cuál es tu meta total de ahorro? ($)</label>
            <input type="number" id="swal-meta-fin" class="swal2-input" value="${configAhorro.metaPersonal}" placeholder="Meta de ahorro">
        `,
    confirmButtonText: "Guardar Configuración",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const capital = parseFloat(
        document.getElementById("swal-capital-ini").value,
      );
      const meta = parseFloat(document.getElementById("swal-meta-fin").value);

      if (isNaN(capital) || isNaN(meta) || meta <= 0) {
        Swal.showValidationMessage(
          "Por favor ingresa valores numéricos válidos.",
        );
      }
      return { capital, meta };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      configAhorro.capitalInicial = result.value.capital;
      configAhorro.metaPersonal = result.value.meta;
      localStorage.setItem(
        "configMetaCapitalChichico",
        JSON.stringify(configAhorro),
      );
      renderizarFinanzasPersonales();
      Swal.fire({
        icon: "success",
        title: "¡Ruta actualizada!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}

function abrirModalAhorroPersonal() {
  Swal.fire({
    title: "Abonar a tus Ahorros",
    html: `
            <input type="text" id="swal-desc-ahorro" class="swal2-input" placeholder="Descripción (Ej: Quincena, Extra)">
            <input type="number" id="swal-monto-ahorro" class="swal2-input" placeholder="Monto a abonar ($)">
        `,
    confirmButtonText: "Guardar Abono",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const desc = document.getElementById("swal-desc-ahorro").value;
      const monto = parseFloat(
        document.getElementById("swal-monto-ahorro").value,
      );

      if (!desc || isNaN(monto) || monto <= 0) {
        Swal.showValidationMessage(
          "Por favor ingresa una descripción y un monto válido.",
        );
      }
      return { desc, monto };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      abonosAhorro.push({
        id: Date.now(),
        desc: result.value.desc,
        monto: result.value.monto,
      });
      localStorage.setItem(
        "listaAbonosAhorroChichico",
        JSON.stringify(abonosAhorro),
      );
      renderizarFinanzasPersonales();
      Swal.fire({
        icon: "success",
        title: "¡Abono registrado con éxito!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}

function calcularGastosHormiga() {
  const input = document.getElementById("gasto-hormiga-input");
  const resultado = document.getElementById("resultado-hormiga");
  if (!input || !resultado) return;

  let diario = parseFloat(input.value) || 0;
  let anual = diario * 365;
  resultado.innerText = `$${anual.toLocaleString()}`;
}

function calcularReglaPresupuesto() {
  const input = document.getElementById("ingreso-mensual-input");
  if (!input) return;

  let ingreso = parseFloat(input.value) || 0;
  const r50 = document.getElementById("regla-50");
  const r30 = document.getElementById("regla-30");
  const r20 = document.getElementById("regla-20");

  if (r50)
    r50.innerText = `$${(ingreso * 0.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (r30)
    r30.innerText = `$${(ingreso * 0.3).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (r20)
    r20.innerText = `$${(ingreso * 0.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// --- LÓGICA DE GPS, CHECKPOINTS Y RETO 30 DÍAS ---

// Estado del reto de 30 días guardado en localStorage
let estadoReto30 = JSON.parse(localStorage.getItem("estadoReto30Dias")) || {};

// Función principal de renderizado actualizada para incluir las nuevas funciones
function renderizarFinanzasPersonales() {
  let totalAbonos = abonosAhorro.reduce((acc, item) => acc + item.monto, 0);
  let ahorroTotalActual = configAhorro.capitalInicial + totalAbonos;

  const lblAhorro = document.getElementById("lbl-ahorro-total");
  const lblMeta = document.getElementById("lbl-meta-total");
  if (lblAhorro) lblAhorro.innerText = `$${ahorroTotalActual.toLocaleString()}`;
  if (lblMeta)
    lblMeta.innerText = `$${configAhorro.metaPersonal.toLocaleString()}`;

  actualizarGraficoPersonal(ahorroTotalActual, configAhorro.metaPersonal);
  actualizarConsejoChichico(ahorroTotalActual, configAhorro.metaPersonal);
  actualizarGPSLlegada(ahorroTotalActual, configAhorro.metaPersonal);
  actualizarCheckpoints(ahorroTotalActual, configAhorro.metaPersonal);
  renderizarReto30Dias();
  calcularGastosHormiga();
  calcularReglaPresupuesto();
}

// 1. GPS de Chichico (Cálculo de fecha de llegada)
function actualizarGPSLlegada(actual, meta) {
  const gpsLabel = document.getElementById("gps-fecha-llegada");
  if (!gpsLabel) return;

  if (actual >= meta) {
    gpsLabel.innerText = "¡Meta cumplida! Has llegado al destino 🎉";
    return;
  }

  let faltante = meta - actual;
  // Calcular promedio de abonos o estimar basado en los abonos registrados
  let totalAbonosRegistrados = abonosAhorro.length;

  if (totalAbonosRegistrados === 0) {
    gpsLabel.innerText = "Registra abonos para activar el cálculo del GPS 🛰️";
    return;
  }

  let promedioAbono =
    abonosAhorro.reduce((acc, i) => acc + i.monto, 0) / totalAbonosRegistrados;
  let periodosFaltantes = Math.ceil(faltante / Math.max(promedioAbono, 10000));

  // Suponiendo abonos quincenales por defecto
  let diasEstimados = periodosFaltantes * 15;
  let fechaLlegada = new Date();
  fechaLlegada.setDate(fechaLlegada.getDate() + diasEstimados);

  let opcionesFecha = { year: "numeric", month: "long", day: "numeric" };
  let fechaTexto = fechaLlegada.toLocaleDateString("es-ES", opcionesFecha);

  gpsLabel.innerText = `Llegarás a tu meta el ${fechaTexto} (aprox.)`;
}

// 2. Checkpoints e Insignias de Ruta
function actualizarCheckpoints(actual, meta) {
  let porcentaje = (actual / meta) * 100;

  const b25 = document.getElementById("badge-25");
  const b50 = document.getElementById("badge-50");
  const b75 = document.getElementById("badge-75");
  const b100 = document.getElementById("badge-100");

  if (b25 && porcentaje >= 25) {
    b25.style.opacity = "1";
    b25.style.borderColor = "#2e7d32";
    b25.style.background = "#e8f5e9";
  }
  if (b50 && porcentaje >= 50) {
    b50.style.opacity = "1";
    b50.style.borderColor = "#1565c0";
    b50.style.background = "#e3f2fd";
  }
  if (b75 && porcentaje >= 75) {
    b75.style.opacity = "1";
    b75.style.borderColor = "#ffb300";
    b75.style.background = "#fff8e1";
  }
  if (b100 && porcentaje >= 100) {
    b100.style.opacity = "1";
    b100.style.borderColor = "#e91e63";
    b100.style.background = "#fdf2f8";
  }
}

// 3. Reto de los 30 Días (Gamificación)
function renderizarReto30Dias() {
  const grid = document.getElementById("grid-reto-30");
  if (!grid) return;
  grid.innerHTML = "";

  for (let dia = 1; dia <= 30; dia++) {
    let completado = estadoReto30[dia] || false;
    let bgStyle = completado
      ? "background: #2e7d32; color: white; border-color: #2e7d32;"
      : "background: #f8f9fa; color: #444; border-color: #ddd;";

    grid.innerHTML += `
            <div onclick="toggleDiaReto(${dia})" style="cursor: pointer; padding: 10px 4px; border-radius: 12px; border: 2px solid; text-align: center; ${bgStyle} transition: all 0.2s;">
                <span style="font-size: 0.75rem; display: block; font-weight: bold;">Día</span>
                <strong style="font-size: 1rem;">${dia}</strong>
            </div>
        `;
  }
}

function toggleDiaReto(dia) {
  estadoReto30[dia] = !estadoReto30[dia];
  localStorage.setItem("estadoReto30Dias", JSON.stringify(estadoReto30));
  renderizarReto30Dias();
}

function reiniciarReto30Dias() {
  Swal.fire({
    title: "¿Reiniciar el Reto de 30 Días?",
    text: "Se desmarcarán todos los días completados.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e91e63",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Sí, reiniciar",
  }).then((result) => {
    if (result.isConfirmed) {
      estadoReto30 = {};
      localStorage.setItem("estadoReto30Dias", JSON.stringify(estadoReto30));
      renderizarReto30Dias();
      Swal.fire({
        icon: "success",
        title: "¡Reto reiniciado!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  });
}
// --- LÓGICA DE MODO OSCURO / CLARO ---
function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle("dark-mode");

  const isDark = body.classList.contains("dark-mode");
  localStorage.setItem("usuarioModoOscuro", isDark);

  actualizarIconoDarkMode(isDark);
}

function actualizarIconoDarkMode(isDark) {
  const icon = document.getElementById("dark-mode-icon");
  const text = document.getElementById("dark-mode-text");

  if (!icon || !text) return;

  if (isDark) {
    icon.innerText = "☀️";
    text.innerText = "Claro";
  } else {
    icon.innerText = "🌙";
    text.innerText = "Oscuro";
  }
}

// Cargar preferencia guardada al abrir la página
document.addEventListener("DOMContentLoaded", () => {
  const savedMode = localStorage.getItem("usuarioModoOscuro") === "true";
  if (savedMode) {
    document.body.classList.add("dark-mode");
    actualizarIconoDarkMode(true);
  }
});
// --- LÓGICA DE MODO OSCURO / CLARO PRECISA ---
function toggleDarkMode() {
  const isDark = !document.body.classList.contains("dark-mode");

  if (isDark) {
    document.body.classList.add("dark-mode");
    document.body.style.setProperty("background", "#120309", "important");
    document.body.style.setProperty("color", "#fce4ec", "important");
  } else {
    document.body.classList.remove("dark-mode");
    document.body.style.removeProperty("background");
    document.body.style.removeProperty("color");
  }

  localStorage.setItem("usuarioModoOscuro", isDark);
  actualizarIconoDarkMode(isDark);

  // Seleccionar únicamente las tarjetas principales (no todos los divs)
  const tarjetas = document.querySelectorAll(
    'div[style*="background: white"], div[style*="background: #ffffff"], div[style*="background: #fafafa"], div[style*="background: #f8f9fa"]',
  );

  tarjetas.forEach((el) => {
    if (isDark) {
      // Guardar el fondo original solo una vez
      if (!el.dataset.originalBg) {
        el.dataset.originalBg = el.style.background || "#ffffff";
      }
      el.style.setProperty("background", "#1f0b18", "important");
      el.style.setProperty("color", "#f8bbd0", "important");
      el.style.setProperty(
        "border-color",
        "rgba(233, 30, 99, 0.3)",
        "important",
      );
    } else {
      // Restaurar explícitamente a blanco sólido y limpiar estilos oscuros
      el.style.setProperty("background", "#ffffff", "important");
      el.style.setProperty("color", "", "important");
      el.style.setProperty("border-color", "", "important");
    }
  });
}

function actualizarIconoDarkMode(isDark) {
  const icon = document.getElementById("dark-mode-icon");
  const text = document.getElementById("dark-mode-text");

  if (!icon || !text) return;

  if (isDark) {
    icon.innerText = "☀️";
    text.innerText = "Claro";
  } else {
    icon.innerText = "🌙";
    text.innerText = "Oscuro";
  }
}

// Cargar preferencia guardada al abrir la página
window.addEventListener("load", () => {
  const savedMode = localStorage.getItem("usuarioModoOscuro") === "true";
  if (savedMode) {
    toggleDarkMode();
  }
});

// Cargar preferencia guardada al abrir la página
window.addEventListener("load", () => {
  const savedMode = localStorage.getItem("usuarioModoOscuro") === "true";
  if (savedMode) {
    toggleDarkMode(); // Aplica directamente el modo oscuro si estaba guardado
  }
});

// Forzar cambios dinámicos a elementos con estilos en línea
function aplicarColoresForzados(isDark) {
  // Seleccionar tarjetas y contenedores con fondo blanco o claro
  const tarjetasBlancas = document.querySelectorAll(
    'div[style*="background: white"], div[style*="background: #ffffff"], div[style*="background: #fafafa"], div[style*="background: #f8f9fa"]',
  );

  tarjetasBlancas.forEach((el) => {
    if (isDark) {
      el.dataset.originalBg = el.style.background; // Guardar original
      el.style.setProperty("background", "#1f0b18", "important");
      el.style.setProperty("color", "#f8bbd0", "important");
      el.style.setProperty(
        "border-color",
        "rgba(233, 30, 99, 0.3)",
        "important",
      );
    } else {
      el.style.background = el.dataset.originalBg || "";
      el.style.color = "";
      el.style.border = "";
    }
  });
}

// Cargar preferencia guardada al abrir la página
window.addEventListener("load", () => {
  const savedMode = localStorage.getItem("usuarioModoOscuro") === "true";
  if (savedMode) {
    document.body.classList.add("dark-mode");
    actualizarIconoDarkMode(true);
    aplicarColoresForzados(true);
  }
});

// Cargar preferencia guardada al abrir la página
window.addEventListener("load", () => {
  const savedMode = localStorage.getItem("usuarioModoOscuro") === "true";
  if (savedMode) {
    document.body.classList.add("dark-mode");
    actualizarIconoDarkMode(true);
  }
});
// --- LÓGICA DE MODO OSCURO LIMPIA CON CLASES ---
function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle("dark-mode");

  const isDark = body.classList.contains("dark-mode");
  localStorage.setItem("usuarioModoOscuro", isDark);

  actualizarIconoDarkMode(isDark);

  // Alternar clase en todas las tarjetas marcadas
  const tarjetas = document.querySelectorAll(".card-darkable");
  tarjetas.forEach((el) => {
    if (isDark) {
      el.classList.add("dark-mode-card"); // Opcional si usas los selectores del CSS de arriba
    } else {
      el.classList.remove("dark-mode-card");
    }
  });
}

function actualizarIconoDarkMode(isDark) {
  const icon = document.getElementById("dark-mode-icon");
  const text = document.getElementById("dark-mode-text");

  if (!icon || !text) return;

  if (isDark) {
    icon.innerText = "☀️";
    text.innerText = "Claro";
  } else {
    icon.innerText = "🌙";
    text.innerText = "Oscuro";
  }
}

// Cargar preferencia guardada al abrir la página
window.addEventListener("load", () => {
  const savedMode = localStorage.getItem("usuarioModoOscuro") === "true";
  if (savedMode) {
    document.body.classList.add("dark-mode");
    actualizarIconoDarkMode(true);
  }
});
// --- LÓGICA DE CELEBRACIÓN CON CONFETI Y MACRO-ANIMACIONES ---

function dispararConfetiEpico() {
  // Explosión masiva de confeti con colores corporativos y neón
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#e91e63", "#ff4081", "#2e7d32", "#ffb300", "#1565c0"],
  });
}

// Modificación en la función de Checkpoints para lanzar confeti al desbloquear nuevos hitos
function actualizarCheckpoints(actual, meta) {
  let porcentaje = (actual / meta) * 100;

  const b25 = document.getElementById("badge-25");
  const b50 = document.getElementById("badge-50");
  const b75 = document.getElementById("badge-75");
  const b100 = document.getElementById("badge-100");

  let previoAlcanzado = localStorage.getItem("ultimoPorcentajeAlcanzado") || 0;

  if (b25 && porcentaje >= 25) {
    b25.classList.add("checkpoint-desbloqueado");
  }
  if (b50 && porcentaje >= 50) {
    b50.classList.add("checkpoint-desbloqueado");
  }
  if (b75 && porcentaje >= 75) {
    b75.classList.add("checkpoint-desbloqueado");
  }
  if (b100 && porcentaje >= 100) {
    b100.classList.add("checkpoint-desbloqueado");
    if (previoAlcanzado < 100) {
      dispararConfetiEpico(); // ¡Confeti por llegar al 100%!
    }
  }

  // Disparar confeti si cruza un hito nuevo por primera vez
  if (porcentaje >= 25 && previoAlcanzado < 25) {
    dispararConfetiEpico();
  } else if (porcentaje >= 50 && previoAlcanzado < 50) {
    dispararConfetiEpico();
  } else if (porcentaje >= 75 && previoAlcanzado < 75) {
    dispararConfetiEpico();
  }

  localStorage.setItem("ultimoPorcentajeAlcanzado", porcentaje);
}
function cambiarSubVista(subviewId, btnElement) {
  // Ocultar todas las subvistas de finanzas
  document
    .querySelectorAll(".subview-content")
    .forEach((sub) => (sub.style.display = "none"));

  // Mostrar la seleccionada
  const target = document.getElementById(subviewId);
  if (target) target.style.display = "block";

  // Actualizar estilos activos de los subbotones
  const parentContainer = btnElement.parentElement;
  if (parentContainer) {
    parentContainer.querySelectorAll(".sub-btn").forEach((btn) => {
      btn.style.background = "#fff";
      btn.style.color = "#555";
      btn.style.boxShadow = "0 4px 15px rgba(0,0,0,0.05)";
    });
  }

  btnElement.style.background = "#e91e63";
  btnElement.style.color = "white";
  btnElement.style.boxShadow = "0 4px 15px rgba(233,30,99,0.3)";

  // Si abre deudas, renderizar datos
  if (subviewId === "subview-deudas") {
    renderizarDeudas();
  }
}
// --- GESTOR DE DEUDAS Y PRÉSTAMOS (LIBRO DE CUENTAS) ---
// --- RENDERIZAR LIBRO DE CUENTAS ---
let listaDeudasss =
  JSON.parse(localStorage.getItem("libroCuentasDeudas")) || [];

function renderizarDeudas() {
  const tbody = document.getElementById("tabla-deudas-body");
  const lblCobrar = document.getElementById("lbl-total-cobrar");
  const lblPagar = document.getElementById("lbl-total-pagar");

  if (!tbody) return;

  tbody.innerHTML = "";
  let totalCobrar = 0;
  let totalPagar = 0;

  if (listaDeudas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #888;">No hay cuentas registradas en el libro. ¡Añade una con el botón superior!</td></tr>`;
  } else {
    listaDeudas.forEach((item) => {
      let montoNum = parseFloat(item.monto) || 0;
      if (item.tipo === "cobrar") {
        totalCobrar += montoNum;
      } else {
        totalPagar += montoNum;
      }

      let badgeTipo =
        item.tipo === "cobrar"
          ? `<span style="background: #e8f5e9; color: #2e7d32; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📥 Me deben</span>`
          : `<span style="background: #ffebee; color: #c62828; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📤 Debo</span>`;

      tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 14px;">${badgeTipo}</td>
                    <td style="padding: 14px; font-weight: bold; color: #444;">${item.persona}</td>
                    <td style="padding: 14px; color: #666;">${item.concepto}</td>
                    <td style="padding: 14px; font-weight: bold; color: ${item.tipo === "cobrar" ? "#2e7d32" : "#c62828"};">$${montoNum.toLocaleString()}</td>
                    <td style="padding: 14px; font-size: 0.9rem; color: #555;">📅 ${item.fechaCorte}</td>
                    <td style="padding: 14px; text-align: center;">
                        <button onclick="eliminarDeuda(${item.id})" style="background: #ffebee; color: #c62828; border: none; padding: 6px 12px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">🗑️ Pagar / Borrar</button>
                    </td>
                </tr>
            `;
    });
  }

  if (lblCobrar) lblCobrar.innerText = `$${totalCobrar.toLocaleString()}`;
  if (lblPagar) lblPagar.innerText = `$${totalPagar.toLocaleString()}`;
}

// --- MODAL DE NUEVA DEUDA / PRÉSTAMO ---
function abrirModalNuevaDeuda() {
  Swal.fire({
    title: "Registrar en el Libro de Cuentas",
    html: `
            <div style="text-align: left;">
                <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">Tipo de movimiento:</label>
                <select id="swal-tipo-deuda" class="swal2-input" style="width: 100%; margin: 0 0 10px 0; height: 45px;">
                    <option value="cobrar">📥 Dinero por Cobrar (Me deben)</option>
                    <option value="pagar">📤 Dinero por Pagar (Debo)</option>
                </select>

                <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">Persona o Empresa:</label>
                <input type="text" id="swal-persona-deuda" class="swal2-input" placeholder="Ej: Proveedor Juan / Cliente X" style="width: 100%; margin: 0 0 10px 0;">

                <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">Concepto:</label>
                <input type="text" id="swal-concepto-deuda" class="swal2-input" placeholder="Ej: Préstamo de insumos / Abono" style="width: 100%; margin: 0 0 10px 0;">

                <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">Monto ($):</label>
                <input type="number" id="swal-monto-deuda" class="swal2-input" placeholder="Ej: 150000" style="width: 100%; margin: 0 0 10px 0;">

                <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">Fecha de corte / límite:</label>
                <input type="date" id="swal-fecha-deuda" class="swal2-input" style="width: 100%; margin: 0 0 10px 0;">
            </div>
        `,
    confirmButtonText: "Guardar Cuenta",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const tipo = document.getElementById("swal-tipo-deuda").value;
      const persona = document.getElementById("swal-persona-deuda").value;
      const concepto = document.getElementById("swal-concepto-deuda").value;
      const monto = parseFloat(
        document.getElementById("swal-monto-deuda").value,
      );
      const fechaCorte = document.getElementById("swal-fecha-deuda").value;

      if (!persona || !concepto || isNaN(monto) || monto <= 0 || !fechaCorte) {
        Swal.showValidationMessage(
          "Por favor completa todos los campos correctamente.",
        );
        return false;
      }
      return { tipo, persona, concepto, monto, fechaCorte };
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      // Crear el objeto de la nueva deuda
      const nuevaDeuda = {
        id: Date.now(),
        tipo: result.value.tipo,
        persona: result.value.persona,
        concepto: result.value.concepto,
        monto: result.value.monto,
        fechaCorte: result.value.fechaCorte,
      };

      // Añadir al arreglo global
      listaDeudas.push(nuevaDeuda);

      // Guardar en localStorage
      localStorage.setItem("libroCuentasDeudas", JSON.stringify(listaDeudas));

      // Pintar de inmediato en la tabla y actualizar totales
      renderizarDeudas();

      // Mensaje de éxito flotante
      Swal.fire({
        icon: "success",
        title: "¡Cuenta guardada con éxito!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}

function eliminarDeuda(id) {
  Swal.fire({
    title: "¿Marcar como saldada / eliminar?",
    text: "La cuenta se removerá del registro de pendientes.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e91e63",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Sí, saldar",
  }).then((result) => {
    if (result.isConfirmed) {
      listaDeudas = listaDeudas.filter((item) => item.id !== id);
      localStorage.setItem("libroCuentasDeudas", JSON.stringify(listaDeudas));
      renderizarDeudas();
      Swal.fire({
        icon: "success",
        title: "¡Cuenta actualizada!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  });
}

// Cargar automáticamente al iniciar la página por si se abre directamente la vista
window.addEventListener("load", () => {
  renderizarDeudas();
});
// --- LIBRO DE CUENTAS: LÓGICA PRINCIPAL ---
let listaDeudass = JSON.parse(localStorage.getItem("libroCuentasDeudas")) || [];

// --- RENDERIZAR LIBRO DE CUENTAS BLINDADO ---
let listaDeudas = JSON.parse(localStorage.getItem("libroCuentasDeudas")) || [];

function renderizarDeudas() {
  // 1. Mostrar la sección explícitamente
  const seccionDeudas = document.getElementById("view-deudas");
  if (seccionDeudas) {
    seccionDeudas.style.display = "block";
  }

  // 2. Dar un respiro al DOM mediante un pequeño timeout para asegurar que los elementos existan
  setTimeout(() => {
    const tbody = document.getElementById("tabla-deudas-body");
    const lblCobrar = document.getElementById("lbl-total-cobrar");
    const lblPagar = document.getElementById("lbl-total-pagar");

    console.log("Ejecutando render con elementos:", {
      tbody,
      lblCobrar,
      lblPagar,
      totalItems: listaDeudas.length,
    });

    if (!tbody) {
      console.error(
        "¡No se encontró el elemento con ID 'tabla-deudas-body' en el DOM!",
      );
      return;
    }

    tbody.innerHTML = "";
    let totalCobrar = 0;
    let totalPagar = 0;

    if (listaDeudas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #888;">No hay cuentas registradas en el libro. ¡Añade una con el botón superior!</td></tr>`;
    } else {
      listaDeudas.forEach((item) => {
        let montoNum = parseFloat(item.monto) || 0;
        if (item.tipo === "cobrar") {
          totalCobrar += montoNum;
        } else {
          totalPagar += montoNum;
        }

        let badgeTipo =
          item.tipo === "cobrar"
            ? `<span style="background: #e8f5e9; color: #2e7d32; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📥 Me deben</span>`
            : `<span style="background: #ffebee; color: #c62828; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📤 Debo</span>`;

        tbody.innerHTML += `
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 14px;">${badgeTipo}</td>
                        <td style="padding: 14px; font-weight: bold; color: #444;">${item.persona}</td>
                        <td style="padding: 14px; color: #666;">${item.concepto}</td>
                        <td style="padding: 14px; font-weight: bold; color: ${item.tipo === "cobrar" ? "#2e7d32" : "#c62828"};">$${montoNum.toLocaleString()}</td>
                        <td style="padding: 14px; font-size: 0.9rem; color: #555;">📅 ${item.fechaCorte}</td>
                        <td style="padding: 14px; text-align: center;">
                            <button onclick="eliminarDeuda(${item.id})" style="background: #ffebee; color: #c62828; border: none; padding: 6px 12px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">🗑️ Pagar / Borrar</button>
                        </td>
                    </tr>
                `;
      });
    }

    if (lblCobrar) lblCobrar.innerText = `$${totalCobrar.toLocaleString()}`;
    if (lblPagar) lblPagar.innerText = `$${totalPagar.toLocaleString()}`;
  }, 50);
}

function abrirModalNuevaDeuda() {
  Swal.fire({
    title: "Registrar en el Libro de Cuentas",
    html: `
            <div style="text-align: left;">
                <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">Tipo de movimiento:</label>
                <select id="swal-tipo-deuda" class="swal2-input" style="width: 100%; margin: 0 0 10px 0; height: 45px;">
                    <option value="cobrar">📥 Dinero por Cobrar (Me deben)</option>
                    <option value="pagar">📤 Dinero por Pagar (Debo)</option>
                </select>

                <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">Persona o Empresa:</label>
                <input type="text" id="swal-persona-deuda" class="swal2-input" placeholder="Ej: Proveedor Juan / Cliente X" style="width: 100%; margin: 0 0 10px 0;">

                <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">Concepto:</label>
                <input type="text" id="swal-concepto-deuda" class="swal2-input" placeholder="Ej: Préstamo de insumos / Abono" style="width: 100%; margin: 0 0 10px 0;">

                <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">Monto ($):</label>
                <input type="number" id="swal-monto-deuda" class="swal2-input" placeholder="Ej: 150000" style="width: 100%; margin: 0 0 10px 0;">

                <label style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px;">Fecha de corte / límite:</label>
                <input type="date" id="swal-fecha-deuda" class="swal2-input" style="width: 100%; margin: 0 0 10px 0;">
            </div>
        `,
    confirmButtonText: "Guardar Cuenta",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const tipo = document.getElementById("swal-tipo-deuda").value;
      const persona = document.getElementById("swal-persona-deuda").value;
      const concepto = document.getElementById("swal-concepto-deuda").value;
      const monto = parseFloat(
        document.getElementById("swal-monto-deuda").value,
      );
      const fechaCorte = document.getElementById("swal-fecha-deuda").value;

      if (!persona || !concepto || isNaN(monto) || monto <= 0 || !fechaCorte) {
        Swal.showValidationMessage(
          "Por favor completa todos los campos correctamente.",
        );
        return false;
      }
      return { tipo, persona, concepto, monto, fechaCorte };
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const nuevaDeuda = {
        id: Date.now(),
        tipo: result.value.tipo,
        persona: result.value.persona,
        concepto: result.value.concepto,
        monto: result.value.monto,
        fechaCorte: result.value.fechaCorte,
      };

      listaDeudas.push(nuevaDeuda);
      localStorage.setItem("libroCuentasDeudas", JSON.stringify(listaDeudas));

      console.log("Nueva deuda guardada:", nuevaDeuda);
      renderizarDeudas();

      Swal.fire({
        icon: "success",
        title: "¡Cuenta guardada con éxito!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}

function eliminarDeuda(id) {
  Swal.fire({
    title: "¿Marcar como saldada / eliminar?",
    text: "La cuenta se removerá del registro de pendientes.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e91e63",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Sí, saldar",
  }).then((result) => {
    if (result.isConfirmed) {
      listaDeudas = listaDeudas.filter((item) => item.id !== id);
      localStorage.setItem("libroCuentasDeudas", JSON.stringify(listaDeudas));
      renderizarDeudas();
      Swal.fire({
        icon: "success",
        title: "¡Cuenta actualizada!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  });
}

// Cargar al iniciar
window.addEventListener("load", () => {
  renderizarDeudas();
});
// ==========================================
// MÓDULO: LIBRO DE CUENTAS Y PRÉSTAMOS (JS)
// ==========================================

// Obtener datos almacenados o inicializar arreglo vacío
let misDeudas = JSON.parse(localStorage.getItem("appLibroCuentas")) || [];

// Función principal para renderizar la tabla y calcular totales
function renderizarDeudas() {
  const tbody = document.getElementById("tabla-deudas-body");
  const lblCobrar = document.getElementById("lbl-total-cobrar");
  const lblPagar = document.getElementById("lbl-total-pagar");

  if (!tbody) return; // Si no estamos en la vista, salir sin error

  tbody.innerHTML = "";
  let sumaCobrar = 0;
  let sumaPagar = 0;

  if (misDeudas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding: 25px; text-align: center; color: #888; font-style: italic;">No hay cuentas registradas. ¡Haz clic en "Registrar Cuenta" para comenzar!</td></tr>`;
  } else {
    misDeudas.forEach((item) => {
      let montoValor = parseFloat(item.monto) || 0;

      if (item.tipo === "cobrar") {
        sumaCobrar += montoValor;
      } else {
        sumaPagar += montoValor;
      }

      let etiquetaTipo =
        item.tipo === "cobrar"
          ? `<span style="background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📥 Me deben</span>`
          : `<span style="background: #ffebee; color: #c62828; padding: 6px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📤 Debo</span>`;

      tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #f0f0f0; transition: background 0.2s;">
                    <td style="padding: 14px;">${etiquetaTipo}</td>
                    <td style="padding: 14px; font-weight: bold; color: #444;">${item.persona}</td>
                    <td style="padding: 14px; color: #666;">${item.concepto}</td>
                    <td style="padding: 14px; font-weight: bold; color: ${item.tipo === "cobrar" ? "#2e7d32" : "#c62828"};">$${montoValor.toLocaleString()}</td>
                    <td style="padding: 14px; font-size: 0.9rem; color: #555;">📅 ${item.fechaCorte}</td>
                    <td style="padding: 14px; text-align: center;">
                        <button type="button" onclick="eliminarDeuda(${item.id})" style="background: #ffebee; color: #c62828; border: none; padding: 6px 14px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">🗑️ Saldar / Borrar</button>
                    </td>
                </tr>
            `;
    });
  }

  // Actualizar métricas visuales superiores
  if (lblCobrar) lblCobrar.innerText = `$${sumaCobrar.toLocaleString()}`;
  if (lblPagar) lblPagar.innerText = `$${sumaPagar.toLocaleString()}`;
}

// Abrir modal con SweetAlert2 para registrar nueva cuenta
function abrirModalNuevaDeuda() {
  Swal.fire({
    title: "Registrar en el Libro de Cuentas",
    html: `
            <div style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Tipo de movimiento:</label>
                <select id="swal-tipo-deuda" class="swal2-input" style="width: 100%; margin: 0; height: 45px; border-radius: 12px;">
                    <option value="cobrar">📥 Dinero por Cobrar (Me deben)</option>
                    <option value="pagar">📤 Dinero por Pagar (Debo)</option>
                </select>

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Persona o Empresa:</label>
                <input type="text" id="swal-persona-deuda" class="swal2-input" placeholder="Ej: Proveedor Juan / Cliente X" style="width: 100%; margin: 0; border-radius: 12px;">

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Concepto:</label>
                <input type="text" id="swal-concepto-deuda" class="swal2-input" placeholder="Ej: Préstamo de insumos / Abono" style="width: 100%; margin: 0; border-radius: 12px;">

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Monto ($):</label>
                <input type="number" id="swal-monto-deuda" class="swal2-input" placeholder="Ej: 150000" style="width: 100%; margin: 0; border-radius: 12px;">

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Fecha de corte / límite:</label>
                <input type="date" id="swal-fecha-deuda" class="swal2-input" style="width: 100%; margin: 0; border-radius: 12px;">
            </div>
        `,
    confirmButtonText: "Guardar Cuenta",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const tipo = document.getElementById("swal-tipo-deuda").value;
      const persona = document
        .getElementById("swal-persona-deuda")
        .value.trim();
      const concepto = document
        .getElementById("swal-concepto-deuda")
        .value.trim();
      const monto = parseFloat(
        document.getElementById("swal-monto-deuda").value,
      );
      const fechaCorte = document.getElementById("swal-fecha-deuda").value;

      if (!persona || !concepto || isNaN(monto) || monto <= 0 || !fechaCorte) {
        Swal.showValidationMessage(
          "Por favor completa todos los campos correctamente.",
        );
        return false;
      }
      return { tipo, persona, concepto, monto, fechaCorte };
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const nuevaCuenta = {
        id: Date.now(),
        ...result.value,
      };

      misDeudas.push(nuevaCuenta);
      localStorage.setItem("appLibroCuentas", JSON.stringify(misDeudas));

      // Refrescar tabla y totales de inmediato
      renderizarDeudas();

      Swal.fire({
        icon: "success",
        title: "¡Cuenta guardada con éxito!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}

// Eliminar / saldar deuda del listado
function eliminarDeuda(id) {
  Swal.fire({
    title: "¿Marcar como saldada / eliminar?",
    text: "La cuenta se removerá del registro de pendientes.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e91e63",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Sí, saldar",
  }).then((result) => {
    if (result.isConfirmed) {
      misDeudas = misDeudas.filter((item) => item.id !== id);
      localStorage.setItem("appLibroCuentas", JSON.stringify(misDeudas));

      // FUERZA BRUTA: Mostrar la vista y renderizar de inmediato
      document
        .querySelectorAll(".view-section")
        .forEach((s) => (s.style.display = "none"));
      document.getElementById("view-deudas").style.display = "block";
      renderizarDeudas();
      Swal.fire({
        icon: "success",
        title: "¡Cuenta actualizada!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  });
}

// Ejecutar renderizado al cargar la página
window.addEventListener("DOMContentLoaded", () => {
  renderizarDeudas();
});
// ==========================================
// MÓDULO MEJORADO: LIBRO DE CUENTAS (JS)
// ==========================================
let misDeudass = JSON.parse(localStorage.getItem("appLibroCuentas")) || [];
let filtroActualDeudas = "todos";

function filtrarDeudas(tipo, btnElement) {
  filtroActualDeudas = tipo;

  // Cambiar estilos visuales de los botones de filtro
  document.querySelectorAll(".filtro-btn").forEach((b) => {
    b.style.background = "#fff";
    b.style.color = "#555";
  });
  btnElement.style.background = "#e91e63";
  btnElement.style.color = "white";

  renderizarDeudas();
}

function renderizarDeudas() {
  const seccionDeudas = document.getElementById("view-deudas");
  if (seccionDeudas) seccionDeudas.style.display = "block";

  const tbody = document.getElementById("tabla-deudas-body");
  const lblCobrar = document.getElementById("lbl-total-cobrar");
  const lblPagar = document.getElementById("lbl-total-pagar");
  const inputBuscar = document.getElementById("input-buscar-deuda");

  if (!tbody) return;

  tbody.innerHTML = "";
  let sumaCobrar = 0;
  let sumaPagar = 0;

  // Texto de búsqueda actual
  const textoBusqueda = inputBuscar
    ? inputBuscar.value.toLowerCase().trim()
    : "";

  // Filtrar arreglo
  let deudasFiltradas = misDeudas.filter((item) => {
    const cumpleTipo =
      filtroActualDeudas === "todos" || item.tipo === filtroActualDeudas;
    const cumpleBusqueda =
      item.persona.toLowerCase().includes(textoBusqueda) ||
      item.concepto.toLowerCase().includes(textoBusqueda);
    return cumpleTipo && cumpleBusqueda;
  });

  // Calcular totales generales sobre TODO el arreglo (no solo lo filtrado)
  misDeudas.forEach((item) => {
    let val = parseFloat(item.monto) || 0;
    if (item.tipo === "cobrar") sumaCobrar += val;
    else sumaPagar += val;
  });

  if (lblCobrar) lblCobrar.innerText = `$${sumaCobrar.toLocaleString()}`;
  if (lblPagar) lblPagar.innerText = `$${sumaPagar.toLocaleString()}`;

  if (deudasFiltradas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding: 30px; text-align: center; color: #888; font-style: italic;">No se encontraron registros de cuentas.</td></tr>`;
    return;
  }

  // Fecha actual para calcular alertas de vencimiento
  const hoy = new Date().toISOString().split("T")[0];

  deudasFiltradas.forEach((item) => {
    let montoValor = parseFloat(item.monto) || 0;

    let etiquetaTipo =
      item.tipo === "cobrar"
        ? `<span style="background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📥 Me deben</span>`
        : `<span style="background: #ffebee; color: #c62828; padding: 6px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📤 Debo</span>`;

    // Alerta si la fecha de corte ya pasó o es hoy
    let alertaVencimiento = "";
    if (item.fechaCorte < hoy) {
      alertaVencimiento = `<br><span style="color: #c62828; font-size: 0.75rem; font-weight: bold;">⚠️ ¡Vencido! (${item.fechaCorte})</span>`;
    } else {
      alertaVencimiento = `<br><span style="color: #666; font-size: 0.75rem;">📅 ${item.fechaCorte}</span>`;
    }

    tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #f0f0f0; transition: background 0.2s;">
                <td style="padding: 14px;">${etiquetaTipo}</td>
                <td style="padding: 14px; font-weight: bold; color: #444;">${item.persona}</td>
                <td style="padding: 14px; color: #666;">${item.concepto}</td>
                <td style="padding: 14px; font-weight: bold; color: ${item.tipo === "cobrar" ? "#2e7d32" : "#c62828"};">$${montoValor.toLocaleString()}</td>
                <td style="padding: 14px; font-size: 0.9rem;">${alertaVencimiento}</td>
                <td style="padding: 14px; text-align: center;">
                    <button type="button" onclick="eliminarDeuda(${item.id})" style="background: #ffebee; color: #c62828; border: none; padding: 6px 14px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">🗑️ Saldar / Borrar</button>
                </td>
            </tr>
        `;
  });
}
// ==========================================
// MÓDULO: LIBRO DE CUENTAS CON ABONOS E HISTORIAL
// ==========================================
let misDeudasss = JSON.parse(localStorage.getItem("appLibroCuentas")) || [];
let historialSaldadas =
  JSON.parse(localStorage.getItem("appHistorialSaldadas")) || [];
let vistaDeudasActual = "pendientes"; // 'pendientes' o 'historial'
let filtroActualDeudasss = "todos";

function cambiarVistaDeudas(vista, btnElement) {
  vistaDeudasActual = vista;

  // Actualizar estilos de pestañas principales
  document.getElementById("tab-btn-pendientes").style.background =
    vista === "pendientes" ? "#e91e63" : "#fff";
  document.getElementById("tab-btn-pendientes").style.color =
    vista === "pendientes" ? "white" : "#555";
  document.getElementById("tab-btn-historial").style.background =
    vista === "historial" ? "#e91e63" : "#fff";
  document.getElementById("tab-btn-historial").style.color =
    vista === "historial" ? "white" : "#555";

  renderizarDeudas();
}

function filtrarDeudas(tipo, btnElement) {
  filtroActualDeudas = tipo;
  document.querySelectorAll(".filtro-btn").forEach((b) => {
    b.style.background = "#fff";
    b.style.color = "#555";
  });
  btnElement.style.background = "#e91e63";
  btnElement.style.color = "white";
  renderizarDeudas();
}

function renderizarDeudas() {
  const seccionDeudas = document.getElementById("view-deudas");
  if (seccionDeudas) seccionDeudas.style.display = "block";

  const tbody = document.getElementById("tabla-deudas-body");
  const lblCobrar = document.getElementById("lbl-total-cobrar");
  const lblPagar = document.getElementById("lbl-total-pagar");
  const inputBuscar = document.getElementById("input-buscar-deuda");

  if (!tbody) return;

  tbody.innerHTML = "";
  let sumaCobrar = 0;
  let sumaPagar = 0;

  // Calcular totales globales sobre pendientes
  misDeudas.forEach((item) => {
    let saldoPendiente = item.monto - (item.abonado || 0);
    if (item.tipo === "cobrar") sumaCobrar += saldoPendiente;
    else sumaPagar += saldoPendiente;
  });

  if (lblCobrar) lblCobrar.innerText = `$${sumaCobrar.toLocaleString()}`;
  if (lblPagar) lblPagar.innerText = `$${sumaPagar.toLocaleString()}`;

  // Seleccionar origen de datos según la pestaña activa
  let fuenteDatos =
    vistaDeudasActual === "pendientes" ? misDeudas : historialSaldadas;
  const textoBusqueda = inputBuscar
    ? inputBuscar.value.toLowerCase().trim()
    : "";

  let datosFiltrados = fuenteDatos.filter((item) => {
    const cumpleTipo =
      filtroActualDeudas === "todos" || item.tipo === filtroActualDeudas;
    const cumpleBusqueda =
      item.persona.toLowerCase().includes(textoBusqueda) ||
      item.concepto.toLowerCase().includes(textoBusqueda);
    return cumpleTipo && cumpleBusqueda;
  });

  if (datosFiltrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding: 30px; text-align: center; color: #888; font-style: italic;">No hay registros en esta sección.</td></tr>`;
    return;
  }

  const hoy = new Date().toISOString().split("T")[0];

  datosFiltrados.forEach((item) => {
    let montoOriginal = parseFloat(item.monto) || 0;
    let abonado = parseFloat(item.abonado) || 0;
    let saldoPendiente = montoOriginal - abonado;

    let etiquetaTipo =
      item.tipo === "cobrar"
        ? `<span style="background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📥 Me deben</span>`
        : `<span style="background: #ffebee; color: #c62828; padding: 6px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📤 Debo</span>`;

    let infoMonto =
      vistaDeudasActual === "pendientes"
        ? `
            <b>Original:</b> $${montoOriginal.toLocaleString()}<br>
            <span style="color: #2e7d32;">Abonado: $${abonado.toLocaleString()}</span><br>
            <strong style="color: ${item.tipo === "cobrar" ? "#2e7d32" : "#c62828"};">Pendiente: $${saldoPendiente.toLocaleString()}</strong>
        `
        : `<strong>$${montoOriginal.toLocaleString()} (Saldado)</strong>`;

    let accionesHTML = "";
    if (vistaDeudasActual === "pendientes") {
      accionesHTML = `
                <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
                    <button type="button" onclick="registrarAbono(${item.id})" style="background: #e3f2fd; color: #1565c0; border: none; padding: 6px 10px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 0.75rem;">💵 Abonar</button>
                    <button type="button" onclick="saldarCuenta(${item.id})" style="background: #e8f5e9; color: #2e7d32; border: none; padding: 6px 10px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 0.75rem;">✔️ Saldar</button>
                </div>
            `;
    } else {
      accionesHTML = `<span style="color: #666; font-size: 0.8rem; font-weight: bold;">Archivado / Completado</span>`;
    }

    tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 14px;">${etiquetaTipo}</td>
                <td style="padding: 14px; font-weight: bold; color: #444;">${item.persona}</td>
                <td style="padding: 14px; color: #666;">${item.concepto}</td>
                <td style="padding: 14px; font-size: 0.9rem;">${infoMonto}</td>
                <td style="padding: 14px; font-size: 0.85rem; color: #555;">📅 ${item.fechaCorte}</td>
                <td style="padding: 14px; text-align: center;">${accionesHTML}</td>
            </tr>
        `;
  });
}

function abrirModalNuevaDeuda() {
  Swal.fire({
    title: "Registrar en el Libro de Cuentas",
    html: `
            <div style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Tipo de movimiento:</label>
                <select id="swal-tipo-deuda" class="swal2-input" style="width: 100%; margin: 0; height: 45px; border-radius: 12px;">
                    <option value="cobrar">📥 Dinero por Cobrar (Me deben)</option>
                    <option value="pagar">📤 Dinero por Pagar (Debo)</option>
                </select>

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Persona o Empresa:</label>
                <input type="text" id="swal-persona-deuda" class="swal2-input" placeholder="Ej: Proveedor Juan / Cliente X" style="width: 100%; margin: 0; border-radius: 12px;">

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Concepto:</label>
                <input type="text" id="swal-concepto-deuda" class="swal2-input" placeholder="Ej: Préstamo de insumos" style="width: 100%; margin: 0; border-radius: 12px;">

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Monto Total ($):</label>
                <input type="number" id="swal-monto-deuda" class="swal2-input" placeholder="Ej: 150000" style="width: 100%; margin: 0; border-radius: 12px;">

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Fecha de corte / límite:</label>
                <input type="date" id="swal-fecha-deuda" class="swal2-input" style="width: 100%; margin: 0; border-radius: 12px;">
            </div>
        `,
    confirmButtonText: "Guardar Cuenta",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const tipo = document.getElementById("swal-tipo-deuda").value;
      const persona = document
        .getElementById("swal-persona-deuda")
        .value.trim();
      const concepto = document
        .getElementById("swal-concepto-deuda")
        .value.trim();
      const monto = parseFloat(
        document.getElementById("swal-monto-deuda").value,
      );
      const fechaCorte = document.getElementById("swal-fecha-deuda").value;

      if (!persona || !concepto || isNaN(monto) || monto <= 0 || !fechaCorte) {
        Swal.showValidationMessage(
          "Por favor completa todos los campos correctamente.",
        );
        return false;
      }
      return { tipo, persona, concepto, monto, fechaCorte };
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const nuevaCuenta = {
        id: Date.now(),
        ...result.value,
        abonado: 0,
      };

      misDeudas.push(nuevaCuenta);
      localStorage.setItem("appLibroCuentas", JSON.stringify(misDeudas));
      renderizarDeudas();

      Swal.fire({
        icon: "success",
        title: "¡Cuenta guardada!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}

function registrarAbono(id) {
  const cuenta = misDeudas.find((item) => item.id === id);
  if (!cuenta) return;

  let pendienteActual = cuenta.monto - (cuenta.abonado || 0);

  Swal.fire({
    title: `Registrar Abono para ${cuenta.persona}`,
    text: `Saldo pendiente actual: $${pendienteActual.toLocaleString()}`,
    input: "number",
    inputAttributes: {
      placeholder: "Monto del abono",
      min: 1,
      max: pendienteActual,
    },
    showCancelButton: true,
    confirmButtonText: "Aplicar Abono",
    confirmButtonColor: "#e91e63",
    cancelButtonText: "Cancelar",
  }).then((res) => {
    if (res.isConfirmed && res.value) {
      let valorAbono = parseFloat(res.value);
      if (isNaN(valorAbono) || valorAbono <= 0) return;

      if (valorAbono > pendienteActual) {
        Swal.fire(
          "Error",
          "El abono no puede superar el saldo pendiente.",
          "error",
        );
        return;
      }

      cuenta.abonado = (cuenta.abonado || 0) + valorAbono;
      localStorage.setItem("appLibroCuentas", JSON.stringify(misDeudas));
      renderizarDeudas();

      Swal.fire({
        icon: "success",
        title: "¡Abono registrado con éxito!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}

function saldarCuenta(id) {
  Swal.fire({
    title: "¿Marcar cuenta como totalmente saldada?",
    text: "La cuenta se moverá al historial de transacciones pasadas.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#2e7d32",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Sí, mover al historial",
  }).then((result) => {
    if (result.isConfirmed) {
      const index = misDeudas.findIndex((item) => item.id === id);
      if (index !== -1) {
        const cuentaSaldada = misDeudas.splice(index, 1)[0];
        historialSaldadas.push(cuentaSaldada);

        localStorage.setItem("appLibroCuentas", JSON.stringify(misDeudas));
        localStorage.setItem(
          "appHistorialSaldadas",
          JSON.stringify(historialSaldadas),
        );

        renderizarDeudas();
        Swal.fire({
          icon: "success",
          title: "¡Cuenta archivada en el historial!",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    }
  });
}
// ==========================================
// MÓDULO: LIBRO DE CUENTAS (CATEGORÍAS Y GRÁFICA)
// ==========================================
let misDeudassss = JSON.parse(localStorage.getItem("appLibroCuentas")) || [];
let historialSaldadass =
  JSON.parse(localStorage.getItem("appHistorialSaldadas")) || [];
let vistaDeudasActuall = "pendientes";
let filtroActualDeudass = "todos";

function cambiarVistaDeudas(vista, btnElement) {
  vistaDeudasActual = vista;

  document.getElementById("tab-btn-pendientes").style.background =
    vista === "pendientes" ? "#e91e63" : "#fff";
  document.getElementById("tab-btn-pendientes").style.color =
    vista === "pendientes" ? "white" : "#555";
  document.getElementById("tab-btn-historial").style.background =
    vista === "historial" ? "#e91e63" : "#fff";
  document.getElementById("tab-btn-historial").style.color =
    vista === "historial" ? "white" : "#555";

  renderizarDeudas();
}

function filtrarDeudas(tipo, btnElement) {
  filtroActualDeudas = tipo;
  document.querySelectorAll(".filtro-btn").forEach((b) => {
    b.style.background = "#fff";
    b.style.color = "#555";
  });
  btnElement.style.background = "#e91e63";
  btnElement.style.color = "white";
  renderizarDeudas();
}

function renderizarDeudas() {
  const seccionDeudas = document.getElementById("view-deudas");
  if (seccionDeudas) seccionDeudas.style.display = "block";

  const tbody = document.getElementById("tabla-deudas-body");
  const lblCobrar = document.getElementById("lbl-total-cobrar");
  const lblPagar = document.getElementById("lbl-total-pagar");
  const inputBuscar = document.getElementById("input-buscar-deuda");

  // Elementos de la gráfica
  const graficaLblCobrar = document.getElementById("grafica-lbl-cobrar");
  const graficaLblPagar = document.getElementById("grafica-lbl-pagar");
  const barraCobrar = document.getElementById("barra-cobrar");
  const barraPagar = document.getElementById("barra-pagar");

  if (!tbody) return;

  tbody.innerHTML = "";
  let sumaCobrar = 0;
  let sumaPagar = 0;

  // Calcular totales globales sobre pendientes
  misDeudas.forEach((item) => {
    let saldoPendiente = item.monto - (item.abonado || 0);
    if (item.tipo === "cobrar") sumaCobrar += saldoPendiente;
    else sumaPagar += saldoPendiente;
  });

  if (lblCobrar) lblCobrar.innerText = `$${sumaCobrar.toLocaleString()}`;
  if (lblPagar) lblPagar.innerText = `$${sumaPagar.toLocaleString()}`;

  // Actualizar Gráfica de Barras
  if (graficaLblCobrar)
    graficaLblCobrar.innerText = `$${sumaCobrar.toLocaleString()}`;
  if (graficaLblPagar)
    graficaLblPagar.innerText = `$${sumaPagar.toLocaleString()}`;

  let totalMaximo = sumaCobrar + sumaPagar;
  let porcentajeCobrar = totalMaximo > 0 ? (sumaCobrar / totalMaximo) * 100 : 0;
  let porcentajePagar = totalMaximo > 0 ? (sumaPagar / totalMaximo) * 100 : 0;

  if (barraCobrar) barraCobrar.style.width = `${porcentajeCobrar}%`;
  if (barraPagar) barraPagar.style.width = `${porcentajePagar}%`;

  // Filtrar datos
  let fuenteDatos =
    vistaDeudasActual === "pendientes" ? misDeudas : historialSaldadas;
  const textoBusqueda = inputBuscar
    ? inputBuscar.value.toLowerCase().trim()
    : "";

  let datosFiltrados = fuenteDatos.filter((item) => {
    const cumpleTipo =
      filtroActualDeudas === "todos" || item.tipo === filtroActualDeudas;
    const cumpleBusqueda =
      item.persona.toLowerCase().includes(textoBusqueda) ||
      item.concepto.toLowerCase().includes(textoBusqueda) ||
      (item.categoria && item.categoria.toLowerCase().includes(textoBusqueda));
    return cumpleTipo && cumpleBusqueda;
  });

  if (datosFiltrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding: 30px; text-align: center; color: #888; font-style: italic;">No hay registros en esta sección.</td></tr>`;
    return;
  }

  datosFiltrados.forEach((item) => {
    let montoOriginal = parseFloat(item.monto) || 0;
    let abonado = parseFloat(item.abonado) || 0;
    let saldoPendiente = montoOriginal - abonado;
    let categoria = item.categoria || "General";

    let etiquetaTipo =
      item.tipo === "cobrar"
        ? `<span style="background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📥 Me deben</span>`
        : `<span style="background: #ffebee; color: #c62828; padding: 6px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">📤 Debo</span>`;

    let badgeCategoria = `<br><span style="background: #f3e5f5; color: #7b1fa2; padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: bold;">🏷️ ${categoria}</span>`;

    let infoMonto =
      vistaDeudasActual === "pendientes"
        ? `
            <b>Original:</b> $${montoOriginal.toLocaleString()}<br>
            <span style="color: #2e7d32;">Abonado: $${abonado.toLocaleString()}</span><br>
            <strong style="color: ${item.tipo === "cobrar" ? "#2e7d32" : "#c62828"};">Pendiente: $${saldoPendiente.toLocaleString()}</strong>
        `
        : `<strong>$${montoOriginal.toLocaleString()} (Saldado)</strong>`;

    let accionesHTML =
      vistaDeudasActual === "pendientes"
        ? `
            <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
                <button type="button" onclick="registrarAbono(${item.id})" style="background: #e3f2fd; color: #1565c0; border: none; padding: 6px 10px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 0.75rem;">💵 Abonar</button>
                <button type="button" onclick="saldarCuenta(${item.id})" style="background: #e8f5e9; color: #2e7d32; border: none; padding: 6px 10px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 0.75rem;">✔️ Saldar</button>
            </div>
        `
        : `<span style="color: #666; font-size: 0.8rem; font-weight: bold;">Archivado</span>`;

    tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 14px;">${etiquetaTipo}</td>
                <td style="padding: 14px; font-weight: bold; color: #444;">${item.persona}</td>
                <td style="padding: 14px; color: #666;">${item.concepto} ${badgeCategoria}</td>
                <td style="padding: 14px; font-size: 0.9rem;">${infoMonto}</td>
                <td style="padding: 14px; font-size: 0.85rem; color: #555;">📅 ${item.fechaCorte}</td>
                <td style="padding: 14px; text-align: center;">${accionesHTML}</td>
            </tr>
        `;
  });
}

function abrirModalNuevaDeuda() {
  Swal.fire({
    title: "Registrar en el Libro de Cuentas",
    html: `
            <div style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Tipo de movimiento:</label>
                <select id="swal-tipo-deuda" class="swal2-input" style="width: 100%; margin: 0; height: 45px; border-radius: 12px;">
                    <option value="cobrar">📥 Dinero por Cobrar (Me deben)</option>
                    <option value="pagar">📤 Dinero por Pagar (Debo)</option>
                </select>

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Categoría o Etiqueta:</label>
                <select id="swal-categoria-deuda" class="swal2-input" style="width: 100%; margin: 0; height: 45px; border-radius: 12px;">
                    <option value="Inventario">📦 Inventario</option>
                    <option value="Insumos agrícolas">🌱 Insumos agrícolas</option>
                    <option value="Servicios">💡 Servicios</option>
                    <option value="Préstamo personal">🤝 Préstamo personal</option>
                    <option value="Otro">📌 Otro</option>
                </select>

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Persona o Empresa:</label>
                <input type="text" id="swal-persona-deuda" class="swal2-input" placeholder="Ej: Proveedor Juan / Cliente X" style="width: 100%; margin: 0; border-radius: 12px;">

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Concepto:</label>
                <input type="text" id="swal-concepto-deuda" class="swal2-input" placeholder="Ej: Abono de mercancía" style="width: 100%; margin: 0; border-radius: 12px;">

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Monto Total ($):</label>
                <input type="number" id="swal-monto-deuda" class="swal2-input" placeholder="Ej: 150000" style="width: 100%; margin: 0; border-radius: 12px;">

                <label style="font-size: 0.85rem; font-weight: bold; color: #444;">Fecha de corte / límite:</label>
                <input type="date" id="swal-fecha-deuda" class="swal2-input" style="width: 100%; margin: 0; border-radius: 12px;">
            </div>
        `,
    confirmButtonText: "Guardar Cuenta",
    confirmButtonColor: "#e91e63",
    focusConfirm: false,
    preConfirm: () => {
      const tipo = document.getElementById("swal-tipo-deuda").value;
      const categoria = document.getElementById("swal-categoria-deuda").value;
      const persona = document
        .getElementById("swal-persona-deuda")
        .value.trim();
      const concepto = document
        .getElementById("swal-concepto-deuda")
        .value.trim();
      const monto = parseFloat(
        document.getElementById("swal-monto-deuda").value,
      );
      const fechaCorte = document.getElementById("swal-fecha-deuda").value;

      if (!persona || !concepto || isNaN(monto) || monto <= 0 || !fechaCorte) {
        Swal.showValidationMessage(
          "Por favor completa todos los campos correctamente.",
        );
        return false;
      }
      return { tipo, categoria, persona, concepto, monto, fechaCorte };
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const nuevaCuenta = {
        id: Date.now(),
        ...result.value,
        abonado: 0,
      };

      misDeudas.push(nuevaCuenta);
      localStorage.setItem("appLibroCuentas", JSON.stringify(misDeudas));
      renderizarDeudas();

      Swal.fire({
        icon: "success",
        title: "¡Cuenta guardada!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}

function registrarAbono(id) {
  const cuenta = misDeudas.find((item) => item.id === id);
  if (!cuenta) return;

  let pendienteActual = cuenta.monto - (cuenta.abonado || 0);

  Swal.fire({
    title: `Registrar Abono para ${cuenta.persona}`,
    text: `Saldo pendiente actual: $${pendienteActual.toLocaleString()}`,
    input: "number",
    inputAttributes: {
      placeholder: "Monto del abono",
      min: 1,
      max: pendienteActual,
    },
    showCancelButton: true,
    confirmButtonText: "Aplicar Abono",
    confirmButtonColor: "#e91e63",
    cancelButtonText: "Cancelar",
  }).then((res) => {
    if (res.isConfirmed && res.value) {
      let valorAbono = parseFloat(res.value);
      if (
        isNaN(valorAbono) ||
        valorAbono <= 0 ||
        valorAbono > pendienteActual
      ) {
        Swal.fire("Error", "Monto de abono no válido.", "error");
        return;
      }
      cuenta.abonado = (cuenta.abonado || 0) + valorAbono;
      localStorage.setItem("appLibroCuentas", JSON.stringify(misDeudas));
      renderizarDeudas();
      Swal.fire({
        icon: "success",
        title: "¡Abono registrado!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}

function saldarCuenta(id) {
  Swal.fire({
    title: "¿Marcar cuenta como totalmente saldada?",
    text: "Se moverá al historial.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#2e7d32",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Sí, archivar",
  }).then((result) => {
    if (result.isConfirmed) {
      const index = misDeudas.findIndex((item) => item.id === id);
      if (index !== -1) {
        const cuentaSaldada = misDeudas.splice(index, 1)[0];
        historialSaldadas.push(cuentaSaldada);
        localStorage.setItem("appLibroCuentas", JSON.stringify(misDeudas));
        localStorage.setItem(
          "appHistorialSaldadas",
          JSON.stringify(historialSaldadas),
        );
        renderizarDeudas();
        Swal.fire({
          icon: "success",
          title: "¡Cuenta archivada!",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    }
  });
}
// ==========================================
// MÓDULO: SIMULADOR FINANCIERO CON CHICHICO
// ==========================================

function calcularSimulacionFinanciera() {
  const monto = parseFloat(document.getElementById("sim-monto").value) || 0;
  const tasaCreditoAnual =
    parseFloat(document.getElementById("sim-tasa-credito").value) || 0;
  const plazoMeses = parseInt(document.getElementById("sim-plazo").value) || 1;
  const tasaAhorroAnual =
    parseFloat(document.getElementById("sim-tasa-ahorro").value) || 0;

  const lblCuotaMensual = document.getElementById("res-cuota-mensual");
  const lblRendimientoAhorro = document.getElementById(
    "res-rendimiento-ahorro",
  );
  const txtConsejo = document.getElementById("res-consejo-chichico");

  if (monto <= 0 || plazoMeses <= 0) {
    Swal.fire(
      "Atención",
      "Por favor ingresa valores válidos mayores a cero.",
      "warning",
    );
    return;
  }

  // 1. Cálculo de cuota mensual de crédito (Sistema Francés)
  let tasaMensualCredito = tasaCreditoAnual / 100 / 12;
  let cuotaMensual = 0;
  let totalInteresesCredito = 0;

  if (tasaMensualCredito > 0) {
    cuotaMensual =
      (monto *
        (tasaMensualCredito * Math.pow(1 + tasaMensualCredito, plazoMeses))) /
      (Math.pow(1 + tasaMensualCredito, plazoMeses) - 1);
    let totalPagado = cuotaMensual * plazoMeses;
    totalInteresesCredito = totalPagado - monto;
  } else {
    cuotaMensual = monto / plazoMeses;
  }

  // 2. Cálculo de rendimiento del ahorro equivalente al plazo en años
  let anios = plazoMeses / 12;
  // Interés compuesto simple para el ahorro: Monto * (1 + tasa)^anios - Monto
  let rendimientoAhorroTotal =
    monto * (Math.pow(1 + tasaAhorroAnual / 100, anios) - 1);

  // 3. Pintar resultados en tarjetas
  if (lblCuotaMensual)
    lblCuotaMensual.innerText = `$${Math.round(cuotaMensual).toLocaleString()}`;
  if (lblRendimientoAhorro)
    lblRendimientoAhorro.innerText = `+$${Math.round(rendimientoAhorroTotal).toLocaleString()}`;

  // 4. Generar consejo inteligente de Chichico
  let consejo = "";
  if (tasaCreditoAnual > tasaAhorroAnual * 2) {
    consejo = `"¡Cuidado emprendedor! La tasa de tu crédito (${tasaCreditoAnual}%) es considerablemente alta frente al rendimiento de tus ahorros (${tasaAhorroAnual}%). Te sugiero dar una mayor cuota inicial o buscar líneas de financiación para microempresas con tasas más blandas para no ahogar tu flujo de caja."`;
  } else if (rendimientoAhorroTotal > totalInteresesCredito) {
    consejo = `"¡Excelente noticia! En este escenario, tus inversiones o ahorros rinden muy bien. Sin embargo, evalúa si comprometer tu capital de trabajo vale la pena frente al costo financiero del préstamo."`;
  } else {
    consejo = `"Analizando los números: Pedir un préstamo de $${monto.toLocaleString()} te generará unos intereses totales de $${Math.round(totalInteresesCredito).toLocaleString()} en ${plazoMeses} meses. Asegúrate de que la rentabilidad de tu negocio supere con creces la cuota mensual de $${Math.round(cuotaMensual).toLocaleString()} antes de comprometerte."`;
  }

  if (txtConsejo) txtConsejo.innerText = consejo;

  Swal.fire({
    icon: "success",
    title: "¡Simulación calculada por Chichico!",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
  });
}
// ==========================================
// MÓDULO: GRÁFICOS COMPARATIVOS MENSUALES (CHART.JS)
// ==========================================
let miChartMensual = null;

function inicializarGraficaMensual() {
  const ctx = document.getElementById("chartEvolucionMensual");
  if (!ctx) return;

  // Datos simulados o conectados a tu localStorage de ventas/ahorros por mes
  // Meses: Ene, Feb, Mar, Abr, May, Jun, Jul, Ago, Sep, Oct, Nov, Dic
  const datosAnuales = {
    meses: [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ],
    ventas: [
      1200000, 1500000, 1400000, 1800000, 2100000, 1950000, 2300000, 2500000, 0,
      0, 0, 0,
    ],
    ahorros: [
      300000, 400000, 350000, 500000, 600000, 550000, 700000, 800000, 0, 0, 0,
      0,
    ],
  };

  if (miChartMensual) {
    miChartMensual.destroy(); // Limpiar gráfica previa si ya existía
  }

  miChartMensual = new Chart(ctx, {
    type: "bar", // Puede ser 'bar' o 'line'
    data: {
      labels: datosAnuales.meses,
      datasets: [
        {
          label: "Ventas / Ingresos ($)",
          data: datosAnuales.ventas,
          backgroundColor: "rgba(233, 30, 99, 0.7)",
          borderColor: "#e91e63",
          borderWidth: 2,
          borderRadius: 10,
        },
        {
          label: "Ahorros ($)",
          data: datosAnuales.ahorros,
          backgroundColor: "rgba(46, 125, 50, 0.7)",
          borderColor: "#2e7d32",
          borderWidth: 2,
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function actualizarGraficaMensual() {
  const mesSeleccionado = document.getElementById("selector-mes-grafica").value;

  if (!miChartMensual) return;

  if (mesSeleccionado === "todos") {
    // Mostrar todos los meses
    miChartMensual.data.labels = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    miChartMensual.data.datasets[0].data = [
      1200000, 1500000, 1400000, 1800000, 2100000, 1950000, 2300000, 2500000, 0,
      0, 0, 0,
    ];
    miChartMensual.data.datasets[1].data = [
      300000, 400000, 350000, 500000, 600000, 550000, 700000, 800000, 0, 0, 0,
      0,
    ];
  } else {
    // Filtrar o destacar el mes específico seleccionado (ejemplo didáctico de desglose semanal o diario del mes)
    const index = parseInt(mesSeleccionado) - 1;
    const nombreMes = document.getElementById("selector-mes-grafica").options[
      document.getElementById("selector-mes-grafica").selectedIndex
    ].text;

    miChartMensual.data.labels = [
      `Semana 1 (${nombreMes})`,
      `Semana 2 (${nombreMes})`,
      `Semana 3 (${nombreMes})`,
      `Semana 4 (${nombreMes})`,
    ];

    // Simulación de desglose del mes elegido
    let baseVenta = 500000 * index;
    let baseAhorro = 150000 * index;
    miChartMensual.data.datasets[0].data = [
      baseVenta + 100000,
      baseVenta + 200000,
      baseVenta + 150000,
      baseVenta + 300000,
    ];
    miChartMensual.data.datasets[1].data = [
      baseAhorro + 30000,
      baseAhorro + 50000,
      baseAhorro + 40000,
      baseAhorro + 90000,
    ];
  }

  miChartMensual.update();
}

// Ejecutar al cargar la página (asegúrate de que Chart.js esté importado en tu HTML)
window.addEventListener("DOMContentLoaded", () => {
  inicializarGraficaMensual();
});
async function ejecutarLogin() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.email);
      Swal.fire(
        "¡Bienvenido!",
        "Sesión iniciada correctamente",
        "success",
      ).then(() => {
        // Redirigir a la vista principal de manera limpia
        window.location.href = "bienvenida.html";
      });
    } else {
      Swal.fire("Error", data.error || "Credenciales inválidas", "error");
    }
  } catch (e) {
    Swal.fire(
      "Error de conexión",
      "No se pudo conectar con el servidor backend.",
      "error",
    );
  }
}
