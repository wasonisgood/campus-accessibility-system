import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SpeechControls.css';

// 語音預設
const VOICE_PRESETS = {
  normal: { pitch: 1.0, rate: 1.3 },
  mickey: { pitch: 1.8, rate: 1.4 }, // 米老鼠音調
  donald: { pitch: 0.7, rate: 1.5 }, // 唐老鴨音調
  robot: { pitch: 0.5, rate: 1.3 }, // 機器人音調
  fast: { pitch: 1.0, rate: 2.0 }, // 超快音調
};

// 移除原本的 AMBIENT_SOUNDS 物件並用以下取代
const AMBIENT_SOUNDS = {
    none: { name: '無背景音', type: 'none' },
    whitenoise: { name: '白噪音', type: 'generator', generator: 'white' },
    pinknoise: { name: '粉紅噪音', type: 'generator', generator: 'pink' },
    brownnoise: { name: '棕色噪音', type: 'generator', generator: 'brown' },
    coffee: { name: '咖啡廳', type: 'generator', generator: 'coffee' },
    rain: { name: '下雨', type: 'generator', generator: 'rain' },
    nature: { name: '大自然', type: 'generator', generator: 'nature' },
    traffic: { name: '交通', type: 'generator', generator: 'traffic' },
    office: { name: '辦公室', type: 'generator', generator: 'office' },
  };
  
  // 新增這個聲音生成函數
  const createAudioGenerator = (type, audioContext, volume = 0.2) => {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    
    let sourceNode;
    
    switch (type) {
      case 'white':
        // 白噪音生成器
        const bufferSize = 2 * audioContext.sampleRate;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = noiseBuffer;
        sourceNode.loop = true;
        break;
        
      case 'pink':
        // 粉紅噪音生成器 (1/f 噪音)
        const pinkBufferSize = 2 * audioContext.sampleRate;
        const pinkBuffer = audioContext.createBuffer(1, pinkBufferSize, audioContext.sampleRate);
        const pinkOutput = pinkBuffer.getChannelData(0);
        
        // 粉紅噪音算法
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        
        for (let i = 0; i < pinkBufferSize; i++) {
          const white = Math.random() * 2 - 1;
          
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          
          pinkOutput[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
        
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = pinkBuffer;
        sourceNode.loop = true;
        break;
        
      case 'brown':
        // 棕色噪音生成器 (1/f² 噪音)
        const brownBufferSize = 2 * audioContext.sampleRate;
        const brownBuffer = audioContext.createBuffer(1, brownBufferSize, audioContext.sampleRate);
        const brownOutput = brownBuffer.getChannelData(0);
        
        let lastOut = 0.0;
        
        for (let i = 0; i < brownBufferSize; i++) {
          const white = Math.random() * 2 - 1;
          
          // 算法系數可調整濾波特性
          lastOut = (lastOut + (0.02 * white)) / 1.02;
          brownOutput[i] = lastOut * 3.5; // 調整幅度
        }
        
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = brownBuffer;
        sourceNode.loop = true;
        break;
        
      case 'coffee':
        // 咖啡廳環境音效模擬器
        return createComplexAmbientSound(audioContext, 'coffee', volume);
        
      case 'rain':
        // 雨聲模擬器
        return createComplexAmbientSound(audioContext, 'rain', volume);
        
      case 'nature':
        // 大自然環境音效模擬器
        return createComplexAmbientSound(audioContext, 'nature', volume);
        
      case 'traffic':
        // 交通環境音效模擬器
        return createComplexAmbientSound(audioContext, 'traffic', volume);
        
      case 'office':
        // 辦公室環境音效模擬器
        return createComplexAmbientSound(audioContext, 'office', volume);
        
      default:
        // 預設為白噪音
        return createAudioGenerator('white', audioContext, volume);
    }
    
    sourceNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return {
      source: sourceNode,
      gain: gainNode,
      start: () => {
        try {
          sourceNode.start(0);
        } catch (e) {
          console.warn('啟動音源時發生錯誤:', e);
        }
      },
      stop: () => {
        try {
          sourceNode.stop(0);
          sourceNode.disconnect();
          gainNode.disconnect();
        } catch (e) {
          console.warn('停止音源時發生錯誤:', e);
        }
      },
      setVolume: (value) => {
        gainNode.gain.value = value;
      }
    };
  };
  
  // 複雜環境音效生成器
  const createComplexAmbientSound = (audioContext, type, volume = 0.2) => {
    const masterGain = audioContext.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioContext.destination);
    
    // 用於存儲和管理所有產生的聲音節點
    const soundNodes = [];
    
    switch (type) {
      case 'coffee':
        // 咖啡廳環境：人聲嘈雜 + 杯盤碰撞 + 咖啡機
        createCoffeeShopAmbience(audioContext, masterGain, soundNodes);
        break;
        
      case 'rain':
        // 雨聲：持續雨滴 + 偶爾的雷聲
        createRainAmbience(audioContext, masterGain, soundNodes);
        break;
        
      case 'nature':
        // 大自然：風聲 + 樹葉 + 鳥叫
        createNatureAmbience(audioContext, masterGain, soundNodes);
        break;
        
      case 'traffic':
        // 交通：汽車引擎 + 喇叭聲 + 環境噪音
        createTrafficAmbience(audioContext, masterGain, soundNodes);
        break;
        
      case 'office':
        // 辦公室：鍵盤打字 + 打印機 + 低語聲
        createOfficeAmbience(audioContext, masterGain, soundNodes);
        break;
    }
    
    return {
      gain: masterGain,
      start: () => {
        soundNodes.forEach(node => {
          if (node.source && node.start) {
            node.start();
          }
        });
      },
      stop: () => {
        soundNodes.forEach(node => {
          if (node.source && node.stop) {
            node.stop();
          }
        });
        masterGain.disconnect();
      },
      setVolume: (value) => {
        masterGain.gain.value = value;
      }
    };
  };
  
  // 咖啡廳環境音效
  const createCoffeeShopAmbience = (audioContext, outputNode, soundNodes) => {
    // 人聲基底噪音 (使用過濾的白噪音模擬)
    const crowdNoiseGenerator = () => {
      const bufferSize = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // 使用過濾的噪音創建人聲嘈雜環境
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 0.12; // 低振幅
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      // 用於塑造頻率特性的濾波器
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 500; // 中頻偏低，模擬遠處嘈雜聲
      filter.Q.value = 0.7;
      
      const gain = audioContext.createGain();
      gain.gain.value = 0.6;
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(outputNode);
      
      soundNodes.push({
        source,
        start: () => source.start(0),
        stop: () => {
          source.stop(0);
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        }
      });
    };
    
    // 咖啡機噴氣聲效果
    const coffeeBrewingGenerator = () => {
      // 白噪音基底
      const bufferSize = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      // 高通濾波器模擬蒸汽聲
      const filter = audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      
      // 加入調幅節點製造不規則的蒸汽噴發效果
      const modulator = createSteamModulator(audioContext);
      
      const gain = audioContext.createGain();
      gain.gain.value = 0.15;
      
      source.connect(filter);
      filter.connect(gain);
      
      // 連接調幅控制
      modulator.connect(gain.gain);
      
      gain.connect(outputNode);
      
      soundNodes.push({
        source,
        start: () => {
          source.start(0);
          modulator.source.start(0);
        },
        stop: () => {
          source.stop(0);
          modulator.source.stop(0);
          source.disconnect();
          modulator.source.disconnect();
          filter.disconnect();
          gain.disconnect();
        }
      });
    };
    
    // 蒸汽調幅器
    const createSteamModulator = (audioContext) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 0.1; // 非常緩慢的調變
      
      const modulatorGain = audioContext.createGain();
      modulatorGain.gain.value = 0.8;
      
      oscillator.connect(modulatorGain);
      
      return {
        source: oscillator,
        connect: (target) => modulatorGain.connect(target)
      };
    };
    
    // 杯盤碰撞聲生成器（隨機事件）
    const dishClinkGenerator = () => {
      const generateClink = () => {
        // 建立短暫的衰減正弦波
        const length = audioContext.sampleRate * 0.3; // 300ms
        const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        const frequency = 800 + Math.random() * 1200; // 800-2000Hz
        const decay = 15 + Math.random() * 10; // 衰減速率
        
        for (let i = 0; i < length; i++) {
          // 衰減正弦波
          data[i] = Math.sin(i * 2 * Math.PI * frequency / audioContext.sampleRate) * 
                   Math.exp(-i / (audioContext.sampleRate / decay));
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gain = audioContext.createGain();
        gain.gain.value = 0.1 + Math.random() * 0.1; // 隨機音量
        
        source.connect(gain);
        gain.connect(outputNode);
        
        source.start(0);
        
        // 播放完畢後清理資源
        setTimeout(() => {
          source.disconnect();
          gain.disconnect();
        }, 300);
      };
      
      // 定期隨機產生杯盤聲
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30%的機率
          generateClink();
        }
      }, 2000 + Math.random() * 5000); // 2-7秒隨機間隔
      
      soundNodes.push({
        start: () => {}, // 已在建立時啟動
        stop: () => clearInterval(interval)
      });
    };
    
    // 激活所有咖啡廳聲音生成器
    crowdNoiseGenerator();
    coffeeBrewingGenerator();
    dishClinkGenerator();
  };
  
  // 雨聲環境音效
  const createRainAmbience = (audioContext, outputNode, soundNodes) => {
    // 持續雨滴基底噪音
    const rainNoiseGenerator = () => {
      const bufferSize = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      // 濾波器模擬雨聲頻率特性
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2500;
      filter.Q.value = 0.4;
      
      const gain = audioContext.createGain();
      gain.gain.value = 0.25;
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(outputNode);
      
      soundNodes.push({
        source,
        start: () => source.start(0),
        stop: () => {
          source.stop(0);
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        }
      });
    };
    
    // 生成突發的雷聲
    const thunderGenerator = () => {
      const generateThunder = () => {
        const duration = 2 + Math.random() * 3; // 2-5秒
        const length = audioContext.sampleRate * duration;
        const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成低頻噪音
        for (let i = 0; i < length; i++) {
          // 指數衰減的低頻噪音
          const progress = i / length;
          let amplitude = Math.exp(-progress * 3) * 0.8; // 初始振幅大，快速衰減
          
          // 加入隨機變化
          if (Math.random() > 0.995) {
            amplitude *= 1.5; // 偶爾的振幅峰值模擬雷聲起伏
          }
          
          data[i] = (Math.random() * 2 - 1) * amplitude;
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        // 低通濾波器加強低頻感
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 120;
        
        const gain = audioContext.createGain();
        gain.gain.value = 0.3 + Math.random() * 0.4; // 隨機音量
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(outputNode);
        
        source.start(0);
        
        // 播放完畢後清理資源
        setTimeout(() => {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        }, duration * 1000);
      };
      
      // 定期隨機產生雷聲
      const interval = setInterval(() => {
        if (Math.random() > 0.9) { // 10%的機率
          generateThunder();
        }
      }, 20000 + Math.random() * 60000); // 20-80秒隨機間隔
      
      soundNodes.push({
        start: () => {}, // 已在建立時啟動
        stop: () => clearInterval(interval)
      });
    };
    
    // 激活所有雨聲生成器
    rainNoiseGenerator();
    thunderGenerator();
  };
  
  // 大自然環境音效
  const createNatureAmbience = (audioContext, outputNode, soundNodes) => {
    // 風聲基底
    const windGenerator = () => {
      const bufferSize = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // 使用過濾的噪音模擬風聲
      let lastValue = 0;
      for (let i = 0; i < bufferSize; i++) {
        // 棕色噪音算法（更接近自然風聲）
        lastValue = (lastValue + (Math.random() * 2 - 1) * 0.02) / 1.02;
        data[i] = lastValue * 3;
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      // 風聲濾波器
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 250;
      filter.Q.value = 0.5;
      
      // 風聲調變（風的起伏）
      const modulator = createWindModulator(audioContext);
      
      const gain = audioContext.createGain();
      gain.gain.value = 0.2;
      
      source.connect(filter);
      filter.connect(gain);
      
      // 連接調幅控制
      modulator.connect(gain.gain);
      
      gain.connect(outputNode);
      
      soundNodes.push({
        source,
        start: () => {
          source.start(0);
          modulator.source.start(0);
        },
        stop: () => {
          source.stop(0);
          modulator.source.stop(0);
          source.disconnect();
          modulator.source.disconnect();
          filter.disconnect();
          gain.disconnect();
        }
      });
    };
    
    // 風聲調變器
    const createWindModulator = (audioContext) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 0.05 + Math.random() * 0.05; // 非常緩慢的調變
      
      const modulatorGain = audioContext.createGain();
      modulatorGain.gain.value = 0.5;
      
      oscillator.connect(modulatorGain);
      
      return {
        source: oscillator,
        connect: (target) => modulatorGain.connect(target)
      };
    };
    
    // 鳥叫聲生成器
    const birdSongGenerator = () => {
      const generateBirdCall = () => {
        const callType = Math.floor(Math.random() * 3); // 0-2，不同鳥叫類型
        
        if (callType === 0) {
          // 短促的啁啾聲
          generateChirp();
        } else if (callType === 1) {
          // 較長的歌聲
          generateSong();
        } else {
          // 短鳴聲
          generateShortCall();
        }
      };
      
      // 短促啁啾聲
      const generateChirp = () => {
        const duration = 0.1 + Math.random() * 0.2; // 100-300ms
        const chirps = 1 + Math.floor(Math.random() * 3); // 1-3次連續啁啾
        
        for (let i = 0; i < chirps; i++) {
          setTimeout(() => {
            const frequency = 2000 + Math.random() * 2000; // 2000-4000Hz
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            
            // 頻率滑音效果
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(
              frequency * (1 + Math.random() * 0.2), 
              audioContext.currentTime + duration
            );
            
            const gain = audioContext.createGain();
            gain.gain.setValueAtTime(0, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.1, audioContext.currentTime + duration * 0.1);
            gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
            
            oscillator.connect(gain);
            gain.connect(outputNode);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
            
            // 清理資源
            setTimeout(() => {
              oscillator.disconnect();
              gain.disconnect();
            }, duration * 1000);
          }, i * (150 + Math.random() * 100)); // 間隔150-250ms
        }
      };
      
      // 較長的鳥鳴歌聲
      const generateSong = () => {
        const notes = 4 + Math.floor(Math.random() * 5); // 4-8個音符
        const baseFrequency = 1500 + Math.random() * 1500; // 1500-3000Hz基頻
        
        for (let i = 0; i < notes; i++) {
          setTimeout(() => {
            const noteDuration = 0.1 + Math.random() * 0.2; // 100-300ms
            const noteFreq = baseFrequency * (0.8 + Math.random() * 0.4); // 基頻的80-120%
            
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            
            // 頻率滑音效果
            oscillator.frequency.setValueAtTime(noteFreq, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(
              noteFreq * (0.9 + Math.random() * 0.2),
              audioContext.currentTime + noteDuration
            );
            
            const gain = audioContext.createGain();
            gain.gain.setValueAtTime(0, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.07 + Math.random() * 0.05, audioContext.currentTime + noteDuration * 0.2);
            gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + noteDuration);
            
            oscillator.connect(gain);
            gain.connect(outputNode);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + noteDuration);
            
            // 清理資源
            setTimeout(() => {
              oscillator.disconnect();
              gain.disconnect();
            }, noteDuration * 1000);
          }, i * (200 + Math.random() * 150)); // 間隔200-350ms
        }
      };
      
      // 短促鳴叫
      const generateShortCall = () => {
        const duration = 0.05 + Math.random() * 0.1; // 50-150ms
        const frequency = 1000 + Math.random() * 2000; // 1000-3000Hz
        
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'triangle'; // 三角波更接近某些鳥類的短鳴
        oscillator.frequency.value = frequency;
        
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + duration * 0.1);
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
        
        oscillator.connect(gain);
        gain.connect(outputNode);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
        
        // 清理資源
        setTimeout(() => {
          oscillator.disconnect();
          gain.disconnect();
        }, duration * 1000);
      };
      
      // 定期隨機產生鳥叫聲
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30%的機率
          generateBirdCall();
        }
      }, 3000 + Math.random() * 7000); // 3-10秒隨機間隔
      
      soundNodes.push({
        start: () => {}, // 已在建立時啟動
        stop: () => clearInterval(interval)
      });
    };
    
    // 樹葉沙沙聲
    const leafRustleGenerator = () => {
      const bufferSize = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // 使用濾波的白噪音模擬樹葉沙沙聲
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      // 高通濾波器模擬樹葉聲
      const filter = audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      filter.Q.value = 0.5;
      
      // 調變來自風聲調變器，讓樹葉隨風作響
      const windModulator = createWindModulator(audioContext);
      
      const gain = audioContext.createGain();
      gain.gain.value = 0.05; // 相對輕微的聲音
      
      source.connect(filter);
      filter.connect(gain);
      
      // 連接調幅控制
      windModulator.connect(gain.gain);
      
      gain.connect(outputNode);
      
      soundNodes.push({
        source,
        start: () => {
          source.start(0);
          windModulator.source.start(0);
        },
        stop: () => {
          source.stop(0);
          windModulator.source.stop(0);
          source.disconnect();
          windModulator.source.disconnect();
          filter.disconnect();
          gain.disconnect();
        }
      });
    };
    
    // 激活所有大自然聲音生成器
    windGenerator();
    birdSongGenerator();
    leafRustleGenerator();
  };
  
  // 交通環境音效
  const createTrafficAmbience = (audioContext, outputNode, soundNodes) => {
    // 基礎交通噪音
    const trafficBaseGenerator = () => {
      const bufferSize = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // 棕色噪音基底較接近道路交通噪音
      let lastValue = 0;
      for (let i = 0; i < bufferSize; i++) {
        lastValue = (lastValue + (Math.random() * 2 - 1) * 0.02) / 1.02;
        data[i] = lastValue * 3;
      }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    // 濾波器模擬交通噪音特性
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 0.5;
    
    const gain = audioContext.createGain();
    gain.gain.value = 0.3;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);
    
    soundNodes.push({
      source,
      start: () => source.start(0),
      stop: () => {
        source.stop(0);
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      }
    });
  };
  
  // 汽車引擎聲
  const engineSoundGenerator = () => {
    const generateEngineSound = () => {
      const duration = 3 + Math.random() * 4; // 3-7秒
      
      // 建立基礎引擎聲
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sawtooth'; // 鋸齒波模擬引擎聲
      
      // 模擬車輛接近然後遠去的多普勒效應
      const frequency = 80 + Math.random() * 40; // 80-120Hz
      oscillator.frequency.setValueAtTime(frequency * 0.85, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(frequency, audioContext.currentTime + duration * 0.3);
      oscillator.frequency.linearRampToValueAtTime(frequency * 0.8, audioContext.currentTime + duration);
      
      // 波形整形和濾波
      const waveShaper = audioContext.createWaveShaper();
      const curve = new Float32Array(2);
      curve[0] = -1;
      curve[1] = 1;
      waveShaper.curve = curve;
      
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 150;
      
      // 音量控制模擬車輛經過
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.001, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.15 + Math.random() * 0.1, audioContext.currentTime + duration * 0.4);
      gain.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      // 連接節點
      oscillator.connect(waveShaper);
      waveShaper.connect(filter);
      filter.connect(gain);
      gain.connect(outputNode);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
      
      // 清理資源
      setTimeout(() => {
        oscillator.disconnect();
        waveShaper.disconnect();
        filter.disconnect();
        gain.disconnect();
      }, duration * 1000);
    };
    
    // 定期隨機產生車輛聲音
    const interval = setInterval(() => {
      if (Math.random() > 0.6) { // 40%的機率
        generateEngineSound();
      }
    }, 5000 + Math.random() * 10000); // 5-15秒隨機間隔
    
    soundNodes.push({
      start: () => {}, // 已在建立時啟動
      stop: () => clearInterval(interval)
    });
  };
  
  // 喇叭聲生成器
  const hornSoundGenerator = () => {
    const generateHornSound = () => {
      const duration = 0.2 + Math.random() * 0.6; // 0.2-0.8秒
      
      // 建立基礎喇叭聲
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'square'; // 方波較接近喇叭聲
      
      const frequency = 300 + Math.random() * 200; // 300-500Hz
      oscillator.frequency.value = frequency;
      
      // 建立一個諧音器模擬更真實的喇叭聲
      const harmonicOsc = audioContext.createOscillator();
      harmonicOsc.type = 'square';
      harmonicOsc.frequency.value = frequency * 1.5; // 1.5倍頻率的諧音
      
      // 音量控制
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.001, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + duration * 0.8);
      gain.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      const harmonicGain = audioContext.createGain();
      harmonicGain.gain.value = 0.03; // 諧音較弱
      
      // 連接節點
      oscillator.connect(gain);
      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(gain);
      gain.connect(outputNode);
      
      oscillator.start();
      harmonicOsc.start();
      oscillator.stop(audioContext.currentTime + duration);
      harmonicOsc.stop(audioContext.currentTime + duration);
      
      // 清理資源
      setTimeout(() => {
        oscillator.disconnect();
        harmonicOsc.disconnect();
        harmonicGain.disconnect();
        gain.disconnect();
      }, duration * 1000);
    };
    
    // 定期非常少量地隨機產生喇叭聲
    const interval = setInterval(() => {
      if (Math.random() > 0.9) { // 10%的機率
        generateHornSound();
      }
    }, 15000 + Math.random() * 30000); // 15-45秒隨機間隔
    
    soundNodes.push({
      start: () => {}, // 已在建立時啟動
      stop: () => clearInterval(interval)
    });
  };
  
  // 激活所有交通聲音生成器
  trafficBaseGenerator();
  engineSoundGenerator();
  hornSoundGenerator();
};

