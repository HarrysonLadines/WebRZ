# Plataforma de Descubrimiento y Reseñas de Libros

## URL de la aplicación deployada
Puedes acceder a la aplicación en producción aquí:  
https://app-libros-10.vercel.app/

## Deploy local
Para correr la aplicación localmente:

git clone https://github.com/HarrysonLadines/APPLibros.git
cd APPLibros
npm install
npm run dev

La aplicación estará disponible en http://localhost:3000.

## GitHub Actions
Se han configurado tres workflows para CI/CD:

### Build en Pull Requests
- Ejecuta instalación de dependencias y build de la aplicación.
- Falla el PR si el build no se completa correctamente.

### Tests en Pull Requests
- Ejecuta todos los tests unitarios.
- Falla el PR si algún test falla.

### Docker Container en Main
- Se ejecuta al mergear código a main o master.
- Construye y publica la imagen Docker en GitHub Container Registry.
- Usa tags latest y commit hash.

## Variables de entorno
- DATABASE_URL → URL de tu base de datos (definida en .env.local)


## Docker
Para ejecutar la aplicación con Docker:

# Build de la imagen
docker build -t mi-plataforma-de-libros .

# Ejecutar contenedor
docker run -p 3000:3000 mi-plataforma-de-libros

Recomendado usar multi-stage build en Dockerfile para reducir el tamaño de la imagen.


console.log("Probando GitHub Action");