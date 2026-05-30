require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const despachos = require("./despachos.json");

const usuariosPermitidos = [
  { user: process.env.USUARIO, pass: process.env.PASSWORD },
];

// Validación de seguridad original
if (process.env.NODE_ENV === "production" && !process.env.AGRO_TOKEN) {
  console.error(
    "¡ALERTA DE FRAUDE DE PESAJE! AGRO_TOKEN ausente en producción. Autodestruyendo servidor"
  );
  process.exit(1);
}

app.get("/", (req, res) => {
  res.send(`
    <html>
    <h1> Bienvenido a la cafetera CaféMagdalena</h1>
    <a href= "login"><button> inicia sesion<a>
    </html>
    `);
});

app.get("/login", (req, res) => {
  res.send(`
    <h2>Login - Supervisor de Carga</h2>
    <form action="/api/auth/login" method="POST">
      <label>Usuario:</label><br>
      <input type="text" name="usuario"><br>
      <label>Contraseña:</label><br>
      <input type="password" name="password"><br>
      <button type="submit" style="padding: 10px; width: 100%; background-color: #4CAF50; color: white; border: none; cursor: pointer;">
        Ingresar
      </button>
    </form>
  </div>
    `);
});

app.post("/api/auth/login", (req, res) => {
  const { usuario, password } = req.body;

  if (usuario === process.env.USUARIO && password === process.env.PASSWORD) {
    const tokenSimulado = "TOKEN-LOGISTICA-SECRET-2026";

    res.send(`
        <div style="text-align: center;">
          <h2>¡Autenticación Exitosa!</h2>
          <p>Tu Token de despacho es:</p>
          <p>${tokenSimulado}</p>
          <br>
          <a href="/despachos">Ir a Despachos</a>
        </div>
      `);
  } else {
    res.status(401).send(`
        <div style="text-align: center">
          <h2 style="color: red;">Credenciales Incorrectas</h2>
          <a href="/login">Intentar de nuevo</a>
        </div>
      `);
  }
});

const verificarTokenDespacho = (req, res, next) => {
  const tokenRecibido = req.headers["x-dispatch-token"];

  if (!tokenRecibido || tokenRecibido !== "TOKEN-LOGISTICA-SECRET-2026") {
    return res.status(403).json({
      error:
        "Acceso denegado. Se requiere un Token de despacho válido en los Headers.",
    });
  }
  next();
};

app.put("/api/despachos/:id/estado", verificarTokenDespacho, (req, res) => {
  const idBuscado = parseInt(req.params.id);
  const despacho = despachos.find((item) => item.id === idBuscado);

  if (!despacho) {
    return res.status(404).json({ error: "Despacho no encontrado" });
  }

  despacho.estado = "entregado";
  res.json({ mensaje: "Estado actualizado con éxito vía API", despacho });
});

app.get("/despachos", (req, res) => {
  res.send(`
      <h1>Gestión de Despachos</h1> 
      <form action="/buscar-despacho" method="POST">
        <p>Ingrese ID del despacho:</p>
        <input name="idParaBuscar">
        <br><br>
        <button type="submit" style="padding: 5px 10px;">Revisar y Entregar</button>
      </form>
      <a href= "/"><button> cerrar sesion<a>
    </div>
  `);
});

// 2. Procesar formulario
app.post("/buscar-despacho", (req, res) => {
  const id = req.body.idParaBuscar;
  res.redirect(id ? `/despachos/${id}` : "/despachos");
});

app.get("/despachos/:id", (req, res) => {
  const idBuscado = parseInt(req.params.id);

  const despacho = despachos.find((item) => item.id === idBuscado);

  if (!despacho) {
    return res.send(`
      <div style="font-family: Arial; text-align: center;">
        <h1>Despacho no encontrado</h1>
        <a href="/despachos">Intentar de nuevo</a>
      </div>
    `);
  }

  despacho.estado = "entregado";

  res.send(`
    <div style="text align: center">
      <h2>Despacho Actualizado</h2>
      <p><strong>ID:</strong> ${despacho.id}</p>
      <p><strong>Producto:</strong> ${despacho.tipoCafe}</p>
      <p><strong>Estado:</strong> ${despacho.estado}</p>
      <a href="/despachos">Volver a buscar</a>
    </div>
  `);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
