import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SpeechControls from './SpeechControls';

const CategoryDistributionChart = ({ data }) => {
  // Prepare sorted data
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 6);
  
  // Prepare speech segments
  const speechSegments = [
    {
      title: '圖表概覽',
      text: `問題類別分布圖顯示了前6個最常見的問題類型。`,
      type: 'heading'
    },
    ...sortedData.map((item, index) => ({
      title: `${item.name} - ${item.value}個問題`,
      text: `第${index + 1}名是${item.name}，共有${item.value}個問題。`,
      type: index === 0 ? 'stat' : 'detail'
    }))
  ];

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h2 className="chart-title">問題類別分布</h2>
        <SpeechControls 
          segments={speechSegments} 
          title="問題類別分布語音導覽"
        />
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip formatter={(value) => [`${value} 個問題`, '數量']} />
            <Bar dataKey="value" fill="#6366F1" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoryDistributionChart;