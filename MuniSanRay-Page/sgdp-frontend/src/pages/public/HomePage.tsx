import { Link } from 'react-router-dom'
import { FileText, Send, Search, Clock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="bg-primary text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Portal de Transparencia Municipal</h2>
          <p className="text-primary-200 text-lg">
            Acceda a información pública, presente solicitudes LAIP y dé seguimiento a sus trámites.
          </p>
        </div>
      </div>

      {/* Quick access cards */}
      <div className="max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: FileText,
              title: 'Información Pública',
              desc: 'Documentos LAIP Art. 10',
              href: '/informacion-publica',
            },
            {
              icon: Send,
              title: 'Presentar Solicitud',
              desc: 'Solicite información pública',
              href: '/solicitud',
            },
            {
              icon: Clock,
              title: 'Seguimiento',
              desc: 'Consulte el estado de su trámite',
              href: '/seguimiento',
            },
            {
              icon: Search,
              title: 'Buscar Documentos',
              desc: 'Busque en el repositorio público',
              href: '/buscar',
            },
          ].map((item) => (
            <Link
              key={item.title}
              to={item.href}
              className="bg-white rounded-xl shadow-sm border-2 border-transparent hover:border-accent transition-all p-6 group"
            >
              <item.icon className="w-8 h-8 text-primary mb-3 group-hover:text-accent transition-colors" />
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
