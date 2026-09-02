import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, ShieldCheck } from 'lucide-react'
import Button from '../../components/common/Button'
import { reportesService } from '../../services/reportes.service'
import { useAuth } from '../../context/AuthContext'

interface ReportCardProps {
  icon: React.ReactNode
  title: string
  description: string
  actions: { label: string; fn: () => Promise<void>; tipo: 'csv' | 'pdf' }[]
}

function ReportCard({ icon, title, description, actions }: ReportCardProps) {
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (fn: () => Promise<void>, idx: number) => {
    setLoadingIdx(idx)
    setError(null)
    try {
      await fn()
    } catch {
      setError('Error al generar el reporte. Intente nuevamente.')
    } finally {
      setLoadingIdx(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 flex-wrap">
        {actions.map((action, idx) => (
          <Button
            key={action.label}
            size="sm"
            variant={action.tipo === 'pdf' ? 'ghost' : 'primary'}
            onClick={() => handleExport(action.fn, idx)}
            loading={loadingIdx === idx}
            className="self-start"
          >
            <Download size={14} />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default function ReportesPage() {
  const { user } = useAuth()
  const esAdministrador = user?.rol === 'ADMINISTRADOR'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Exportación de datos para cumplimiento LAIP y gestión municipal
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <ReportCard
          icon={<FileSpreadsheet size={20} />}
          title="Solicitudes de Información"
          description="Listado completo de todas las solicitudes LAIP con estado, fechas, solicitante y oficial asignado."
          actions={[
            { label: 'Exportar CSV', fn: reportesService.exportarSolicitudesCsv, tipo: 'csv' },
            { label: 'Exportar PDF', fn: reportesService.exportarSolicitudesPdf, tipo: 'pdf' },
          ]}
        />

        <ReportCard
          icon={<FileText size={20} />}
          title="Repositorio Documental"
          description="Inventario de documentos institucionales con nivel de acceso, estado y hashes de integridad SHA-256."
          actions={[
            { label: 'Exportar CSV', fn: reportesService.exportarDocumentosCsv, tipo: 'csv' },
            { label: 'Exportar PDF', fn: reportesService.exportarDocumentosPdf, tipo: 'pdf' },
          ]}
        />

        {esAdministrador && (
          <ReportCard
            icon={<ShieldCheck size={20} />}
            title="Registro de Auditoría"
            description="Trazabilidad completa de acciones de usuarios: accesos, descargas, modificaciones y eventos de seguridad."
            actions={[
              { label: 'Exportar CSV', fn: reportesService.exportarAuditoriaCsv, tipo: 'csv' },
              { label: 'Exportar PDF', fn: reportesService.exportarAuditoriaPdf, tipo: 'pdf' },
            ]}
          />
        )}
      </div>
    </div>
  )
}
