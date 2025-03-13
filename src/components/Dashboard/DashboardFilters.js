import React from 'react';
import { DatePicker, Select } from 'antd';

const { RangePicker } = DatePicker;
const { Option } = Select;

const DashboardFilters = ({
  dateRange,
  setDateRange,
  timeFrame,
  setTimeFrame,
  uniqueSubjects,
  subjectFilter,
  setSubjectFilter,
  cycleRound,
  cycleRounds,
  setCycleRound
}) => {
  return (
    <div>
      {/* Filtro de Data */}
      <RangePicker
        value={dateRange}
        onChange={setDateRange}
      />

      {/* Filtro de Matéria */}
      <Select
        mode="multiple"
        placeholder="Filtrar por Matéria"
        value={subjectFilter}
        onChange={setSubjectFilter}
        style={{ width: '100%' }}
      >
        {uniqueSubjects.map(subject => (
          <Option key={subject} value={subject}>{subject}</Option>
        ))}
      </Select>

      {/* Filtro de Ciclo */}
      <Select
        placeholder="Filtrar por Ciclo"
        value={cycleRound}
        onChange={setCycleRound}
        style={{ width: '100%' }}
      >
        <Option value="all">Todos os Ciclos</Option>
        {cycleRounds.map(round => (
          <Option key={round} value={round}>{round}</Option>
        ))}
      </Select>
    </div>
  );
};

export default DashboardFilters;