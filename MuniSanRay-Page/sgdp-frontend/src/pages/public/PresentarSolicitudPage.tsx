import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { ClipboardCopy, Check, Send, ArrowRight, Mail } from 'lucide-react'
import { publicoService } from '../../services/publico.service'
import type { SolicitudPublicaResponse } from '../../types/publico.types'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Alert from '../../components/common/Alert'

const schema = z.object({
  nombreSolicitante: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(200, 'Máximo 200 caracteres'),
  dpiSolicitante: z
    .string()
    .min(1, 'El DPI es obligatorio')
    .regex(/^\d{13}$/, 'El DPI debe tener exactamente 13 dígitos'),
  correoSolicitante: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Correo electrónico inválido'),
  telefonoSolicitante: z.string().regex(/^\d{8}$/, 'El teléfono debe tener exactamente 8 dígitos').optional().or(z.literal('')),
  descripcionSolicitud: z
    .string()
    .min(20, 'Describa su solicitud con al menos 20 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
})

type FormData = z.infer<typeof schema>

function ConfirmacionScreen({
  resultado,
  onReset,
}: {
  resultado: SolicitudPublicaResponse
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(resultado.codigoExpediente).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-green-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud Presentada</h2>
      <p className="text-gray-500 mb-8">{resultado.mensaje}</p>

      {/* Expediente code */}
      <div className="bg-accent/10 border-2 border-accent rounded-2xl p-6 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Código de Expediente
        </p>
        <p className="text-3xl font-bold text-primary tracking-wide mb-4">
          {resultado.codigoExpediente}
        </p>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-600 text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Copiado
            </>
          ) : (
            <>
              <ClipboardCopy className="w-4 h-4" /> Copiar código
            </>
          )}
        </button>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Fecha de recepción</p>
          <p className="font-semibold text-gray-900">
            {format(new Date(resultado.fechaRecepcion), 'dd/MM/yyyy', { locale: es })}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Fecha límite de respuesta</p>
          <p className="font-semibold text-primary">
            {format(new Date(resultado.fechaLimite), 'dd/MM/yyyy', { locale: es })}
          </p>
        </div>
      </div>

      <Alert type="info">
        Guarde su código de expediente para consultar el estado de su solicitud en cualquier
        momento.
      </Alert>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          to="/seguimiento"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          Consultar seguimiento <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          onClick={onReset}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          Presentar otra solicitud
        </button>
      </div>
    </div>
  )
}

export default function PresentarSolicitudPage() {
  const [resultado, setResultado] = useState<SolicitudPublicaResponse | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombreSolicitante: '',
      dpiSolicitante: '',
      correoSolicitante: '',
      telefonoSolicitante: '',
      descripcionSolicitud: '',
    },
  })

  const descripcion = watch('descripcionSolicitud') ?? ''

  const mutation = useMutation({
    mutationFn: publicoService.presentarSolicitud,
    onSuccess: (data) => {
      setResultado(data)
    },
  })

  const onSubmit = (data: FormData) => {
    const payload = {
      nombreSolicitante: data.nombreSolicitante,
      dpiSolicitante: data.dpiSolicitante,
      correoSolicitante: data.correoSolicitante,
      descripcionSolicitud: data.descripcionSolicitud,
      ...(data.telefonoSolicitante ? { telefonoSolicitante: data.telefonoSolicitante } : {}),
    }
    mutation.mutate(payload)
  }

  const handleReset = () => {
    setResultado(null)
    mutation.reset()
    reset()
  }

  return (
    <>
      {/* Hero */}
      <div className="bg-primary text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Send className="w-6 h-6 text-accent" />
            <span className="text-accent text-sm font-semibold uppercase tracking-wide">
              LAIP · Art. 26
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Presentar Solicitud de Información</h1>
          <p className="text-primary-200 text-base max-w-2xl">
            Todo ciudadano tiene derecho a solicitar información pública. La municipalidad dispone
            de 10 días hábiles para responder (prorrogables por 10 días adicionales).
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {resultado ? (
          <ConfirmacionScreen resultado={resultado} onReset={handleReset} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Datos de la solicitud</h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Nombre */}
              <Input
                label="Nombre completo *"
                placeholder="Ingrese su nombre completo"
                error={errors.nombreSolicitante}
                {...register('nombreSolicitante')}
              />

              {/* DPI */}
              <Input
                label="Número de DPI *"
                placeholder="0000 00000 0101"
                maxLength={13}
                inputMode="numeric"
                error={errors.dpiSolicitante}
                {...register('dpiSolicitante', {
                  onChange: (e) => { e.target.value = e.target.value.replace(/\D/g, '') }
                })}
              />

              {/* Correo */}
              <div className="space-y-1">
                <Input
                  label="Correo electrónico *"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  error={errors.correoSolicitante}
                  {...register('correoSolicitante')}
                />
                <p className="flex items-center gap-1 text-xs text-blue-600">
                  <Mail className="w-3 h-3" />
                  Le enviaremos una confirmación con su código de expediente.
                </p>
              </div>

              {/* Teléfono */}
              <Input
                label="Teléfono (opcional)"
                type="tel"
                placeholder="55555555"
                maxLength={8}
                inputMode="numeric"
                error={errors.telefonoSolicitante}
                {...register('telefonoSolicitante', {
                  onChange: (e) => { e.target.value = e.target.value.replace(/\D/g, '') }
                })}
              />

              {/* Descripción */}
              <div className="space-y-1">
                <label
                  htmlFor="descripcionSolicitud"
                  className="block text-sm font-medium text-gray-700"
                >
                  Descripción de la solicitud *
                </label>
                <textarea
                  id="descripcionSolicitud"
                  rows={6}
                  placeholder="Describa con detalle la información que solicita (mínimo 20 caracteres)..."
                  className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none
                    ${errors.descripcionSolicitud ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('descripcionSolicitud')}
                />
                <div className="flex justify-between items-center">
                  {errors.descripcionSolicitud ? (
                    <p className="text-xs text-red-600">{errors.descripcionSolicitud.message}</p>
                  ) : (
                    <span />
                  )}
                  <p
                    className={`text-xs ml-auto ${descripcion.length > 1900 ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    {descripcion.length} / 2000
                  </p>
                </div>
              </div>

              {/* Error general */}
              {mutation.isError && (
                <Alert type="error">
                  Ocurrió un error al presentar su solicitud. Por favor verifique los datos e
                  intente de nuevo.
                </Alert>
              )}

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  loading={mutation.isPending}
                  size="lg"
                  className="w-full"
                >
                  <Send className="w-4 h-4" />
                  Presentar Solicitud
                </Button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Al presentar su solicitud acepta que sus datos serán tratados conforme a la LAIP.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
