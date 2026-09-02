package gt.gob.sanraymundo.sgdp.exception;

public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String message) {
        super(message);
    }

    public RecursoNoEncontradoException(String recurso, Long id) {
        super(recurso + " no encontrado con id: " + id);
    }

    public RecursoNoEncontradoException(String recurso, String campo, String valor) {
        super(recurso + " no encontrado con " + campo + ": " + valor);
    }
}