// 辦公室環境音效
const createOfficeAmbience = (audioContext, outputNode, soundNodes) => {
  // 辦公室背景噪音
  const officeBaseGenerator = () => {
    const bufferSize = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // 使用過濾的白噪音模擬辦公室背景噪音
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 0.06; // 低強度
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    // 濾波器模擬辦公室環境聲學特性
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 250;
    filter.Q.value = 0.5;
    
    const gain = audioContext.createGain();
    gain.gain.value = 0.2;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);
    
    soundNodes.push({
      source,
      start: () => source.start(0),
      stop: () => {
        source.stop(0);
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      }
    });
  };
  
  // 鍵盤打字聲生成器
  const keyboardTypingGenerator = () => {
    const generateKeyPress = () => {
      const length = audioContext.sampleRate * 0.05; // 50ms
      const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // 使用噪音脈衝模擬按鍵聲
      for (let i = 0; i < length; i++) {
        // 指數衰減的噪音
        const progress = i / length;
        const amplitude = Math.exp(-progress * 20) * 0.5; // 快速衰減
        data[i] = (Math.random() * 2 - 1) * amplitude;
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      
      // 高通濾波器模擬鍵盤聲特性
      const filter = audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000;
      
      const gain = audioContext.createGain();
      gain.gain.value = 0.1 + Math.random() * 0.05; // 隨機輕微變化音量
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(outputNode);
      
      source.start(0);
      
      // 播放完畢後清理資源
      setTimeout(() => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      }, 100);
    };
    
    // 隨機產生打字序列
    const generateTypingSequence = () => {
      // 決定此次打字序列的按鍵數量
      const keyCount = 3 + Math.floor(Math.random() * 20); // 3-22個按鍵
      
      // 模擬一連串的按鍵
      for (let i = 0; i < keyCount; i++) {
        setTimeout(() => {
          generateKeyPress();
        }, i * (50 + Math.random() * 150)); // 50-200ms隨機間隔
      }
    };
    
    // 定期隨機產生打字序列
    const interval = setInterval(() => {
      if (Math.random() > 0.6) { // 40%的機率
        generateTypingSequence();
      }
    }, 5000 + Math.random() * 10000); // 5-15秒隨機間隔
    
    soundNodes.push({
      start: () => {}, // 已在建立時啟動
      stop: () => clearInterval(interval)
    });
  };
  
  // 辦公設備聲音（打印機、影印機等）
  const officeEquipmentGenerator = () => {
    // 打印機運作聲
    const generatePrinterSound = () => {
      const duration = 2 + Math.random() * 4; // 2-6秒
      
      // 步進馬達聲基底
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sawtooth';
      
      // 模擬打印機步進馬達頻率變化
      const baseFreq = 100 + Math.random() * 50;
      oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
      
      // 加入隨機頻率變化模擬打印過程
      const now = audioContext.currentTime;
      const steps = 10 + Math.floor(Math.random() * 20);
      for (let i = 0; i < steps; i++) {
        const time = now + (duration * i / steps);
        const freqChange = (Math.random() * 2 - 1) * 20; // -20到+20Hz變化
        oscillator.frequency.setValueAtTime(baseFreq + freqChange, time);
      }
      
      // 調變噪音源模擬紙張移動
      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      
      // 濾波器
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 0.5;
      
      // 音量控制
      const oscGain = audioContext.createGain();
      oscGain.gain.value = 0.1;
      
      const noiseGain = audioContext.createGain();
      noiseGain.gain.value = 0.08;
      
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0.001, audioContext.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.2);
      masterGain.gain.setValueAtTime(0.25, audioContext.currentTime + duration - 0.2);
      masterGain.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      // 連接節點
      oscillator.connect(oscGain);
      noiseSource.connect(filter);
      filter.connect(noiseGain);
      oscGain.connect(masterGain);
      noiseGain.connect(masterGain);
      masterGain.connect(outputNode);
      
      oscillator.start();
      noiseSource.start();
      oscillator.stop(audioContext.currentTime + duration);
      noiseSource.stop(audioContext.currentTime + duration);
      
      // 清理資源
      setTimeout(() => {
        oscillator.disconnect();
        noiseSource.disconnect();
        filter.disconnect();
        oscGain.disconnect();
        noiseGain.disconnect();
        masterGain.disconnect();
      }, duration * 1000);
    };
    
    // 定期非常少量地隨機產生辦公設備聲音
    const interval = setInterval(() => {
      if (Math.random() > 0.9) { // 10%的機率
        generatePrinterSound();
      }
    }, 30000 + Math.random() * 60000); // 30-90秒隨機間隔
    
    soundNodes.push({
      start: () => {}, // 已在建立時啟動
      stop: () => clearInterval(interval)
    });
  };
  
  // 電話鈴聲生成器
  const phoneRingGenerator = () => {
    const generatePhoneRing = () => {
      // 決定此次電話鈴聲的循環次數
      const ringCount = 1 + Math.floor(Math.random() * 6); // 1-6次鈴聲
      
      // 單次鈴聲函數
      const singleRing = (time) => {
        const ringDuration = 0.5; // 0.5秒
        
        // 建立電話鈴聲 - 通常由兩個頻率組成
        const oscillator1 = audioContext.createOscillator();
        oscillator1.type = 'sine';
        oscillator1.frequency.value = 480; // 480Hz
        
        const oscillator2 = audioContext.createOscillator();
        oscillator2.type = 'sine';
        oscillator2.frequency.value = 620; // 620Hz
        
        // 音量控制包絡
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
        gain.gain.setValueAtTime(0.15, time + ringDuration - 0.05);
        gain.gain.linearRampToValueAtTime(0, time + ringDuration);
        
        // 連接節點
        oscillator1.connect(gain);
        oscillator2.connect(gain);
        gain.connect(outputNode);
        
        // 設定啟動和停止時間
        oscillator1.start(time);
        oscillator2.start(time);
        oscillator1.stop(time + ringDuration);
        oscillator2.stop(time + ringDuration);
        
        // 清理資源
        setTimeout(() => {
          oscillator1.disconnect();
          oscillator2.disconnect();
          gain.disconnect();
        }, (time - audioContext.currentTime + ringDuration) * 1000 + 100);
      };
      
      // 產生鈴聲序列
      for (let i = 0; i < ringCount; i++) {
        const time = audioContext.currentTime + i * 2; // 每2秒一個循環
        singleRing(time);
      }
    };
    
    // 定期非常少量地隨機產生電話鈴聲
    const interval = setInterval(() => {
      if (Math.random() > 0.95) { // 5%的機率
        generatePhoneRing();
      }
    }, 60000 + Math.random() * 180000); // 1-4分鐘隨機間隔
    
    soundNodes.push({
      start: () => {}, // 已在建立時啟動
      stop: () => clearInterval(interval)
    });
  };
  
  // 激活所有辦公室聲音生成器
  officeBaseGenerator();
  keyboardTypingGenerator();
  officeEquipmentGenerator();
  phoneRingGenerator();
};

  

