CREATE TABLE UsuariosEnChat (
id_uec INT AUTO_INCREMENT PRIMARY KEY,
id_usuario INT NOT NULL,
id_chat INT NOT NULL,
FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
FOREIGN KEY (id_chat) REFERENCES Chats(id_chat)
);

CREATE TABLE Chats (
id_chat INT AUTO_INCREMENT PRIMARY KEY,
nom_grupo VARCHAR(100) NOT NULL
);

CREATE TABLE Mensajes(
id_msj INT AUTO_INCREMENT PRIMARY KEY,
hora_enviada TIME NOT NULL, 
texto VARCHAR(100) NOT NULL,
id_usuario INT NOT NULL,
id_chat INT NOT NULL,
FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
FOREIGN KEY (id_chat) REFERENCES Chats(id_chat)
);


select * from Usuarios where id_usuario = 1;

