"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportStudiesUseCase = void 0;
class ImportStudiesUseCase {
    constructor(studyRepository) {
        this.studyRepository = studyRepository;
    }
    async execute(studies) {
        // Valida cada estudo antes de salvar - Validation is assumed to happen before this use case is called.
        // const validStudies = studies.filter(study => study.isValid()); // Removed unnecessary filtering
        if (studies.length === 0) { // Check the input array directly
            throw new Error('Nenhum estudo válido para importar');
        }
        // Salva os estudos no repositório
        return this.studyRepository.saveMany(studies); // Save the original array
    }
}
exports.ImportStudiesUseCase = ImportStudiesUseCase;
//# sourceMappingURL=ImportStudiesUseCase.js.map