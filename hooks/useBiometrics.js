import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

/**
 * Hook para autenticación biométrica (huella / FaceID / PIN del sistema)
 * 
 * Uso:
 *   const { pedir } = useBiometrics();
 *   const ok = await pedir('Para acceder a Reportes');
 *   if (ok) { ... hacer lo que sea ... }
 */
export function useBiometrics() {

  const pedir = async (motivo = 'Identifícate para continuar') => {
    try {
      // ¿El dispositivo tiene hardware biométrico?
      const tieneHardware = await LocalAuthentication.hasHardwareAsync();
      if (!tieneHardware) {
        Alert.alert(
          'No disponible',
          'Tu dispositivo no tiene sensor biométrico. Configura un PIN en los ajustes de tu celular para proteger esta sección.',
          [{ text: 'Entendido' }]
        );
        return false;
      }

      // ¿Tiene huellas / Face ID registrados?
      const tieneRegistrado = await LocalAuthentication.isEnrolledAsync();
      if (!tieneRegistrado) {
        Alert.alert(
          'Sin huella registrada',
          'Para proteger esta sección necesitas registrar tu huella dactilar o Face ID en los ajustes de tu celular.',
          [{ text: 'Entendido' }]
        );
        return false;
      }

      // Pedir autenticación
      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: motivo,
        fallbackLabel: 'Usar PIN',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false, // permite usar PIN si la huella falla
      });

      return resultado.success;

    } catch (e) {
      console.log('Error biométrico:', e);
      return false;
    }
  };

  return { pedir };
}
