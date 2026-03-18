    import express from 'express';
    import 'dotenv/config.js';
    import { verificarConexionDB } from './config/db.js';
    import cors from 'cors';
    import { readdir } from 'fs/promises';
    import path from 'path';
    import { pathToFileURL } from 'url';

    // Puerto desde variables de entorno
    const PORT = process.env.PORT || 3000;

    const app = express();
    app.use(express.json());

    // Servir archivos estáticos (imágenes subidas)
    app.use('/uploads', express.static('src/uploads'));

    // Configuración mejorada de CORS
    const corsOptions = {
        // origin: process.env.CORS_ORIGIN?.split(',') || [
        //     'http://localhost:3000',
        //     'http://127.0.0.1:5501',
        //     'http://localhost:4200',
        //     'http://127.0.0.1:4200',
        //     'http://localhost:4000',
        //     'http://127.0.0.1:4000'
        // ],
            origin: '*', 
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 3600
    };

    app.use(cors(corsOptions));

    // Cargar dinámicamente todos los routers desde ./routes y montarlos bajo /api
    async function cargarRutasDinamicas() {
        const routesDir = path.resolve('./src/routes');
        let files;
        try {
            files = await readdir(routesDir);
        } catch (err) {
            console.error('Error leyendo carpeta de rutas:', err);
            return;
        }

        for (const file of files) {
            if (!file.endsWith('.js')) continue;
            if (file.startsWith('_')) continue;

            const fullPath = path.join(routesDir, file);
            const fileUrl = pathToFileURL(fullPath).href;

            try {
                const mod = await import(fileUrl);
                const router = mod.default || mod.router;
                if (!router || typeof router !== 'function') {
                    console.warn(`El módulo ${file} no exporta por defecto un Router. Exporta 'export default router;'`);
                    continue;
                }

                // calcular prefijo: si file es index.js -> /api, si es auth.routes.js -> /api/auth
                let base = file.replace(/\.routes\.js$/, '').replace(/\.js$/, '');
                const prefix = base === 'index' ? '/api' : `/api/${base}`;

                app.use(prefix, router);
                console.log(`Ruta cargada: ${prefix}  <- ${file}`);
            } catch (err) {
                console.error(`No se pudo importar la ruta ${file}:`, err);
            }
        }
    }

    // Cargar rutas, verificar DB y arrancar servidor
    await cargarRutasDinamicas();

    // Iniciar el servidor después de verificar la conexión a la base de datos  
    await verificarConexionDB();

    // Iniciar el servidor
    app.listen(PORT, "localhost", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    });