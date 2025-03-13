import React from "react";
import { Card, Typography, Space, Radio, Empty } from "antd";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area, ComposedChart, Scatter } from "recharts";

const { Title, Text } = Typography;

// Cores para os gráficos
const COLORS = ["#1890ff", "#52c41a", "#fa8c16", "#722ed1", "#eb2f96", "#13c2c2", "#faad14", "#ff4d4f", "#2f54eb", "#fa541c"];
const COMPARISON_COLORS = {
  current: "#1890ff",
  previous: "#8bbdff",
  positive: "#52c41a",
  negative: "#ff4d4f",
  neutral: "#d9d9d9"
};

function ChartCard({ 
  title, 
  subtitle,
  data = [], 
  type = "bar", 
  height = 300, 
  xDataKey = "name",
  yDataKey = "value",
  compareData = null,
  showControls = false,
  selectedView = "bar",
  onViewChange = null,
  noDataMessage = "Sem dados para exibir",
  tooltipFormatter = (value) => value,
  extraContent = null,
  valueLabel = null,
  nameLabel = null,
  renderCustomChart = null
}) {
  // Verificar se não há dados
  const isEmpty = !data || data.length === 0;
  
  // Renderizar o gráfico adequado com base no tipo
  const renderChart = () => {
    if (isEmpty) {
      return (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description={noDataMessage}
          style={{ height: height, display: "flex", flexDirection: "column", justifyContent: "center" }} 
        />
      );
    }
    
    if (renderCustomChart) {
      return renderCustomChart(data, compareData, height);
    }

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={xDataKey} stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip 
                formatter={tooltipFormatter}
                contentStyle={{ backgroundColor: "#1e1e2f", border: "1px solid #333", borderRadius: "4px" }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend />
              <Bar 
                dataKey={yDataKey} 
                name={valueLabel || yDataKey} 
                fill="#1890ff" 
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
              {compareData && selectedView === "compare" && (
                <Bar 
                  dataKey={yDataKey} 
                  name="Período anterior" 
                  data={compareData} 
                  fill="#8bbdff" 
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                fill="#8884d8"
                paddingAngle={1}
                dataKey={yDataKey}
                nameKey={xDataKey}
                label={(entry) => entry[xDataKey]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={tooltipFormatter}
                contentStyle={{ backgroundColor: "#1e1e2f", border: "1px solid #333", borderRadius: "4px" }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case "area":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={xDataKey} stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip 
                formatter={tooltipFormatter}
                contentStyle={{ backgroundColor: "#1e1e2f", border: "1px solid #333", borderRadius: "4px" }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={yDataKey} 
                name={valueLabel || yDataKey} 
                stroke="#1890ff" 
                fill="#1890ff" 
                fillOpacity={0.3} 
              />
              {compareData && selectedView === "compare" && (
                <Area 
                  type="monotone" 
                  dataKey={yDataKey} 
                  name="Período anterior" 
                  data={compareData} 
                  stroke="#8bbdff" 
                  fill="#8bbdff" 
                  fillOpacity={0.2} 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case "comparison":
        if (!compareData) {
          return (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description="Comparação não disponível"
              style={{ height: height, display: "flex", flexDirection: "column", justifyContent: "center" }} 
            />
          );
        }
        
        // Preparar dados combinados para comparação
        const combinedData = data.map((item, index) => {
          const compareItem = compareData[index] || {};
          return {
            name: item[xDataKey],
            current: item[yDataKey] || 0,
            previous: compareItem[yDataKey] || 0,
            change: (item[yDataKey] || 0) - (compareItem[yDataKey] || 0)
          };
        });
        
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={combinedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip 
                formatter={tooltipFormatter}
                contentStyle={{ backgroundColor: "#1e1e2f", border: "1px solid #333", borderRadius: "4px" }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend />
              <Bar dataKey="current" name="Período atual" fill={COMPARISON_COLORS.current} radius={[4, 4, 0, 0]} />
              <Bar dataKey="previous" name="Período anterior" fill={COMPARISON_COLORS.previous} radius={[4, 4, 0, 0]} />
              <Scatter 
                dataKey="change" 
                name="Diferença" 
                fill="#fff"
                stroke="#fff"
                shape={(props) => {
                  const { cx, cy, value } = props;
                  const color = value > 0 ? COMPARISON_COLORS.positive : value < 0 ? COMPARISON_COLORS.negative : COMPARISON_COLORS.neutral;
                  const size = Math.min(Math.abs(value) * 0.5, 10) + 5;
                  
                  return (
                    <svg x={cx - size / 2} y={cy - size - 10} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d={value > 0 ? "M7 14l5-5 5 5H7z" : "M7 10l5 5 5-5H7z"} fill={color} />
                    </svg>
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
        
      default:
        return (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="Tipo de gráfico não suportado"
            style={{ height: height, display: "flex", flexDirection: "column", justifyContent: "center" }} 
          />
        );
    }
  };
  
  return (
    <Card 
      className="chart-card"
      style={{ 
        height: "100%", 
        borderRadius: "8px",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
        transition: "none",
        overflow: "hidden"
      }}
      headStyle={{ borderBottom: "none" }}
    >
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ 
            fontSize: "16px", 
            fontWeight: "600", 
            marginBottom: "4px", 
            color: "#E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            {title}
          </div>
          {subtitle && <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "13px" }}>{subtitle}</Text>}
        </div>
        
        {showControls && onViewChange && (
          <Space>
            <Radio.Group 
              value={selectedView} 
              onChange={(e) => onViewChange(e.target.value)} 
              size="small"
              style={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)" }}
            >
              <Radio.Button value="bar" style={{ borderColor: "#DFE1E6" }}>Barras</Radio.Button>
              <Radio.Button value="compare" style={{ borderColor: "#DFE1E6" }}>Comparar</Radio.Button>
            </Radio.Group>
          </Space>
        )}
      </div>
      
      {renderChart()}
      
      {extraContent && (
        <div style={{ marginTop: "16px" }}>
          {extraContent}
        </div>
      )}
    </Card>
  );
}

export default ChartCard;