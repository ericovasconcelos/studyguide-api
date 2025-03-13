/**
 * Utilitários para filtragem de dados
 */

/**
 * Filtra registros de estudo com base em vários critérios
 * @param {Array} records - Registros a serem filtrados
 * @param {string} subject - Filtro de disciplina ("all" para todas)
 * @param {Array} dates - Array com duas datas [dataInicial, dataFinal]
 * @param {string} period - Período predefinido ("all", "week", "month", "quarter", "year")
 * @returns {Array} Registros filtrados
 */
export const filterRecordsByPeriod = (records, subject, dates, period) => {
  console.log("Filtrando registros:", { records, subject, dates, period });
  
  // Proteção contra registros nulos
  if (!records || !Array.isArray(records)) {
    console.error("Registros inválidos:", records);
    return [];
  }
  
  let filtered = [...records];
  
  // Filtrar por matéria
  if (subject !== "all") {
    filtered = filtered.filter(record => record.subject === subject);
  }
  
  // Filtrar por intervalo de datas
  if (dates && dates.length === 2) {
    const [startDate, endDate] = dates;
    filtered = filtered.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }
  
  // Filtrar por período de tempo
  if (period !== "all") {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Final do dia atual
    
    let compareDate = new Date();
    compareDate.setHours(0, 0, 0, 0); // Início do dia
    
    switch (period) {
      case "week":
        compareDate.setDate(today.getDate() - 7);
        break;
      case "month":
        compareDate.setMonth(today.getMonth() - 1);
        break;
      case "quarter":
        compareDate.setMonth(today.getMonth() - 3);
        break;
      case "year":
        compareDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        break;
    }
    
    filtered = filtered.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= compareDate && recordDate <= today;
    });
  }
  
  return filtered;
};

/**
 * Calcula período de comparação com base em período atual
 * @param {string} comparisonType - Tipo de comparação ("previousPeriod", "sameLastYear")
 * @param {string} timeFrame - Período atual ("all", "week", "month", "quarter", "year")
 * @param {Array} dateRange - Intervalo de datas [dataInicial, dataFinal]
 * @returns {Object} comparisonDateRange e comparisonTimeFrame
 */
export const calculateComparisonPeriod = (comparisonType, timeFrame, dateRange) => {
  let comparisonDateRange = null;
  let comparisonTimeFrameValue = "all";
  
  // Calcular o período de comparação com base no período atual
  if (comparisonType === "previousPeriod") {
    // Se estamos usando timeFrame, usamos o período anterior equivalente
    if (timeFrame !== "all") {
      const today = new Date();
      const periodEnd = new Date();
      let periodStart = new Date();
      
      switch (timeFrame) {
        case "week":
          // Periodo atual: últimos 7 dias, período anterior: 7 dias antes disso
          periodStart.setDate(today.getDate() - 7);
          periodEnd.setDate(today.getDate() - 8);
          periodStart.setDate(periodEnd.getDate() - 7);
          comparisonDateRange = [periodStart, periodEnd];
          break;
        case "month":
          // Período atual: último mês, período anterior: mês antes disso
          periodStart.setMonth(today.getMonth() - 1);
          periodEnd.setDate(today.getDate() - 31);
          periodStart.setMonth(periodEnd.getMonth() - 1);
          comparisonDateRange = [periodStart, periodEnd];
          break;
        case "quarter":
          // Período atual: últimos 3 meses, período anterior: 3 meses antes disso
          periodStart.setMonth(today.getMonth() - 3);
          periodEnd.setDate(today.getDate() - 91);
          periodStart.setMonth(periodEnd.getMonth() - 3);
          comparisonDateRange = [periodStart, periodEnd];
          break;
        case "year":
          // Período atual: último ano, período anterior: ano antes disso
          periodStart.setFullYear(today.getFullYear() - 1);
          periodEnd.setDate(today.getDate() - 366);
          periodStart.setFullYear(periodEnd.getFullYear() - 1);
          comparisonDateRange = [periodStart, periodEnd];
          break;
        default:
          break;
      }
    } 
    // Se usamos dateRange específico, calculamos o mesmo período imediatamente anterior
    else if (dateRange) {
      const [startDate, endDate] = dateRange;
      const range = endDate - startDate; // duração em milissegundos
      const newEndDate = new Date(startDate);
      newEndDate.setMilliseconds(newEndDate.getMilliseconds() - 1); // um milissegundo antes do início atual
      const newStartDate = new Date(newEndDate - range); // mesmo intervalo de tempo
      comparisonDateRange = [newStartDate, newEndDate];
    }
  } 
  // Período de comparação específico
  else if (comparisonType === "sameLastYear") {
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      const newStartDate = new Date(startDate);
      const newEndDate = new Date(endDate);
      newStartDate.setFullYear(newStartDate.getFullYear() - 1);
      newEndDate.setFullYear(newEndDate.getFullYear() - 1);
      comparisonDateRange = [newStartDate, newEndDate];
    } else if (timeFrame !== "all") {
      comparisonTimeFrameValue = timeFrame;
      // Usamos a mesma lógica, mas a partir de um ano atrás
    }
  }
  
  return {
    comparisonDateRange,
    comparisonTimeFrameValue
  };
};