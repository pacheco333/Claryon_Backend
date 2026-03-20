
CREATE DATABASE IF NOT EXISTS db_claryon;
USE db_claryon;

CREATE TABLE Usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('Administrador','Usuario','Invitado') NOT NULL DEFAULT 'Administrador',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE Usuarios
ADD COLUMN firma VARCHAR(255);

CREATE TABLE Permisos_Usuario (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Permisos SET('Administrador','Equipos','Lineas','Antivirus','Correo','Idrive','SAP') DEFAULT 'Equipos',
  id_usuario INT UNSIGNED NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);


CREATE TABLE Empleados (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL,
  puesto VARCHAR(100) DEFAULT NULL,
  compania ENUM('INDUSTRIA AMBIENTAL S.A.S',
				'LOGISTICA Y DISTRIBUCION ESPECIALIZADA L&D S.A.S',
                'ECOLOGIA Y ENTORNO S.A.S. E.S.P.',
                'LUBRYESP S.A.S',
                'VALREX S.A.S',
                'ENERGIA PURA PROYECTO SOPO S.A.S.',
                'ASESORÍAS SERVICIOS ECOLÓGICOS E INDUSTRIALES S.A.S',
                'BIOLÓGICOS Y CONTAMINADOS S.A.S ESP',
                'VALREX GUATEMALA',
                'VALREX SRL REPUBLICA DOMINICANA',
                'VALREX S.A.C PERÚ',
                'IA4 S.A.S',
                'ECOLOGISTICA S.A.S E.S.P') NOT NULL,
  area VARCHAR(100),
  fecha_ingreso DATE DEFAULT NULL,
  fecha_retiro DATE DEFAULT NULL,
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE PazSalvos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT UNSIGNED NOT NULL,
  id_creado_por INT UNSIGNED NULL,

  id_resp_equipos INT UNSIGNED NULL,
  id_resp_plataformas INT UNSIGNED NULL,
  id_resp_linea INT UNSIGNED NULL,
  id_resp_antivirus INT UNSIGNED NULL,
  id_resp_idrive INT UNSIGNED NULL,
  id_resp_sap INT UNSIGNED NULL,
  id_resp_otras_lic INT UNSIGNED NULL,
  id_resp_glpi INT UNSIGNED NULL,
  id_resp_acronics INT UNSIGNED NULL,

  fecha_inicio DATE,
  fecha_fin DATE DEFAULT NULL,
  estado ENUM('En Proceso','Completado','Anulado') DEFAULT 'En Proceso',
  observaciones VARCHAR(255),
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_empleado) REFERENCES Empleados(id),
  FOREIGN KEY (id_creado_por) REFERENCES Usuarios(id),
  

  FOREIGN KEY (id_resp_equipos) REFERENCES Usuarios(id),
  FOREIGN KEY (id_resp_plataformas) REFERENCES Usuarios(id),
  FOREIGN KEY (id_resp_linea) REFERENCES Usuarios(id),
  FOREIGN KEY (id_resp_antivirus) REFERENCES Usuarios(id),
  FOREIGN KEY (id_resp_idrive) REFERENCES Usuarios(id),
  FOREIGN KEY (id_resp_sap) REFERENCES Usuarios(id),
  FOREIGN KEY (id_resp_otras_lic) REFERENCES Usuarios(id),
  FOREIGN KEY (id_resp_glpi) REFERENCES Usuarios(id),
  FOREIGN KEY (id_resp_acronics) REFERENCES Usuarios(id)
);	


-- Agregar indices (Tabla paz y salvos) responsables de las etapas




CREATE TABLE Dispositivos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_responsable INT UNSIGNED NOT NULL,   -- Usuario que revisa/registra
  id_paz_salvo INT UNSIGNED NOT NULL,     -- Paz y salvo asociado
  fotografia_1 VARCHAR(255),
  fotografia_2 VARCHAR(255),
  observaciones VARCHAR(255),
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_responsable) REFERENCES Usuarios(id),
  FOREIGN KEY (id_paz_salvo) REFERENCES PazSalvos(id)
);


CREATE TABLE Plataformas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_responsable INT UNSIGNED NOT NULL,
  id_paz_salvo INT UNSIGNED NOT NULL,
  fotografia_onedrive VARCHAR(255),
  fotografia_buzon VARCHAR(255),
  observaciones VARCHAR(255),
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_responsable) REFERENCES Usuarios(id),
  FOREIGN KEY (id_paz_salvo) REFERENCES PazSalvos(id)
);


CREATE TABLE Lineas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_responsable INT UNSIGNED NOT NULL,
  id_paz_salvo INT UNSIGNED NOT NULL,
  numero_linea VARCHAR(100),
  observaciones VARCHAR(255),
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_responsable) REFERENCES Usuarios(id),
  FOREIGN KEY (id_paz_salvo) REFERENCES PazSalvos(id)
);


CREATE TABLE Licencias (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_paz_salvo INT UNSIGNED NOT NULL,

  responsable_antivirus INT UNSIGNED  NULL,
  fotografia_antivirus VARCHAR(255),
  observaciones_antivirus VARCHAR(255),

  responsable_copia_seguridad INT UNSIGNED  NULL,
  fotografia_copia_seguridad VARCHAR(255),
  observaciones_copia_seguridad VARCHAR(255),

  responsable_erp INT UNSIGNED  NULL,
  fotografia_erp VARCHAR(255),
  observaciones_erp VARCHAR(255),

  responsable_otras_licencias INT UNSIGNED  NULL,
  otras_licencias VARCHAR(255),
  fotografia_otras_licencias VARCHAR(255),
  observaciones_otras_licencias VARCHAR(255),

  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_paz_salvo) REFERENCES PazSalvos(id),
  FOREIGN KEY (responsable_antivirus) REFERENCES Usuarios(id),
  FOREIGN KEY (responsable_copia_seguridad) REFERENCES Usuarios(id),
  FOREIGN KEY (responsable_erp) REFERENCES Usuarios(id),
  FOREIGN KEY (responsable_otras_licencias) REFERENCES Usuarios(id)
);


CREATE TABLE Glpi (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_responsable INT UNSIGNED NOT NULL,  
  id_paz_salvo INT UNSIGNED NOT NULL,     
  fotografia_1 VARCHAR(255),
  fotografia_2 VARCHAR(255),
  observaciones VARCHAR(255),
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_responsable) REFERENCES Usuarios(id),
  FOREIGN KEY (id_paz_salvo) REFERENCES PazSalvos(id)
);


CREATE TABLE Acronics (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_responsable INT UNSIGNED NOT NULL,  
  id_paz_salvo INT UNSIGNED NOT NULL,     
  fotografia_1 VARCHAR(255),
  fotografia_2 VARCHAR(255),
  observaciones VARCHAR(255),
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_responsable) REFERENCES Usuarios(id),
  FOREIGN KEY (id_paz_salvo) REFERENCES PazSalvos(id)
);


-- Limpieza opcional (si ya habías metido datos)

SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE Licencias;
TRUNCATE TABLE Lineas;
TRUNCATE TABLE Plataformas;
TRUNCATE TABLE Dispositivos;
TRUNCATE TABLE PazSalvos;
SET FOREIGN_KEY_CHECKS=1;




