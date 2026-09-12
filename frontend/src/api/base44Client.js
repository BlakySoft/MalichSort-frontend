// Reemplaza el cliente del SDK de Base44 por nuestro propio cliente API.
// Se mantiene el nombre "base44" exportado para no tener que tocar
// cada archivo del frontend que hace `import { base44 } from '@/api/base44Client'`.
import { apiClient } from './apiClient';

export const base44 = apiClient;
