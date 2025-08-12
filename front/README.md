🐔 El Nuevo Manantial - Sistema de Pedidos
Este es el repositorio del sistema de gestión de pedidos para "El Nuevo Manantial", un emprendimiento familiar de venta de huevos de gallinas felices en Tostado, Santa Fe.

El proyecto nace como una solución para modernizar y optimizar la toma de pedidos, reemplazando el sistema manual en papel por una plataforma web simple y eficiente, y sirve como un caso de estudio práctico de una aplicación full-stack moderna.

✨ Características
La plataforma está diseñada con dos flujos de usuario principales:

Para Clientes:
1. Pedidos sin Fricción: Los nuevos clientes pueden realizar un pedido como invitados, sin la necesidad de crear una cuenta.
2. Cálculo de Precio en Vivo: El total del pedido se actualiza dinámicamente a medida que el cliente selecciona los productos.
3. Registro Opcional: Después de una compra exitosa, se invita a los clientes a crear una cuenta para agilizar futuros pedidos.
4. Autenticación: Los clientes registrados pueden iniciar sesión para que sus datos (nombre, dirección, teléfono) se carguen automáticamente.
5. Normalización de Teléfono: Los números de teléfono se normalizan automáticamente al formato internacional para asegurar la comunicación vía WhatsApp.

Para Administradores:
1. Rol de Administrador: Un usuario puede ser designado como administrador a través de una variable de entorno segura.
2. Dashboard de Órdenes: Un panel de control centralizado para ver todas las órdenes recibidas (tanto de usuarios registrados como de invitados).
3. Gestión de Estados: Permite cambiar el estado de cada orden (PENDIENTE, CONFIRMADO, ENTREGADO, CANCELADO) de forma interactiva.
4. Filtros y Paginación: El dashboard incluye filtros para ver pedidos por tipo de entrega (envío o retiro) y paginación para manejar un gran volumen de órdenes.
5. Diseño Responsivo: El panel es completamente funcional tanto en escritorio (vista de tabla) como en dispositivos móviles (vista de tarjetas).
6. Contacto Rápido: Incluye un botón de WhatsApp en cada orden para contactar al cliente directamente.

🚀 Tech Stack
Este proyecto fue construido con un stack moderno, enfocado en la productividad y la escalabilidad:
- Framework: Next.js (App Router)
- Lenguaje: TypeScript
- Estilos: Tailwind CSS
- Base de Datos: Supabase (PostgreSQL)
- ORM: Prisma
- Autenticación: NextAuth.js
- Manejo de Formularios: Formik & Yup
- Componentes UI: Headless UI

🛠️ Cómo Empezar (Getting Started)
Sigue estos pasos para levantar el proyecto en tu entorno local.

1. Prerrequisitos
Node.js (v18 o superior)
- npm o yarn
- Una cuenta en Supabase

2. Clonar el Repositorio
git clone https://github.com/tu-usuario/el-manantial.git
cd el-manantial

3. Instalar Dependencias
npm install

4. Configurar Variables de Entorno
Crea un archivo .env.local en la raíz del proyecto.

Copia el contenido de .env.example (si existe) o añade las siguientes variables:

# Datos de la Base de Datos (obtenidos de Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Secreto para NextAuth (generar con `openssl rand -base64 32`)
NEXTAUTH_SECRET="TU_SECRETO_AQUI"
NEXTAUTH_URL="http://localhost:3000"

# Teléfono del administrador para asignación de rol
ADMIN_PHONE="TU_NUMERO_DE_ADMIN_NORMALIZADO"

# Datos públicos para el modal de éxito
NEXT_PUBLIC_CONTACT_PHONE="TU_NUMERO_DE_CONTACTO"
NEXT_PUBLIC_MP_CBU="TU_CBU"
NEXT_PUBLIC_MP_ALIAS="TU.ALIAS"

5. Sincronizar y Poblar la Base de Datos
Estos comandos crearán las tablas en tu base de datos de Supabase y la llenarán con los productos iniciales.

# Sincroniza el schema con la base de datos
npx prisma db push

# Ejecuta el script para añadir los productos
npx prisma db seed

6. Iniciar el Servidor de Desarrollo
npm run dev

¡Listo! Abre http://localhost:3000 en tu navegador para ver la aplicación en funcionamiento.

📦 Despliegue
La aplicación está optimizada para ser desplegada en Vercel, la plataforma de los creadores de Next.js. Simplemente conecta tu repositorio de GitHub, configura las variables de entorno y Vercel se encargará del resto.