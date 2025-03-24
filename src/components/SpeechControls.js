import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SpeechControls.css';

// 特殊音調預設
const VOICE_PRESETS = {
  normal: { pitch: 1.0, rate: 1.3 },
  mickey: { pitch: 1.8, rate: 1.4 }, // 米老鼠音調
  donald: { pitch: 0.7, rate: 1.5 }, // 唐老鴨音調
  robot: { pitch: 0.5, rate: 1.3 }, // 機器人音調
  fast: { pitch: 1.0, rate: 2.0 }, // 超快音調
};

const SpeechControls = ({ segments, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [voicePreset, setVoicePreset] = useState('normal');
  const [rate, setRate] = useState(VOICE_PRESETS.normal.rate);
  const [pitch, setPitch] = useState(VOICE_PRESETS.normal.pitch);
  const [expanded, setExpanded] = useState(false);
  const utteranceRef = useRef(null);
  
  // 自動開始播放第一段
  useEffect(() => {
    if (expanded && !isPlaying) {
      // 短暫延遲以確保UI已完成展開
      const timer = setTimeout(() => {
        playSpeech(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [expanded]);

  // 鍵盤控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!expanded) return;
      
      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault();
          playNextSegment();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playPreviousSegment();
          break;
        case ' ': // 空格鍵
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case '+': // 加速
        case '=': // 加號通常與等號同鍵
          e.preventDefault();
          adjustRate(0.1);
          break;
        case '-': // 減速
          e.preventDefault();
          adjustRate(-0.1);
          break;
        case '1': // 預設音調快捷鍵
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault();
          handleVoicePresetChange(e.key);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded, currentSegment, isPlaying, rate, pitch]);

  // 調整語速
  const adjustRate = (delta) => {
    setRate(prevRate => {
      const newRate = Math.max(0.5, Math.min(3.0, prevRate + delta));
      
      // 如果正在播放，立即更新當前播放的語音
      if (isPlaying && utteranceRef.current) {
        utteranceRef.current.rate = newRate;
      }
      
      return newRate;
    });
  };

  // 處理音調預設變更
  const handleVoicePresetChange = (key) => {
    const presetMap = {
      '1': 'normal',
      '2': 'mickey',
      '3': 'donald',
      '4': 'robot',
      '5': 'fast'
    };
    
    const preset = presetMap[key] || 'normal';
    setVoicePreset(preset);
    
    const { pitch: newPitch, rate: newRate } = VOICE_PRESETS[preset];
    setPitch(newPitch);
    setRate(newRate);
    
    // 如果正在播放，立即更新當前播放的語音
    if (isPlaying && utteranceRef.current) {
      utteranceRef.current.pitch = newPitch;
      utteranceRef.current.rate = newRate;
    }
  };

  const stopSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        playSpeech(currentSegment);
      }
    }
  }, [isPlaying, currentSegment]);

  const playSpeech = useCallback((segmentIndex) => {
    if (!segments[segmentIndex] || !window.speechSynthesis) return;

    // 取消任何正在進行的語音
    stopSpeech();

    const text = segments[segmentIndex].text;
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // 設定語言為繁體中文
    utterance.lang = 'zh-TW';
    
    // 設定語速和音調
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    // 播放結束事件
    utterance.onend = () => {
      if (segmentIndex < segments.length - 1) {
        setCurrentSegment(segmentIndex + 1);
        playSpeech(segmentIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };
    
    // 錯誤事件
    utterance.onerror = () => {
      console.error('語音播放錯誤');
      setIsPlaying(false);
    };
    
    // 播放語音
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setCurrentSegment(segmentIndex);
  }, [segments, rate, pitch, stopSpeech]);

  const playNextSegment = useCallback(() => {
    if (currentSegment < segments.length - 1) {
      playSpeech(currentSegment + 1);
    }
  }, [currentSegment, segments, playSpeech]);

  const playPreviousSegment = useCallback(() => {
    if (currentSegment > 0) {
      playSpeech(currentSegment - 1);
    }
  }, [currentSegment, playSpeech]);

  const handleClose = () => {
    stopSpeech();
    setExpanded(false);
  };

  const toggleExpand = () => {
    if (!expanded) {
      setExpanded(true);
    } else {
      handleClose();
    }
  };

  const handleSegmentClick = (index) => {
    playSpeech(index);
  };

  return (
    <div className={`speech-controls ${expanded ? 'expanded' : ''}`}>
      {!expanded ? (
        <button 
          className="speech-toggle-button"
          onClick={toggleExpand}
          aria-label="語音導覽"
          title="語音導覽 (Alt+S)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6v12M6 12h12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>語音</span>
        </button>
      ) : (
        <div className="speech-panel">
          <div className="speech-header">
            <h3>{title || '語音導覽'}</h3>
            <div className="speech-voice-controls">
              <div className="voice-rate-control">
                <button 
                  onClick={() => adjustRate(-0.1)} 
                  className="rate-button" 
                  title="降低語速 (-)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <span className="rate-display">{rate.toFixed(1)}x</span>
                <button 
                  onClick={() => adjustRate(0.1)} 
                  className="rate-button" 
                  title="提高語速 (+)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
              <div className="voice-preset-control">
                <select 
                  value={voicePreset} 
                  onChange={(e) => {
                    const preset = e.target.value;
                    setVoicePreset(preset);
                    setPitch(VOICE_PRESETS[preset].pitch);
                    setRate(VOICE_PRESETS[preset].rate);
                  }}
                  className="voice-preset-select"
                >
                  <option value="normal">正常</option>
                  <option value="mickey">米老鼠</option>
                  <option value="donald">唐老鴨</option>
                  <option value="robot">機器人</option>
                  <option value="fast">超快</option>
                </select>
              </div>
            </div>
            <button 
              className="speech-close-button" 
              onClick={handleClose}
              aria-label="關閉語音導覽"
              title="關閉 (Esc)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="speech-controls-main">
            <div className="speech-controls-buttons">
              <button 
                onClick={playPreviousSegment} 
                disabled={currentSegment <= 0}
                className="speech-control-button"
                title="上一段 (←)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>

              <button 
                onClick={togglePlayPause}
                className="speech-control-button primary"
                title={isPlaying ? "暫停 (空格)" : "播放 (空格)"}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </button>

              <button 
                onClick={playNextSegment}
                disabled={currentSegment >= segments.length - 1}
                className="speech-control-button"
                title="下一段 (→)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>

              <button 
                onClick={stopSpeech}
                className="speech-control-button"
                title="停止"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16"></rect>
                </svg>
              </button>
            </div>

            <div className="speech-shortcut-help">
              <span className="shortcut-item">空格:播放/暫停</span>
              <span className="shortcut-item">←→:上/下一段</span>
              <span className="shortcut-item">+/-:調整速度</span>
              <span className="shortcut-item">1-5:變更音調</span>
            </div>
          </div>

          <div className="speech-segments">
            {segments.map((segment, index) => (
              <div 
                key={index}
                className={`speech-segment ${currentSegment === index ? 'active' : ''}`}
                onClick={() => handleSegmentClick(index)}
              >
                <div className="speech-segment-indicator">
                  {currentSegment === index && isPlaying ? (
                    <div className="playing-indicator">
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                    </div>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="speech-segment-content">
                  {segment.title || `段落 ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechControls;