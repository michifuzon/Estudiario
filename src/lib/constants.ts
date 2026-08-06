/**
 * Mail con acceso al panel de administración (/admin). El control real que
 * importa vive del lado del servidor en supabase/migrations/0002_accounts.sql
 * (función is_admin()) — esta constante solo decide si se muestra el enlace
 * en la interfaz.
 */
export const ADMIN_EMAIL = 'miasilvestrini@gmail.com'
