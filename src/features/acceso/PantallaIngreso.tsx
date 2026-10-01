import type { ConfirmationResult } from '@react-native-firebase/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { KeyboardAvoidingView, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'

import { ErrorApi } from '@/shared/api/cliente'
import { MarcaSga } from '@/shared/ui/MarcaSga'

import {
  cerrarVerificacion,
  enviarCodigo,
  esCodigoRechazado,
  escucharVerificacion,
  idTokenDelNumero,
  mensajeDeFirebase,
  usuarioVerificado,
} from './firebase'
import { PasoCodigo, type ResultadoDelCodigo } from './PasoCodigo'
import { PasoNombre, type DatosDePrimeraVez } from './PasoNombre'
import { PasoNumero } from './PasoNumero'
import { PasoVerificado } from './PasoVerificado'
import { ingresarMutation, ultimoNumeroQuery } from './queries'

type Paso =
  | {
      tipo: 'numero'
      /** El número al que se mandó el código, para corregirlo si se vuelve a este paso. */
      escrito?: string
    }
  | { tipo: 'codigo'; numero: string; confirmacion: ConfirmationResult; enviadoEn: number }
  | { tipo: 'verificado'; numero: string }
  | { tipo: 'nombre'; numero: string }

/**
 * Entrar y registrarse son el mismo camino para el ciudadano: su número, el código del SMS y, solo la primera vez, su
 * nombre con el aviso de privacidad. Al entrar, la sesión queda guardada y el guard del router cambia solo a las
 * pantallas de adentro.
 */
