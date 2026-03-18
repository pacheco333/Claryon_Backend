DROP DATABASE IF EXISTS db_claryon;
CREATE DATABASE IF NOT EXISTS db_claryon;
USE db_claryon;

-- BORRAR TABLAS (por si hay restos)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Licencias;
DROP TABLE IF EXISTS Lineas;
DROP TABLE IF EXISTS Plataformas;
DROP TABLE IF EXISTS Dispositivos;
DROP TABLE IF EXISTS PazSalvos;
DROP TABLE IF EXISTS Empleados;
DROP TABLE IF EXISTS Usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================
-- 🧑 Tabla Usuarios
-- ===========================================
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

-- ===========================================
-- 🧑 Tabla Permisos
-- ===========================================
CREATE TABLE Permisos_Usuario (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Permisos SET('Administrador','Equipos','Lineas','Antivirus','Correo','Idrive','SAP') DEFAULT 'Equipos',
  id_usuario INT UNSIGNED NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

-- ===========================================
-- 👥 Tabla Empleados
-- ===========================================
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

-- =========================================================
-- TABLA PAZ Y SALVOS
-- ===========================================================
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


-- ===========================================
-- 💻 Tabla Dispositivos (equipos físicos)
-- ===========================================
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

-- ☁️ Tabla Plataformas (antes "Microsoft")
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

-- ===========================================
-- 📱 Tabla Líneas telefónicas
-- ===========================================
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

-- ===========================================
-- 🧾 Tabla Licencias de software
-- ===========================================
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



-- ===========================================
-- DATOS DE PRUEBA (SEED)
-- ===========================================
USE db_claryon;

-- Limpieza opcional (si ya habías metido datos)
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE Licencias;
TRUNCATE TABLE Lineas;
TRUNCATE TABLE Plataformas;
TRUNCATE TABLE Dispositivos;
TRUNCATE TABLE PazSalvos;
TRUNCATE TABLE Permisos_Usuario;
TRUNCATE TABLE Empleados;
TRUNCATE TABLE Usuarios;
SET FOREIGN_KEY_CHECKS=1;

-- ===========================================
-- 👤 Usuarios
-- ===========================================
INSERT INTO Usuarios (id, nombres, apellidos, correo, contrasena, rol, activo, eliminado) VALUES
('1','Javier', 'Rey', 'javier.rey@claryon.com', '$2b$10$fakehashfakehashfakehashfakehashfakehashfakehash', 'Administrador', TRUE, FALSE),
('2','Laura', 'Gómez', 'laura.gomez@claryon.com', '$2b$10$fakehashfakehashfakehashfakehashfakehashfakehash', 'Administrador', TRUE, FALSE),
('3','Carlos', 'Pérez', 'carlos.perez@claryon.com', '$2b$10$fakehashfakehashfakehashfakehashfakehashfakehash', 'invitado', TRUE, FALSE),
('4','Sofía', 'Martínez', 'sofia.martinez@claryon.com', '$2b$10$fakehashfakehashfakehashfakehashfakehashfakehash', 'invitado', FALSE, FALSE);

-- ===========================================
-- 🔐 Permisos por usuario (SET permite varios valores separados por coma)
-- ===========================================
INSERT INTO Permisos_Usuario (Permiso, id_usuario) VALUES
('Equipos,Lineas,Antivirus,Correo_Atica,Idrive,SAP', 1),
('Equipos,Lineas,Correo_Asei,Correo_Ecologistica', 2),
('Equipos', 3),
('Lineas,Antivirus', 4);

-- ===========================================
-- 👥 Empleados
-- ===========================================
INSERT INTO Empleados (id, nombres, apellidos, correo, puesto, compania, area, fecha_ingreso, fecha_retiro, eliminado) VALUES
('9', 'Andrés', 'Ruiz', 'andres.ruiz@empresa.com', 'Analista TI', 'INDUSTRIA AMBIENTAL S.A.S', 'TI', '2023-03-10', NULL, FALSE),
('8', 'Diana', 'Castro', 'diana.castro@empresa.com', 'Coordinadora', 'ECOLOGISTICA S.A.S E.S.P', 'Operaciones', '2022-08-01', NULL, FALSE),
('7', 'Felipe', 'Londoño', 'felipe.londono@empresa.com', 'Auxiliar', 'LOGISTICA Y DISTRIBUCION ESPECIALIZADA L&D S.A.S', 'Logística', '2021-01-15', '2025-12-20', FALSE),
('6','Mariana', 'Ortiz', 'mariana.ortiz@empresa.com', 'Contadora', 'VALREX S.A.S', 'Finanzas', '2020-05-05', NULL, FALSE);

-- ===========================================
-- ✅ Paz y Salvos (relación con Empleados)
-- ===========================================
INSERT INTO PazSalvos (id_empleado, fecha_inicio, fecha_fin, estado, observaciones, eliminado) VALUES
(9, '2025-12-01', NULL, 'En Proceso', 'Salida programada - revisión en curso', FALSE),
(8, '2025-11-15', '2025-12-05', 'Completado', 'Paz y salvo finalizado correctamente', FALSE),
(7, '2025-12-10', '2025-12-22', 'Completado', 'Entrega de activos completada', FALSE),
(6, '2025-12-20', NULL, 'En Proceso', 'Pendiente cierre de plataformas', FALSE);

-- ===========================================
-- 💻 Dispositivos (depende de Usuarios y PazSalvos)
-- id_responsable: quien registra/revisa (Usuarios)
-- id_paz_salvo: el proceso (PazSalvos)
-- ===========================================
INSERT INTO Dispositivos (id_responsable, id_paz_salvo, fotografia_1, fotografia_2, observaciones, eliminado) VALUES
(1, 1, 'uploads/dev_1_a.jpg', 'uploads/dev_1_b.jpg', 'Portátil entregado, falta cargador', FALSE),
(2, 2, 'uploads/dev_2_a.jpg', NULL, 'Equipo completo, OK', FALSE),
(2, 3, NULL, NULL, 'Sin fotografías - validación manual', FALSE),
(1, 4, 'uploads/dev_4_a.jpg', 'uploads/dev_4_b.jpg', 'Pendiente revisión de estado físico', FALSE);

-- ===========================================
-- ☁️ Plataformas (depende de Usuarios y PazSalvos)
-- ===========================================
INSERT INTO Plataformas (id_responsable, id_paz_salvo, fotografia_onedrive, fotografia_buzon, observaciones, eliminado) VALUES
(1, 1, 'uploads/one_1.jpg', 'uploads/buzon_1.jpg', 'OneDrive pendiente limpieza', FALSE),
(2, 2, 'uploads/one_2.jpg', 'uploads/buzon_2.jpg', 'Cierre realizado', FALSE),
(2, 3, NULL, 'uploads/buzon_3.jpg', 'Buzón verificado, OneDrive no aplica', FALSE),
(1, 4, 'uploads/one_4.jpg', NULL, 'Pendiente deshabilitar acceso', FALSE);

-- ===========================================
-- 📱 Líneas (depende de Usuarios y PazSalvos)
-- ===========================================
INSERT INTO Lineas (id_responsable, id_paz_salvo, numero_linea, observaciones, eliminado) VALUES
(1, 1, '3001234567', 'SIM debe devolverse', FALSE),
(2, 2, '3109876543', 'Línea cancelada', FALSE),
(2, 3, '3015556677', 'Portabilidad realizada', FALSE),
(1, 4, NULL, 'No tenía línea asignada', FALSE);

-- ===========================================
-- 🧾 Licencias (depende de PazSalvos y 4 responsables (Usuarios))
-- ===========================================
INSERT INTO Licencias (
  id_paz_salvo,
  responsable_antivirus, fotografia_antivirus, observaciones_antivirus,
  responsable_copia_seguridad, fotografia_copia_seguridad, observaciones_copia_seguridad,
  responsable_erp, fotografia_erp, observaciones_erp,
  responsable_otras_licencias, otras_licencias, fotografia_otras_licencias, observaciones_otras_licencias,
  eliminado
) VALUES
(
  1,
  1, 'uploads/av_1.jpg', 'Antivirus verificado - OK',
  2, 'uploads/idr_1.jpg', 'IDrive pendiente eliminar usuario',
  1, 'uploads/sap_1.jpg', 'SAP: licencia asignada removida',
  2, 'Office365, Adobe', 'uploads/otras_1.jpg', 'Revisión en proceso',
  FALSE
),
(
  2,
  2, 'uploads/av_2.jpg', 'Antivirus OK',
  2, 'uploads/idr_2.jpg', 'Copia seguridad cerrada',
  1, 'uploads/sap_2.jpg', 'ERP OK',
  1, 'N/A', NULL, 'Sin licencias adicionales',
  FALSE
),
(
  3,
  1, NULL, 'No aplica',
  1, NULL, 'No aplica',
  2, 'uploads/sap_3.jpg', 'ERP cerrado',
  2, 'Autodesk', 'uploads/otras_3.jpg', 'Licencia transferida',
  FALSE
),
(
  4,
  2, 'uploads/av_4.jpg', 'Pendiente validación',
  1, NULL, 'Pendiente',
  1, NULL, 'Pendiente',
  2, 'Zoom, Office365', NULL, 'Pendiente cierre final',
  FALSE
);

