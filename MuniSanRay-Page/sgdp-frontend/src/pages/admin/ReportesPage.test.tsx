import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReportesPage from './ReportesPage'
import { useAuth } from '../../context/AuthContext'
import { reportesService } from '../../services/reportes.service'

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))
jest.mock('../../services/reportes.service')

const mockUseAuth = useAuth as jest.Mock
const mockReportesService = reportesService as jest.Mocked<typeof reportesService>

describe('ReportesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('OFICIAL no ve la tarjeta de Registro de Auditoría', () => {
    mockUseAuth.mockReturnValue({ user: { rol: 'OFICIAL' } })
    render(<ReportesPage />)

    expect(screen.getByText('Solicitudes de Información')).toBeInTheDocument()
    expect(screen.getByText('Repositorio Documental')).toBeInTheDocument()
    expect(screen.queryByText('Registro de Auditoría')).not.toBeInTheDocument()
  })

  it('ADMINISTRADOR ve la tarjeta de Registro de Auditoría', () => {
    mockUseAuth.mockReturnValue({ user: { rol: 'ADMINISTRADOR' } })
    render(<ReportesPage />)

    expect(screen.getByText('Registro de Auditoría')).toBeInTheDocument()
  })

  it('exportar CSV llama al servicio correcto', async () => {
    mockUseAuth.mockReturnValue({ user: { rol: 'ADMINISTRADOR' } })
    mockReportesService.exportarSolicitudesCsv.mockResolvedValueOnce(undefined)

    render(<ReportesPage />)

    const buttons = screen.getAllByText('Exportar CSV')
    fireEvent.click(buttons[0])

    await waitFor(() => expect(mockReportesService.exportarSolicitudesCsv).toHaveBeenCalledTimes(1))
  })

  it('muestra error si la exportación falla', async () => {
    mockUseAuth.mockReturnValue({ user: { rol: 'ADMINISTRADOR' } })
    mockReportesService.exportarSolicitudesPdf.mockRejectedValueOnce(new Error('fallo'))

    render(<ReportesPage />)

    const buttons = screen.getAllByText('Exportar PDF')
    fireEvent.click(buttons[0])

    expect(await screen.findByText('Error al generar el reporte. Intente nuevamente.')).toBeInTheDocument()
  })
})
