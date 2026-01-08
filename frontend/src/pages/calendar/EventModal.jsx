// frontend/src/pages/calendar/EventModal.jsx
import React from 'react';
import ReactDOM from 'react-dom';

const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('ja-JP', {
    month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit'
  });
};

const EventModal = ({ 
  isOpen, 
  onClose, 
  event, 
  readOnly = false, 
  currentUser = null, 
  onReactionUpdate = () => {} 
}) => {
  if (!isOpen || !event) return null;

  const { title, start, end, extendedProps, backgroundColor } = event;
  const { description, location, groupName, task_user_relations } = extendedProps || {};

  // 1. 自分のリアクション状況を確認
  let myStatus = 'undecided';
  if (currentUser && task_user_relations) {
    const myRelation = task_user_relations.find(r => r.user_id === currentUser.user_id);
    if (myRelation) myStatus = myRelation.reaction;
  }

  // 2. 参加表明しているメンバーを抽出 ('join' の人のみ)
  const joinedMembers = task_user_relations
    ? task_user_relations.filter(r => r.reaction === 'join' && r.user)
    : [];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>

      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative z-10 max-h-[90vh] flex flex-col">
        
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-slate-100 relative overflow-hidden shrink-0">
          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: backgroundColor || '#6366f1' }}></div>
          <div className="pl-2">
            {groupName && (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-1" style={{ backgroundColor: backgroundColor || '#6366f1' }}>
                {groupName}
              </span>
            )}
            <h3 className="text-xl font-bold text-slate-900 leading-tight">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">{formatDate(start)} {end && ` - ${formatDate(end)}`}</p>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* コンテンツ (スクロール可能に) */}
        <div className="px-6 py-6 space-y-6 overflow-y-auto">
          {/* 場所 */}
          {location && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">📍</div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">場所</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{location}</p>
              </div>
            </div>
          )}

          {/* 詳細 */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">📝</div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">詳細</p>
              <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap leading-relaxed">{description || '詳細はありません'}</p>
            </div>
          </div>

          {/* ▼▼▼ 追加: 参加メンバー表示 ▼▼▼ */}
          {!readOnly && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">👥</div>
              <div className="w-full">
                <div className="flex justify-between items-baseline">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">参加予定 ({joinedMembers.length})</p>
                </div>
                
                {joinedMembers.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {joinedMembers.map((member) => (
                      <div key={member.user.user_id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1">
                        {/* ユーザーアイコン (なければイニシャル) */}
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                          {member.user.user_name ? member.user.user_name[0] : 'U'}
                        </div>
                        <span className="text-xs text-slate-700 font-medium">
                          {member.user.user_name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mt-1 italic">まだ参加表明はありません</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* フッター（リアクション操作） */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 shrink-0">
          {!readOnly ? (
            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onReactionUpdate(event.id, 'join')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                    myStatus === 'join' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {myStatus === 'join' ? '✓ 参加中' : '参加する'}
                </button>
                <button
                  onClick={() => onReactionUpdate(event.id, 'absent')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                    myStatus === 'absent' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  欠席
                </button>
              </div>
              <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">閉じる</button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md">閉じる</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default EventModal;