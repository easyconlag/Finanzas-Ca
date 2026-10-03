const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = "mi_clave_secreta_super_segura";

// Conectar a la base de datos SQLite (creará database.db automáticamente)
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) console.error("Error al conectar la BD", err.message);
  else console.log("¡Base de datos SQLite conectada con éxito!");
});

// Crear tablas si no existen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS registros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        tipo TEXT,
        categoria TEXT,
        persona TEXT,
        concepto TEXT,
        monto REAL,
        abonado REAL,
        fechaCorte TEXT,
        estado TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// 1. RUTA DE REGISTRO
app.post("/api/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Faltan datos" });

  const hashedPassword = bcrypt.hashSync(password, 8);
  db.run(
    `INSERT INTO users (email, password) VALUES (?, ?)`,
    [email, hashedPassword],
    function (err) {
      if (err)
        return res.status(400).json({ error: "El correo ya está registrado" });
      res.json({ success: true, message: "Usuario registrado con éxito" });
    },
  );
});

// 2. RUTA DE LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user)
      return res.status(400).json({ error: "Usuario no encontrado" });

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword)
      return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "24h",
    });
    res.json({ success: true, token, email: user.email });
  });
});

// Middleware de autenticación
const verificarToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "Token requerido" });

  jwt.verify(token.split(" ")[1], SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido" });
    req.userId = decoded.id;
    next();
  });
};

// 3. OBTENER REGISTROS DEL USUARIO
app.get("/api/registros", verificarToken, (req, res) => {
  db.all(
    `SELECT * FROM registros WHERE user_id = ?`,
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

// 4. GUARDAR NUEVO REGISTRO
app.post("/api/registros", verificarToken, (req, res) => {
  const {
    tipo,
    categoria,
    persona,
    concepto,
    monto,
    abonado,
    fechaCorte,
    estado,
  } = req.body;
  db.run(
    `INSERT INTO registros (user_id, tipo, categoria, persona, concepto, monto, abonado, fechaCorte, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.userId,
      tipo,
      categoria,
      persona,
      concepto,
      monto,
      abonado || 0,
      fechaCorte,
      estado || "pendiente",
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    },
  );
});

app.listen(3000, () => {
  console.log("Servidor backend corriendo en http://localhost:3000");
});
// Asegúrate de usar la variable 'db' que ya existe arriba en tu server.js
db.run(
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    email TEXT UNIQUE,
    password TEXT,
    lema TEXT
)`,
  (err) => {
    if (err) {
      console.error("Error al crear la tabla usuarios:", err.message);
    } else {
      console.log("Tabla 'usuarios' lista o verificada correctamente.");
    }
  },
);
// ==========================================
// RUTAS DE REGISTRO, LOGIN Y PERFIL
// ==========================================

// ==========================================
// RUTAS DE REGISTRO, LOGIN Y PERFIL (USANDO LA TABLA 'users')
// ==========================================

// 1. REGISTRO DE USUARIO
app.post('/api/registro', async (req, res) => {
    const { nombre, email, password } = req.body;
    const bcrypt = require('bcrypt');
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (nombre, email, password, lema) VALUES (?, ?, ?, ?)`,
            [nombre, email, hashedPassword, "El futuro financiero de tu pyme, hoy."],
            function(err) {
                if (err) {
                    console.error("❌ ERROR SQL REGISTRO:", err.message); // <--- Mira esto en tu terminal
                    return res.status(400).json({ success: false, message: err.message });
                }
                res.json({ success: true, message: "Usuario registrado con éxito." });
            }
        );
    } catch (error) {
        console.error("❌ ERROR SERVIDOR:", error);
        res.status(500).json({ success: false, message: "Error en el servidor." });
    }
});

// 2. INICIO DE SESIÓN (LOGIN)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require("bcrypt");
  // Consultamos la tabla 'users'
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res
        .status(400)
        .json({ success: false, message: "Credenciales incorrectas." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(400)
        .json({ success: false, message: "Contraseña incorrecta." });
    }

    res.json({
      success: true,
      token: "token_seguro_db_" + user.id,
      user: {
        nombre: user.nombre,
        email: user.email,
        lema: user.lema,
      },
    });
  });
});

// 3. ACTUALIZAR PERFIL Y PERSONALIZACIÓN
app.put("/api/perfil", (req, res) => {
  const { email, nombre, lema } = req.body;
  // Actualizamos la tabla 'users'
  db.run(
    `UPDATE users SET nombre = ?, lema = ? WHERE email = ?`,
    [nombre, lema, email],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Error al actualizar." });
      res.json({
        success: true,
        message: "Perfil actualizado en la base de datos.",
      });
    },
  );
});

async function ejecutarLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userName", data.user.nombre);
      localStorage.setItem("userLema", data.user.lema);

      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        window.location.href = "index.html";
      });
    } else {
      Swal.fire({ icon: "error", title: "Error", text: data.message });
    }
  } catch (error) {
    console.error("Error de conexión con el servidor:", error);
    Swal.fire({
      icon: "error",
      title: "Error de Red",
      text: "No se pudo conectar con el servidor backend.",
    });
  }
}

async function guardarPerfil(e) {
  e.preventDefault();
  const nombre = document.getElementById("input-nombre").value;
  const email = document.getElementById("input-email").value;
  const lema = document.getElementById("input-lema").value;

  try {
    const response = await fetch("http://localhost:3000/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nombre, lema }),
    });
    const data = await response.json();

    if (data.success) {
      localStorage.setItem("userName", nombre);
      localStorage.setItem("userLema", lema);

      Swal.fire({
        icon: "success",
        title: "¡Guardado en la Base de Datos!",
        text: "Tus cambios persisten de manera segura.",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({ icon: "error", title: "Error", text: data.message });
    }
  } catch (error) {
    console.error("Error de conexión:", error);
  }
}
