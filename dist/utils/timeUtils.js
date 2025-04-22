"use strict";
/**
 * Utilitários para formatação e cálculos relacionados a tempo
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateDiffInDays = exports.secondsToTimeFormat = exports.parseTimeToMinutes = void 0;
exports.formatMinutesToHoursMinutes = formatMinutesToHoursMinutes;
/**
 * Formata um número de minutos para o formato "Xh Ym"
 * @param {number} minutes - Número de minutos
 * @returns {string} Tempo formatado
 */
function formatMinutesToHoursMinutes(minutes) {
    if (!minutes)
        return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
/**
 * Converte uma string de tempo no formato "h:mm" para minutos
 * @param {string} timeString - String de tempo no formato "h:mm"
 * @returns {number} Minutos totais
 */
const parseTimeToMinutes = (timeString) => {
    if (!timeString || typeof timeString !== 'string')
        return 0;
    try {
        const parts = timeString.split(":");
        if (parts.length !== 2)
            return 0;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (isNaN(hours) || isNaN(minutes))
            return 0;
        return hours * 60 + minutes;
    }
    catch (e) {
        console.warn("Erro ao converter tempo para minutos:", e);
        return 0;
    }
};
exports.parseTimeToMinutes = parseTimeToMinutes;
/**
 * Converte segundos para o formato "h:mm"
 * @param {number} seconds - Segundos para converter
 * @returns {string} Tempo formatado como "h:mm"
 */
const secondsToTimeFormat = (seconds) => {
    if (!seconds || isNaN(seconds))
        return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${String(minutes).padStart(2, '0')}`;
};
exports.secondsToTimeFormat = secondsToTimeFormat;
/**
 * Calcula a diferença entre duas datas em dias
 * @param {Date|string} date1 - Primeira data
 * @param {Date|string} date2 - Segunda data
 * @returns {number} Diferença em dias
 */
const dateDiffInDays = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    // Verificar se as datas são válidas
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()))
        return 0;
    // Limpar horas/minutos/segundos para comparar apenas datas
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    // Calcular diferença em dias
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};
exports.dateDiffInDays = dateDiffInDays;
//# sourceMappingURL=timeUtils.js.map