import { Share } from 'react-native';

export { BackHandler, ToastAndroid } from 'react-native';

/** Copia de seguridad: en Android se manda con Compartir (Drive, correo, notas…). */
export const compartirCopia = async (texto: string, nombre: string) => { await Share.share({ title: nombre, message: texto }); };
/** Elegir un archivo de copia: en Android se pega el texto (sin permisos de archivos). */
export const abrirCopia: (() => Promise<string | undefined>) | undefined = undefined;
