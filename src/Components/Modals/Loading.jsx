import './Loading.css'
import { useEffect, useState } from 'react'

const messages = [
  '🔧 Demək olar ki, hazırdır...',
  '⏳ Hazırlanır...',
  '🕐 Gözləyin, zəhmət olmasa...',
  '🚀 Sistem işə düşür...',
  '📡 Serverlə əlaqə qurulur...'
];

const Loading = ({ loadingMessage }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(msgInterval);
  }, []);

  return (
    <div className="loading-back">
      <div className="loading-box">
        <div className="animated-border">
          <div className="border-top"></div>
          <div className="border-right"></div>
          <div className="border-bottom"></div>
          <div className="border-left"></div>
        </div>

        <div className="loading-text">
          <span className="main-text">{loadingMessage || 'Yüklənir...'}</span>
          <span className="sub-text">{messages[currentIndex]}</span>
        </div>
      </div>
    </div>
  )
}

export default Loading
