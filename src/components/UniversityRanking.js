import React from 'react';
import SpeechControls from './SpeechControls';

const UniversityRanking = ({ data }) => {
  // Prepare speech segments
  const speechSegments = [
    {
      title: '排名概覽',
      text: `以下是問題最多的${data.length}所大學排名。`,
      type: 'heading'
    },
    ...data.map((uni, index) => ({
      title: `第${index + 1}名：${uni.name}`,
      text: `第${index + 1}名是${uni.name}，共有${uni.totalIssues}個問題，${
        index === 0 
          ? '位居首位，需要最優先改善。' 
          : `比第${index}名少${data[index-1].totalIssues - uni.totalIssues}個問題。`
      }`,
      type: index === 0 ? 'stat' : 'detail'
    })),
    {
      title: '總結',
      text: `從排名可以看出，${data[0]?.name || ''}的問題最為嚴重，應該優先處理。`,
      type: 'heading'
    }
  ];

  return (
    <div className="ranking-card">
      <div className="ranking-header">
        <h2 className="ranking-title">問題最多的大學</h2>
        <SpeechControls 
          segments={speechSegments}
          title="大學排名語音導覽"
        />
      </div>
      <div className="ranking-list">
        {data.map((uni, index) => (
          <div key={uni.id} className="ranking-item">
            <div className="ranking-position blue">
              <span className="ranking-position-text blue">{index + 1}</span>
            </div>
            <div className="ranking-info">
              <div className="ranking-name">{uni.name}</div>
              <div className="ranking-details">{uni.totalIssues} 個問題</div>
            </div>
            <div className="ranking-progress">
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill blue"
                  style={{ 
                    width: `${data[0]?.totalIssues ? 
                      (uni.totalIssues / data[0].totalIssues) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="no-data">無數據</div>
        )}
      </div>
    </div>
  );
};

export default UniversityRanking;