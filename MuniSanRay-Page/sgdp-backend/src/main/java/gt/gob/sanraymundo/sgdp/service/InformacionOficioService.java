package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.exception.RecursoNoEncontradoException;
import gt.gob.sanraymundo.sgdp.model.entity.InformacionOficio;
import gt.gob.sanraymundo.sgdp.repository.InformacionOficioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InformacionOficioService {

    private final InformacionOficioRepository oficioRepository;

    @Transactional(readOnly = true)
    public InformacionOficio obtenerEntidadPorId(Long id) {
        return oficioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("InformacionOficio", "id", id.toString()));
    }
}
