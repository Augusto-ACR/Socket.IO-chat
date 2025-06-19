import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static('public'));

let turnoActual = 0;
let ultimoTurno = 0;
const turnosAnteriores = [];

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Usuario conectado');

  // Enviar datos iniciales
  socket.emit('estadoInicial', {
    turnoActual,
    ultimoTurno,
  });

  // Cuando alguien saca turno
  socket.on('sacarTurno', () => {
    if (ultimoTurno < 100) {
      ultimoTurno++;
      console.log(`Turno entregado: ${ultimoTurno}`);

      // Enviar turno al cliente que lo pidió
      socket.emit('turnoAsignado', ultimoTurno);

      // Actualizar pantallas
      io.emit('actualizarPantalla', {
        turnoActual,
        ultimoTurno,
        turnosAtendidos: turnoActual,
        anteriores: [...turnosAnteriores].slice(-3).reverse()
      });
    }
  });

  // Cuando el box atiende al siguiente
  socket.on('siguienteTurno', () => {
    if (turnoActual < ultimoTurno) {
      turnoActual++;
      turnosAnteriores.push(turnoActual - 1);
      console.log(`Atendiendo turno: ${turnoActual}`);

      // Notificar a todos
      io.emit('actualizarPantalla', {
        turnoActual,
        ultimoTurno,
        turnosAtendidos: turnoActual,
        anteriores: [...turnosAnteriores].slice(-3).reverse()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

server.listen(3000, () => {
  console.log(' Servidor corriendo en http://localhost:3000');
});