export function PantallaIngreso() {
  const margenes = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const ultimoNumero = useQuery(ultimoNumeroQuery())
  const ingresar = useMutation(ingresarMutation(queryClient))
  const [paso, setPaso] = useState<Paso>({ tipo: 'numero' })
  const [aviso, setAviso] = useState<string | null>(null)
  const [ingresando, setIngresando] = useState(false)
  // Cada paso nuevo abre un intento: lo que responde tarde un intento anterior ya no cambia la pantalla.
  const intento = useRef(0)
  // Una sola llamada al servidor a la vez: el código confirmado y la verificación de Android pueden llegar juntos.
  const llamandoAlServidor = useRef(false)

  function mostrar(siguiente: Paso, mensaje: string | null = null) {
    setPaso(siguiente)
    setAviso(mensaje)
  }

  async function pedirCodigo(numero: string) {
    const mio = ++intento.current
    setAviso(null)
    try {
      const confirmacion = await enviarCodigo(numero)
      if (mio === intento.current) {
        mostrar({ tipo: 'codigo', numero, confirmacion, enviadoEn: Date.now() })
      }
    } catch (error) {
      if (mio === intento.current) {
        setAviso(mensajeDeFirebase(error))
      }
    }
  }

  async function confirmarCodigo(
    numero: string,
    confirmacion: ConfirmationResult,
    codigo: string,
  ): Promise<ResultadoDelCodigo> {
    const mio = intento.current
    setAviso(null)
    try {
      await confirmacion.confirm(codigo)
    } catch (error) {
      // Si Android ya verificó el número por su cuenta, el código escrito llega tarde y falla: no importa.
      if (!usuarioVerificado(numero)) {
        if (mio === intento.current) {
          setAviso(mensajeDeFirebase(error))
        }
        return esCodigoRechazado(error) ? 'rechazado' : 'fallido'
      }
    }
    if (mio === intento.current) {
      await alVerificarNumero(numero)
    }
    return 'verificado'
  }

  /** El número quedó verificado, con el código o por Android: falta que el servidor abra la sesión. */
  async function alVerificarNumero(numero: string) {
    ++intento.current
    mostrar({ tipo: 'verificado', numero })
    await entrar(numero)
  }

  async function entrar(numero: string, primeraVez?: DatosDePrimeraVez) {
    if (llamandoAlServidor.current) {
      return
    }
    llamandoAlServidor.current = true
    setIngresando(true)
    setAviso(null)
    try {
      const idToken = await idTokenDelNumero(numero)
      if (!idToken) {
        mostrar({ tipo: 'numero', escrito: numero }, 'Vuelve a pedir el código para verificar tu número.')
        return
      }
      await ingresar.mutateAsync({ numero, idToken, ...primeraVez })
      // Adentro ya manda la sesión del servidor.
      void cerrarVerificacion()
    } catch (error) {
      alFallarElIngreso(numero, error)
    } finally {
      llamandoAlServidor.current = false
      setIngresando(false)
    }
  }

  function alFallarElIngreso(numero: string, error: unknown) {
    if (error instanceof ErrorApi && error.codigo === 'NOMBRE_REQUERIDO') {
      // Primera vez con este número. La verificación sigue valiendo: se vuelve a llamar con el nombre, sin otro SMS.
      mostrar({ tipo: 'nombre', numero }, paso.tipo === 'nombre' ? error.message : null)
      return
    }
    if (error instanceof ErrorApi && error.codigo === 'VERIFICACION_TELEFONO_INVALIDA') {
      // La verificación no sirve o venció: se empieza otra vez desde el número.
      void cerrarVerificacion()
      mostrar({ tipo: 'numero', escrito: numero }, error.message)
      return
    }
    // VERIFICACION_NO_DISPONIBLE, sin conexión o un error del servidor: el número sigue verificado y se reintenta la
    // llamada, sin pedir otro SMS.
    setAviso(error instanceof ErrorApi ? error.message : mensajeDeFirebase(error))
  }

  function cambiarNumero(numero: string) {
    ++intento.current
    // Una verificación que haya quedado abierta es de este número y no sirve para otro.
    void cerrarVerificacion()
    mostrar({ tipo: 'numero', escrito: numero })
  }

  // Android puede verificar el número sin que la persona escriba el código: si pasa, se sigue solo.
  const numeroEsperandoCodigo = paso.tipo === 'codigo' ? paso.numero : null
  const alVerificarPorSuCuenta = useEffectEvent((numero: string) => {
    void alVerificarNumero(numero)
  })

  useEffect(() => {
    if (numeroEsperandoCodigo === null) {
      return
    }
    return escucharVerificacion(numeroEsperandoCodigo, () => alVerificarPorSuCuenta(numeroEsperandoCodigo))
  }, [numeroEsperandoCodigo])

  // El último número se lee antes de pintar el primer paso, para que aparezca ya escrito.
  if (ultimoNumero.isPending) {
    return <YStack flex={1} bg="$fondo" />
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <YStack flex={1} bg="$fondo" px={24} pt={margenes.top + 32} pb={margenes.bottom + 24}>
          <MarcaSga tamano={48} />

          {paso.tipo === 'numero' ? (
            <PasoNumero
              inicial={paso.escrito ?? ultimoNumero.data ?? ''}
              aviso={aviso}
              onEnviarCodigo={pedirCodigo}
            />
          ) : null}

          {paso.tipo === 'codigo' ? (
            <PasoCodigo
              // Con cada SMS nuevo el campo empieza vacío: el código del anterior ya no sirve.
              key={paso.enviadoEn}
              numero={paso.numero}
              enviadoEn={paso.enviadoEn}
              aviso={aviso}
              onConfirmar={(codigo) => confirmarCodigo(paso.numero, paso.confirmacion, codigo)}
              onReenviar={() => pedirCodigo(paso.numero)}
              onCambiarNumero={() => cambiarNumero(paso.numero)}
            />
          ) : null}

          {paso.tipo === 'verificado' ? (
            <PasoVerificado
              ingresando={ingresando}
              aviso={aviso}
              onReintentar={() => void entrar(paso.numero)}
              onCambiarNumero={() => cambiarNumero(paso.numero)}
            />
          ) : null}

          {paso.tipo === 'nombre' ? (
            <PasoNombre
              numero={paso.numero}
              aviso={aviso}
              onEntrar={(datos) => entrar(paso.numero, datos)}
              onCambiarNumero={() => cambiarNumero(paso.numero)}
            />
          ) : null}
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
