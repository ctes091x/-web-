import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Header = () => {
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const navigate = useNavigate();

  const mockGroups = [
    { id: '1', name: '開発部' },
    { id: '2', name: 'デザインチーム' },
    { id: '99', name: '全社イベント実行委員' },
  ];

  const handleGroupClick = (groupId) => {
    setIsGroupMenuOpen(false);
    navigate(`/group/${groupId}`);
  };

  return (
    // Smart & Trust: 白背景に細いボーダー、影は控えめに
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="h-full px-6 max-w-7xl mx-auto flex items-center justify-between">
        
        {/* 左側：ロゴとナビゲーション */}
        <div className="flex items-center gap-8">
          <Link to="/calendar" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-md flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-primary-700 transition-colors">
              G
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-primary-700 transition-colors">
              GeekCamp
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link to="/calendar" className="px-3 py-2 rounded-md hover:bg-slate-50 hover:text-primary-600 transition-colors">マイカレンダー</Link>
            <Link to="/tasks" className="px-3 py-2 rounded-md hover:bg-slate-50 hover:text-primary-600 transition-colors">タスク一覧</Link>
            
            {/* グループ切り替え */}
            <div className="relative">
              <button 
                onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                className={`flex items-center gap-1 px-3 py-2 rounded-md transition-colors ${
                  isGroupMenuOpen 
                    ? 'bg-slate-50 text-primary-600' 
                    : 'hover:bg-slate-50 hover:text-primary-600'
                }`}
              >
                参加グループ
                <span className="text-[10px] opacity-60">▼</span>
              </button>

              {isGroupMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsGroupMenuOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      所属グループ
                    </div>
                    {mockGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleGroupClick(group.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700"
                      >
                        {group.name}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 my-1"></div>
                    <Link 
                      to="/group/new" 
                      className="block w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-slate-50 font-medium"
                      onClick={() => setIsGroupMenuOpen(false)}
                    >
                      + 新しいグループを作成
                    </Link>
                  </div>
                </>
              )}
            </div>

            <Link to="/instagram" className="px-3 py-2 rounded-md hover:bg-slate-50 hover:text-primary-600 transition-colors">画像生成</Link>
          </nav>
        </div>

        {/* 右側：プロフィール */}
        <div className="flex items-center gap-4">
          <Link 
            to="/user/me/profile" 
            className="text-sm font-medium text-slate-600 hover:text-primary-600 flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              U
            </div>
            <span>Your Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
};