import React from 'react';
import { Card, Space, Select, DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { StudyCycle } from '../types';
import '../styles.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface DashboardFiltersProps {
  subjects: string[];
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  dateRange: [Dayjs, Dayjs] | null;
  onDateRangeChange: (dates: [Dayjs, Dayjs] | null) => void;
  studyCycles?: StudyCycle[];
  selectedCycleId?: string | number;
  onCycleChange?: (cycleId: string | number) => void;
  rounds?: number[];
  selectedRound?: number;
  onRoundChange?: (round: number) => void;
}

const selectStyle = {
  width: 200,
  backgroundColor: 'transparent'
};

// Estilos para sobrescrever o tema escuro
const dropdownStyle = {
  backgroundColor: '#fff',
  color: 'rgba(0, 0, 0, 0.88)'
};

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  subjects,
  selectedSubject,
  onSubjectChange,
  dateRange,
  onDateRangeChange,
  studyCycles,
  selectedCycleId,
  onCycleChange,
  rounds,
  selectedRound,
  onRoundChange
}) => {
  return (
    <Card 
      className="mb-6 shadow-sm" 
      style={{ background: '#fff' }}
    >
      <Space size="large" wrap style={{ width: '100%', justifyContent: 'flex-start' }}>
        {studyCycles && onCycleChange && (
          <Select
            style={selectStyle}
            value={selectedCycleId}
            onChange={onCycleChange}
            placeholder="Ciclo de estudos"
            popupClassName="light-theme-dropdown"
            dropdownStyle={dropdownStyle}
          >
            <Option value="all">Todos os ciclos</Option>
            {studyCycles.map(cycle => (
              <Option key={cycle.id} value={cycle.id}>{cycle.name || `Ciclo ${cycle.id}`}</Option>
            ))}
          </Select>
        )}

        {rounds && onRoundChange && (
          <Select
            style={selectStyle}
            value={selectedRound}
            onChange={onRoundChange}
            placeholder="Rodada"
            popupClassName="light-theme-dropdown"
            dropdownStyle={dropdownStyle}
          >
            <Option value={0}>Todas as rodadas</Option>
            {rounds.map(round => (
              <Option key={round} value={round}>Rodada {round}</Option>
            ))}
          </Select>
        )}

        <Select
          style={selectStyle}
          value={selectedSubject}
          onChange={onSubjectChange}
          placeholder="Filtrar por matéria"
          popupClassName="light-theme-dropdown"
          dropdownStyle={dropdownStyle}
        >
          <Option value="all">Todas as matérias</Option>
          {subjects.map(subject => (
            <Option key={subject} value={subject}>{subject}</Option>
          ))}
        </Select>

        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            onDateRangeChange(dates as [Dayjs, Dayjs] | null);
          }}
          style={{ 
            width: 280,
            backgroundColor: 'transparent'
          }}
          popupClassName="light-theme-dropdown"
          dropdownClassName="light-theme-dropdown"
        />
      </Space>
    </Card>
  );
};

export default DashboardFilters; 