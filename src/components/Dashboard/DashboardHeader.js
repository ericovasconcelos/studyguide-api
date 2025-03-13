import React from "react";
import styled from 'styled-components';
import { Typography, Button, Space, Tag } from "antd";
import { BookOutlined, SwapOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const GradientBackgroundTopRight = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top right, rgba(56, 189, 248, 0.3) 0%, transparent 50%);
  z-index: 1;
`;

const GradientBackgroundBottomLeft = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at bottom left, rgba(124, 58, 237, 0.2) 0%, transparent 50%);
  z-index: 1;
`;

const HeaderWrapper = styled.div`
  position: relative;
  z-index: 2;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledTitle = styled(Title)`
  color: #fff;
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
`;

function DashboardHeader({
  title = "Painel de Estudos Profissional",
  subtitle = "Analise seu desempenho, compare períodos e potencialize sua performance acadêmica",
  cycleRound = "all",
  cycleRounds = [],
  compareMode = false,
  setCompareMode = () => {},
  addButtonVisible = true,
  onAddButtonClick = () => {},
  style = {}
}) {
  // Encontrar a rodada atual pelo número
  const currentRound = cycleRound !== "all" ? 
    cycleRounds.find(r => r.number?.toString() === cycleRound) : null;
  
  return (
    <div style={{ 
      background: "linear-gradient(120deg, #3366CC 0%, #0747A6 100%)",
      padding: "30px", 
      borderRadius: "8px", 
      marginBottom: "24px",
      boxShadow: "0 4px 12px rgba(9, 30, 66, 0.15)",
      position: "relative",
      overflow: "hidden",
      ...style
    }}>
      <GradientBackgroundTopRight />
      <GradientBackgroundBottomLeft />
      
      <HeaderWrapper>
        <HeaderContent>
          <StyledTitle level={2}>
            <BookOutlined style={{ marginRight: "12px", fontSize: "28px" }} /> 
            {title}
            {currentRound && (
              <Tag color="blue" style={{ 
                marginLeft: 12, 
                verticalAlign: "middle", 
                fontSize: 14,
                background: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.3)",
                padding: "4px 12px",
                borderRadius: "10px"
              }}>
                Rodada {cycleRound} {currentRound?.isComplete ? '(completa)' : '(atual)'}
              </Tag>
            )}
          </StyledTitle>
          
          <Space>
            {addButtonVisible && (
              <Button 
                type="primary" 
                ghost 
                onClick={onAddButtonClick}
                style={{ borderColor: "rgba(255,255,255,0.7)", color: "#fff" }}
              >
                Adicionar Registro
              </Button>
            )}
            
            <Button 
              type={compareMode ? "primary" : "default"}
              icon={<SwapOutlined />} 
              onClick={() => setCompareMode(!compareMode)}
              style={{ 
                backgroundColor: compareMode ? "rgba(255,255,255,0.2)" : "transparent", 
                borderColor: "rgba(255,255,255,0.7)", 
                color: "#fff" 
              }}
            >
              {compareMode ? "Desativar Comparação" : "Comparar Períodos"}
            </Button>
          </Space>
        </HeaderContent>
        
        <Paragraph style={{ 
          color: "#fff", 
          opacity: 0.9, 
          marginTop: "12px",
          fontSize: "16px",
          maxWidth: "800px",
          margin: "12px auto 0"
        }}>
          {subtitle}
        </Paragraph>
      </HeaderWrapper>
    </div>
  );
}

export default DashboardHeader;