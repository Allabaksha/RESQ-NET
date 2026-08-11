const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('joinRoom', (room) => {
      socket.join(room);
      console.log(`[Socket.IO] Client ${socket.id} joined room: ${room}`);
    });

    socket.on('leaveRoom', (room) => {
      socket.leave(room);
      console.log(`[Socket.IO] Client ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
