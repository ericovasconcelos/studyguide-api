import React from 'react';
import DashboardHeader from './DashboardHeader';

const DashboardHeaderSection = ({ cycleRound, cycleRounds, compareMode, setCompareMode, setIsModalVisible }) => {
  return (
    <DashboardHeader
      title="Painel de Estudos Profissional"
      subtitle="Analise seu desempenho, compare períodos e potencialize sua performance acadêmica"
      cycleRound={cycleRound}
      cycleRounds={cycleRounds}
      compareMode={compareMode}
      setCompareMode={setCompareMode}
      addButtonVisible={true}
      onAddButtonClick={() => setIsModalVisible(true)}
    />
  );
};

export default DashboardHeaderSection;