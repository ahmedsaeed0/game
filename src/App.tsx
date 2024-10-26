import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { binanceLogo, dollarCoin, mainCharacter } from './images';
import Info from './icons/Info';
import Mine from './icons/Mine';
import Friends from './icons/Friends';
import Coins from './icons/Coins';

interface TelegramWindow extends Window {
  Telegram?: {
    WebApp: {
      initDataUnsafe: {
        user?: {
          id: number;
        };
      };
      sendData: (data: string) => void;
    };
  };
}

declare const window: TelegramWindow;

const HomePage: React.FC = () => {
  const levelNames = [
    "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Epic", "Legendary", "Master", "GrandMaster", "Lord"
  ];

  const levelMinPoints = [
    0, 5000, 25000, 100000, 1000000, 2000000, 10000000, 50000000, 100000000, 1000000000
  ];

  const [levelIndex, setLevelIndex] = useState(6);
  const [points, setPoints] = useState(0);
  const [clicks, setClicks] = useState<{ id: number, x: number, y: number }[]>([]);
  const pointsToAdd = 11;
  const profitPerHour = 126420;

  useEffect(() => {
    const updateCountdowns = () => {
      // يمكنك إضافة أي توقيت أو عد تنازلي هنا.
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000); // يتم التحديث كل دقيقة
    return () => clearInterval(interval);
  }, []);

  // جلب بيانات المستخدم من السيرفر (Flask)
  useEffect(() => {
    const fetchData = async () => {
      if (window.Telegram && window.Telegram.WebApp) {
        const userId = window.Telegram.WebApp.initDataUnsafe.user?.id;  
        console.log("User ID:", userId);
  
        if (userId) {
          try {
            console.log("Fetching chat ID...");
            const chatIdResponse = await fetch(`https://hoota1.com/callback-new`);
            if (chatIdResponse.ok) {
              const chatIdData = await chatIdResponse.json();
              const chatId = chatIdData.chat_id;
              console.log("Chat ID:", chatId);
  
              if (chatId) {
                console.log("Fetching user data...");
                const userDataResponse = await fetch(`http://plask.farsa.sa:5002/get_user_data/${chatId}`);
                if (userDataResponse.ok) {
                  const userData = await userDataResponse.json();
                  console.log("User Data:", userData);
                  setPoints(userData.reward_points);  // تحديث النقاط بناءً على البيانات المستلمة
                } else {
                  console.error('Failed to fetch user data');
                }
              } else {
                console.error('Chat ID not found for the specified user ID');
              }
            } else {
              console.error('Failed to fetch chat ID');
            }
          } catch (error) {
            console.error('Error fetching chat ID:', error);
          }
        } else {
          console.error('No user ID available.');
        }
      } else {
        console.error('Telegram WebApp is not available.');
      }
    };
  
    fetchData();
  }, []);
  const sendPointsToBot = async (newPoints: number) => {
    // تحقق من وجود Telegram WebApp API
    if (window.Telegram && window.Telegram.WebApp) {
      const chatId = window.Telegram.WebApp.initDataUnsafe.user?.id;
  
      if (chatId) {
        try {
          // إرسال النقاط و chat_id إلى الخادم الخلفي باستخدام fetch
          const response = await fetch('http://plask.farsa.sa:5002/updatePoints', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              points: newPoints,
            }),
          });
  
          const data = await response.json();
  
          if (response.ok) {
            console.log('Points updated successfully:', data);
          } else {
            console.error('Error updating points:', data.message);
          }
        } catch (error) {
          console.error('Error updating points:', error);
        }
      } else {
        console.error('chat_id not found');
      }
    } else {
      console.error('Telegram WebApp is not available');
    }
  };
  

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    card.style.transform = `perspective(1000px) rotateX(${-y / 10}deg) rotateY(${x / 10}deg)`;
    setTimeout(() => {
      card.style.transform = '';
    }, 100);

    const newPoints = points + pointsToAdd;
    setPoints(newPoints);
    setClicks([...clicks, { id: Date.now(), x: e.pageX, y: e.pageY }]);

    sendPointsToBot(newPoints);
  };

  const handleAnimationEnd = (id: number) => {
    setClicks((prevClicks) => prevClicks.filter(click => click.id !== id));
  };

  const calculateProgress = () => {
    if (levelIndex >= levelNames.length - 1) {
      return 100;
    }
    const currentLevelMin = levelMinPoints[levelIndex];
    const nextLevelMin = levelMinPoints[levelIndex + 1];
    const progress = ((points - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
    return Math.min(progress, 100);
  };

  useEffect(() => {
    const currentLevelMin = levelMinPoints[levelIndex];
    const nextLevelMin = levelMinPoints[levelIndex + 1];
    if (points >= nextLevelMin && levelIndex < levelNames.length - 1) {
      setLevelIndex(levelIndex + 1);
    } else if (points < currentLevelMin && levelIndex > 0) {
      setLevelIndex(levelIndex - 1);
    }
  }, [points, levelIndex, levelMinPoints, levelNames.length]);

  const formatProfitPerHour = (profit: number) => {
    if (profit >= 1000000000) return `+${(profit / 1000000000).toFixed(2)}B`;
    if (profit >= 1000000) return `+${(profit / 1000000).toFixed(2)}M`;
    if (profit >= 1000) return `+${(profit / 1000).toFixed(2)}K`;
    return `+${profit}`;
  };

  useEffect(() => {
    const pointsPerSecond = Math.floor(profitPerHour / 3600);
    const interval = setInterval(() => {
      setPoints(prevPoints => prevPoints + pointsPerSecond);
    }, 1000);
    return () => clearInterval(interval);
  }, [profitPerHour]);

  return (
    <div className="bg-black flex justify-center">
      <div className="w-full bg-black text-white h-screen font-bold flex flex-col max-w-xl">
        <div className="px-4 z-10">
          <div className="flex items-center space-x-2 pt-4">
            <div className="p-1 rounded-lg bg-[#1d2025]"></div>
            <div>
              <p className="text-sm">ajaw </p>
            </div>
          </div>
          <div className="flex items-center justify-between space-x-4 mt-1">
            <div className="flex items-center w-1/3">
              <div className="w-full">
                <div className="flex justify-between">
                  <p className="text-sm">{levelNames[levelIndex]}</p>
                  <p className="text-sm">{levelIndex + 1} <span className="text-[#95908a]">/ {levelNames.length}</span></p>
                </div>
                <div className="flex items-center mt-1 border-2 border-[#43433b] rounded-full">
                  <div className="w-full h-2 bg-[#43433b]/[0.6] rounded-full">
                    <div className="progress-gradient h-2 rounded-full" style={{ width: `${calculateProgress()}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center w-2/3 border-2 border-[#43433b] rounded-full px-4 py-[2px] bg-[#43433b]/[0.6] max-w-64">
              <div className="h-[32px] w-[2px] bg-[#43433b] mx-2"></div>
              <div className="flex-1 text-center">
                <p className="text-xs text-[#85827d] font-medium">Profit per hour</p>
                <div className="flex items-center justify-center space-x-1">
                  <img src={dollarCoin} alt="Dollar Coin" className="w-[18px] h-[18px]" />
                  <p className="text-sm">{formatProfitPerHour(profitPerHour)}</p>
                  <Info size={20} className="text-[#43433b]" />
                </div>
              </div>
              <div className="h-[32px] w-[2px] bg-[#43433b] mx-2"></div>
            </div>
          </div>
        </div>

        <div className="flex-grow mt-4 bg-[#f3ba2f] rounded-t-[48px] relative top-glow z-0">
          <div className="absolute top-[2px] left-0 right-0 bottom-0 bg-[#1d2025] rounded-t-[46px]">
            <div className="px-4 mt-6 flex justify-between gap-2"></div>

            <div className="px-4 mt-4 flex justify-center">
              <div className="px-4 py-2 flex items-center space-x-2">
                <img src={dollarCoin} alt="Dollar Coin" className="w-10 h-10" />
                <p className="text-4xl text-white">{points.toLocaleString()}</p>
              </div>
            </div>

            <div className="px-4 mt-4 flex justify-center">
              <div
                className="w-80 h-80 p-4 rounded-full circle-outer"
                onClick={handleCardClick}
              >
                <div className="w-full h-full rounded-full circle-inner">
                  <img src={mainCharacter} alt="Main Character" className="w-full h-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {clicks.map((click) => (
        <div
          key={click.id}
          className="absolute text-5xl font-bold opacity-0 text-white pointer-events-none"
          style={{
            top: `${click.y - 42}px`,
            left: `${click.x - 28}px`,
            animation: `float 1s ease-out`
          }}
          onAnimationEnd={() => handleAnimationEnd(click.id)}
        >
          {pointsToAdd}
        </div>
      ))}
    </div>
  );
};

const FriendsPage: React.FC = () => {
  return (
    <div className="bg-black text-white h-screen flex justify-center items-center">
      <h1>Friends Page</h1>
      <p>This is the Friends section where you can see your friends.</p>
    </div>
  );
};

const MinePage: React.FC = () => {
  return (
    <div className="bg-black text-white h-screen flex justify-center items-center">
      <h1>Mine Page</h1>
      <p>This is the mining section where you can mine coins.</p>
    </div>
  );
};

const ExchangePage: React.FC = () => {
  return (
    <div className="bg-black text-white h-screen flex justify-center items-center">
      <h1>Exchange Page</h1>
      <p>This is the Exchange section where you can trade coins.</p>
    </div>
  );
};

const EarnPage: React.FC = () => {
  return (
    <div className="bg-black text-white h-screen flex justify-center items-center">
      <h1>Earn Page</h1>
      <p>This is the section where you can earn coins.</p>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/mine" element={<MinePage />} />
          <Route path="/exchange" element={<ExchangePage />} />
          <Route path="/earn" element={<EarnPage />} />
        </Routes>

        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl bg-[#272a2f] flex justify-around items-center z-50 rounded-3xl text-xs">
          <div className="text-center text-[#85827d] w-1/5">
            <Link to="/">
              <img src={binanceLogo} alt="Exchange" className="w-8 h-8 mx-auto" />
              <p className="mt-1">Exchange</p>
            </Link>
          </div>
          <div className="text-center text-[#85827d] w-1/5">
            <Link to="/mine">
              <Mine className="w-8 h-8 mx-auto" />
              <p className="mt-1">Mine</p>
            </Link>
          </div>
          <div className="text-center text-[#85827d] w-1/5">
            <Link to="/friends">
              <Friends className="w-8 h-8 mx-auto" />
              <p className="mt-1">Friends</p>
            </Link>
          </div>
          <div className="text-center text-[#85827d] w-1/5">
            <Link to="/earn">
              <Coins className="w-8 h-8 mx-auto" />
              <p className="mt-1">Earn</p>
            </Link>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