// 靜態雜訊效果
const NOISE_EFFECTS = {
  none: '無雜訊',
  static: '靜電',
  radio: '廣播電台',
  old: '老舊錄音',
  telephone: '電話',
  underwater: '水下效果',
};

const SpeechControls = ({ segments, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [voicePreset, setVoicePreset] = useState('normal');
  const [rate, setRate] = useState(VOICE_PRESETS.normal.rate);
  const [pitch, setPitch] = useState(VOICE_PRESETS.normal.pitch);
  const [ambientSound, setAmbientSound] = useState('none');
  const [ambientVolume, setAmbientVolume] = useState(0.2);
  const [noiseEffect, setNoiseEffect] = useState('none');
  const [expanded, setExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const utteranceRef = useRef(null);
  const ambientAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const whiteNoiseNodeRef = useRef(null);

  // 初始化音訊上下文
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    return () => {
      // 關閉音訊上下文前確保所有節點都已停止和斷開連接
      if (audioContextRef.current) {
        if (noiseNodeRef.current) {
          noiseNodeRef.current.scriptNode.disconnect();
          noiseNodeRef.current.gainNode.disconnect();
          noiseNodeRef.current = null;
        }
        
        if (whiteNoiseNodeRef.current) {
          whiteNoiseNodeRef.current.source.stop();
          whiteNoiseNodeRef.current.source.disconnect();
          whiteNoiseNodeRef.current.gain.disconnect();
          whiteNoiseNodeRef.current = null;
        }
        
        audioContextRef.current.close();
      }
    };
  }, []);
  
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

  // 管理環境音效
// 修改這個 useEffect 以使用新的音效生成器
useEffect(() => {
    // 如果面板未展開或沒有選擇環境音效，則不進行任何操作
    if (!expanded || ambientSound === 'none') {
      if (ambientAudioRef.current) {
        ambientAudioRef.current = null;
      }
      
      // 停止音訊生成器
      if (whiteNoiseNodeRef.current) {
        whiteNoiseNodeRef.current.stop();
        whiteNoiseNodeRef.current = null;
      }
      
      return;
    }
  
    // 首先停止之前的音訊
    if (whiteNoiseNodeRef.current) {
      whiteNoiseNodeRef.current.stop();
      whiteNoiseNodeRef.current = null;
    }
    
    // 確保音訊上下文已初始化
    if (!audioContextRef.current) return;
    
    // 創建新的音訊生成器
    const soundInfo = AMBIENT_SOUNDS[ambientSound];
    
    if (soundInfo.type === 'generator') {
      const generator = createAudioGenerator(
        soundInfo.generator, 
        audioContextRef.current, 
        ambientVolume
      );
      
      whiteNoiseNodeRef.current = generator;
      
      // 只有在面板展開且應該播放時才開始環境音
      if (expanded && (isPlaying || !utteranceRef.current)) {
        generator.start();
      }
    }
  }, [ambientSound, ambientVolume, expanded, isPlaying]);

// 隨時監聽音量變化並更新
useEffect(() => {
    if (whiteNoiseNodeRef.current) {
      whiteNoiseNodeRef.current.setVolume(ambientVolume);
    }
  }, [ambientVolume]);
  
  // 修改 togglePlayPause 函數中處理環境音效的部分
  // 在播放部分添加這段
  if (expanded && ambientSound !== 'none' && whiteNoiseNodeRef.current) {
    whiteNoiseNodeRef.current.start();
  }
  
  // 在暫停部分添加這段
  if (whiteNoiseNodeRef.current) {
    whiteNoiseNodeRef.current.stop();
  }
  
  // 修改 playSpeech 函數中啟動環境音效的部分
  if (ambientSound !== 'none' && whiteNoiseNodeRef.current) {
    whiteNoiseNodeRef.current.start();
  }
  
  // 修改 stopSpeech 函數中停止環境音效的部分
  if (whiteNoiseNodeRef.current) {
    whiteNoiseNodeRef.current.stop();
    whiteNoiseNodeRef.current = null;
  }
  
  // 修改 handleClose 函數中徹底清理所有音訊的部分
  if (whiteNoiseNodeRef.current) {
    whiteNoiseNodeRef.current.stop();
    whiteNoiseNodeRef.current = null;
  }

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
        case 'a': // 環境音效
        case 's':
        case 'd':
        case 'f':
        case 'g':
        case 'h':
          e.preventDefault();
          handleAmbientSoundShortcut(e.key);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded, currentSegment, isPlaying, rate, pitch, ambientSound]);

  // 環境音效快捷鍵
  const handleAmbientSoundShortcut = (key) => {
    const soundMap = {
      'a': 'none',
      's': 'coffee',
      'd': 'rain',
      'f': 'nature',
      'g': 'traffic',
      'h': 'whitenoise'
    };
    
    if (soundMap[key]) {
      setAmbientSound(soundMap[key]);
    }
  };

  // 調整語速並立即更新
  const adjustRate = (delta) => {
    setRate(prevRate => {
      const newRate = Math.max(0.5, Math.min(3.0, prevRate + delta));
      
      // 如果正在播放，立即更新當前播放的語音
      if (isPlaying && utteranceRef.current && window.speechSynthesis.speaking) {
        // 暫停當前語音
        window.speechSynthesis.cancel();
        
        // 使用新的語速重新播放當前段落
        setTimeout(() => {
          playSpeech(currentSegment);
        }, 50);
      }
      
      return newRate;
    });
  };

  // 調整環境音量
  const adjustAmbientVolume = (value) => {
    const newVolume = parseFloat(value);
    setAmbientVolume(newVolume);
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
    
    const preset = key in presetMap ? presetMap[key] : 'normal';
    setVoicePreset(preset);
    
    const { pitch: newPitch, rate: newRate } = VOICE_PRESETS[preset];
    setPitch(newPitch);
    setRate(newRate);
    
    // 如果正在播放，立即更新當前播放的語音
    if (isPlaying && window.speechSynthesis.speaking) {
      // 取消當前語音
      window.speechSynthesis.cancel();
      
      // 使用新設定重新播放當前段落
      setTimeout(() => {
        playSpeech(currentSegment);
      }, 50);
    }
  };
  
  // 應用雜訊效果
  const applyNoiseEffect = (utterance) => {
    if (noiseEffect === 'none' || !audioContextRef.current) return utterance;
  
    const ctx = audioContextRef.current;
  
    // 若已有雜訊播放節點，先停止它
    if (noiseNodeRef.current) {
      noiseNodeRef.current.scriptNode.disconnect();
      noiseNodeRef.current.gainNode.disconnect();
      noiseNodeRef.current = null;
    }
  
    const bufferSize = 4096;
    let scriptNode;
    
    try {
      // 嘗試使用新的AudioWorkletNode（如果支援）
      scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1);
    } catch (e) {
      console.warn('創建雜訊節點失敗:', e);
      return utterance;
    }
    
    const gainNode = ctx.createGain();
  
    // 設定不同雜訊效果的強度
    switch (noiseEffect) {
      case 'static': // 靜電聲
        gainNode.gain.value = 0.08;
        break;
      case 'radio': // 廣播風格
        gainNode.gain.value = 0.1;
        break;
      case 'old': // 老舊錄音機
        gainNode.gain.value = 0.12;
        break;
      case 'telephone':
        gainNode.gain.value = 0.09;
        break;
      case 'underwater':
        gainNode.gain.value = 0.07;
        break;
      default:
        gainNode.gain.value = 0.05;
    }
  
    // 動態產生白噪音並疊加震盪調制效果
    scriptNode.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const whiteNoise = Math.random() * 2 - 1;
        const modulator = Math.sin(i / 20); // 模擬老舊訊號波形
        output[i] = whiteNoise * modulator;
      }
    };
  
    // 連接音效到輸出
    scriptNode.connect(gainNode);
    gainNode.connect(ctx.destination);
  
    // 儲存參考以便後續停止
    noiseNodeRef.current = { scriptNode, gainNode };
  
    // 當語音播放完畢，停止雜訊
    utterance.addEventListener('end', () => {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.scriptNode.disconnect();
        noiseNodeRef.current.gainNode.disconnect();
        noiseNodeRef.current = null;
      }
    });
  
    return utterance;
  };

  // 停止所有音訊
  const stopSpeech = useCallback(() => {
    // 停止語音合成
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    
    // 停止環境音效
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      // 重置音訊播放位置
      ambientAudioRef.current.currentTime = 0;
    }
    
    // 停止白噪音
    if (whiteNoiseNodeRef.current) {
      try {
        whiteNoiseNodeRef.current.source.stop();
      } catch (e) {
        // 音訊可能已經停止，忽略錯誤
      }
    }
    
    // 停止雜訊效果
    if (noiseNodeRef.current) {
      noiseNodeRef.current.scriptNode.disconnect();
      noiseNodeRef.current.gainNode.disconnect();
      noiseNodeRef.current = null;
    }
    
    setIsPlaying(false);
  }, []);
    // 播放語音
    const playSpeech = useCallback((segmentIndex) => {
        if (!segments[segmentIndex] || !window.speechSynthesis) return;
    
        // 取消任何正在進行的語音
        stopSpeech();
    
        const text = segments[segmentIndex].text;
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 應用雜訊效果
        const processedUtterance = applyNoiseEffect(utterance);
        utteranceRef.current = processedUtterance;
        
        // 設定語言為繁體中文
        processedUtterance.lang = 'zh-TW';
        
        // 設定語速和音調
        processedUtterance.rate = rate;
        processedUtterance.pitch = pitch;
        
        // 播放結束事件
        processedUtterance.onend = () => {
          utteranceRef.current = null;
          
          if (segmentIndex < segments.length - 1) {
            setCurrentSegment(segmentIndex + 1);
            playSpeech(segmentIndex + 1);
          } else {
            setIsPlaying(false);
            
            // 停止環境音效
            if (ambientAudioRef.current) {
              ambientAudioRef.current.pause();
              ambientAudioRef.current.currentTime = 0;
            }
            
            // 停止白噪音
            if (whiteNoiseNodeRef.current) {
              try {
                whiteNoiseNodeRef.current.source.stop();
              } catch (e) {
                // 音訊可能已經停止，忽略錯誤
              }
            }
          }
        };
        
        // 錯誤事件
        processedUtterance.onerror = (event) => {
          console.error('語音播放錯誤:', event);
          utteranceRef.current = null;
          setIsPlaying(false);
          
          // 停止環境音效
          if (ambientAudioRef.current) {
            ambientAudioRef.current.pause();
            ambientAudioRef.current.currentTime = 0;
          }
          
          // 停止白噪音
          if (whiteNoiseNodeRef.current) {
            try {
              whiteNoiseNodeRef.current.source.stop();
            } catch (e) {
              // 音訊可能已經停止，忽略錯誤
            }
          }
        };
        
        // 播放語音
        window.speechSynthesis.speak(processedUtterance);
        setIsPlaying(true);
        setCurrentSegment(segmentIndex);
        
        // 播放環境音效
        if (ambientSound !== 'none') {
          if (ambientSound === 'whitenoise') {
            // 處理白噪音
            if (audioContextRef.current && whiteNoiseNodeRef.current) {
              try {
                // 重新調整音量
                whiteNoiseNodeRef.current.gain.gain.value = ambientVolume;
              } catch (e) {
                console.warn('無法調整白噪音音量:', e);
              }
            }
          } else if (ambientAudioRef.current) {
            // 確保音量正確
            ambientAudioRef.current.volume = ambientVolume;
            
            // 播放其他環境音效
            ambientAudioRef.current.play().catch(err => {
              console.warn('無法播放環境音效:', err);
            });
          }
        }
      }, [segments, rate, pitch, ambientSound, ambientVolume, noiseEffect, stopSpeech]);

  // 切換播放/暫停
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      if (window.speechSynthesis) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
        }
      }
      
      // 暫停環境音效
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
      
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        
        // 恢復環境音效
        if (ambientAudioRef.current && ambientSound !== 'none') {
          ambientAudioRef.current.play().catch(err => {
            console.warn('無法恢復環境音效:', err);
          });
        }
        
        if (whiteNoiseNodeRef.current && ambientSound === 'whitenoise') {
          try {
            // 重新啟動白噪音
            const ctx = audioContextRef.current;
            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
              output[i] = Math.random() * 2 - 1;
            }
            
            const whiteNoise = ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;
            
            const gainNode = ctx.createGain();
            gainNode.gain.value = ambientVolume;
            
            whiteNoise.connect(gainNode);
            gainNode.connect(ctx.destination);
            whiteNoise.start(0);
            
            // 更新參考
            if (whiteNoiseNodeRef.current) {
              whiteNoiseNodeRef.current.source.disconnect();
              whiteNoiseNodeRef.current.gain.disconnect();
            }
            
            whiteNoiseNodeRef.current = { source: whiteNoise, gain: gainNode };
          } catch (e) {
            console.warn('無法重新啟動白噪音:', e);
          }
        }
        
        setIsPlaying(true);
      } else {
        playSpeech(currentSegment);
      }
    }
  }, [isPlaying, currentSegment, ambientSound, ambientVolume, playSpeech]);



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

  // 完全關閉語音控制面板和所有音訊
  const handleClose = () => {
    stopSpeech();
    
    // 確保所有音訊都停止
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.src = '';
      ambientAudioRef.current = null;
    }
    
    // 停止白噪音
    if (whiteNoiseNodeRef.current) {
      try {
        whiteNoiseNodeRef.current.source.stop();
        whiteNoiseNodeRef.current.source.disconnect();
        whiteNoiseNodeRef.current.gain.disconnect();
        whiteNoiseNodeRef.current = null;
      } catch (e) {
        console.warn('停止白噪音時發生錯誤:', e);
      }
    }
    
    // 停止雜訊效果
    if (noiseNodeRef.current) {
      noiseNodeRef.current.scriptNode.disconnect();
      noiseNodeRef.current.gainNode.disconnect();
      noiseNodeRef.current = null;
    }
    
    // 關閉UI
    setExpanded(false);
    setShowAdvanced(false);
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
  
  const toggleAdvancedSettings = () => {
    setShowAdvanced(!showAdvanced);
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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
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
              <button
                onClick={toggleAdvancedSettings}
                className="advanced-settings-toggle"
                title="進階設定"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
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
          
          {showAdvanced && (
            <div className="advanced-settings">
              <div className="settings-section">
                <h4>語音設定</h4>
                <div className="setting-group">
                  <label>音調預設:</label>
                  <select 
                    value={voicePreset} 
                    onChange={(e) => {
                      const preset = e.target.value;
                      setVoicePreset(preset);
                      setPitch(VOICE_PRESETS[preset].pitch);
                      setRate(VOICE_PRESETS[preset].rate);
                      
                      // 如果正在播放，即時更新
                      if (isPlaying && window.speechSynthesis.speaking) {
                        // 取消當前語音
                        window.speechSynthesis.cancel();
                        
                        // 使用新設定重新播放當前段落
                        setTimeout(() => {
                          playSpeech(currentSegment);
                        }, 50);
                      }
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
                
                <div className="setting-group">
                  <label>音調 (1-5):</label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2" 
                    step="0.1" 
                    value={pitch}
                    onChange={(e) => {
                      const newPitch = parseFloat(e.target.value);
                      setPitch(newPitch);
                      
                      // 如果正在播放，即時更新
                      if (isPlaying && window.speechSynthesis.speaking) {
                        // 取消當前語音
                        window.speechSynthesis.cancel();
                        
                        // 使用新設定重新播放當前段落
                        setTimeout(() => {
                          playSpeech(currentSegment);
                        }, 50);
                      }
                    }}
                    className="slider-input"
                  />
                </div>
              </div>
              
              <div className="settings-section">
                <h4>環境音效</h4>
                <div className="setting-group">
                  <label>背景音:</label>
                  <select 
                    value={ambientSound} 
                    onChange={(e) => setAmbientSound(e.target.value)}
                    className="ambient-sound-select"
                  >
                    {Object.entries(AMBIENT_SOUNDS).map(([key, sound]) => (
                      <option key={key} value={key}>{sound.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="setting-group">
                  <label>音量:</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="0.5" 
                    step="0.05" 
                    value={ambientVolume}
                    onChange={(e) => adjustAmbientVolume(e.target.value)}
                    className="slider-input"
                    disabled={ambientSound === 'none'}
                  />
                </div>
              </div>
              
              <div className="settings-section">
                <h4>雜訊效果</h4>
                <div className="setting-group">
                  <label>效果:</label>
                  <select 
                    value={noiseEffect} 
                    onChange={(e) => {
                      setNoiseEffect(e.target.value);
                      
                      // 如果正在播放，即時更新雜訊效果
                      if (isPlaying && window.speechSynthesis.speaking) {
                        // 取消當前語音
                        window.speechSynthesis.cancel();
                        
                        // 使用新效果重新播放當前段落
                        setTimeout(() => {
                          playSpeech(currentSegment);
                        }, 50);
                      }
                    }}
                    className="noise-effect-select"
                  >
                    {Object.entries(NOISE_EFFECTS).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="shortcut-list">
                <h4>快捷鍵:</h4>
                <div className="shortcut-grid">
                  <div>1-5: 切換音調</div>
                  <div>a-h: 切換背景音</div>
                  <div>+/-: 調整速度</div>
                </div>
              </div>
            </div>
          )}
          
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

            <div className="ambient-indicator">
              {ambientSound !== 'none' && (
                <div className="ambient-badge" title={AMBIENT_SOUNDS[ambientSound].name}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                  </svg>
                  <span>{AMBIENT_SOUNDS[ambientSound].name}</span>
                </div>
              )}
              
              {noiseEffect !== 'none' && (
                <div className="noise-badge" title={NOISE_EFFECTS[noiseEffect]}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                    <line x1="12" y1="2" x2="12" y2="12"></line>
                  </svg>
                  <span>{NOISE_EFFECTS[noiseEffect]}</span>
                </div>
              )}
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