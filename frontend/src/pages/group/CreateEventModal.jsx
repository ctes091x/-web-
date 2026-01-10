// frontend/src/pages/group/CreateEventModal.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#64748b', label: 'Slate' },
];

const CreateEventModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete, 
  initialDate, 
  initialStartTime,
  initialData = null,
  isAdmin = false // ★ Added: 管理者権限フラグを追加
}) => {
  const isEditMode = !!initialData; // データがあれば編集モード

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    isAllDay: false, // ★ Added: 終日フラグ
    location: '',
    description: '',
    color: '#6366f1',
    colorLabel: ''
  });

  // 開始時間から+1時間を計算するヘルパー
  const calculateEndTime = (startStr) => {
    if (!startStr) return '';
    const [h, m] = startStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m);
    date.setHours(date.getHours() + 1);
    return date.toTimeString().slice(0, 5);
  };

  // モーダルが開いたときの初期値セット
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        // 編集モード: 既存データをセット
        // 時間が設定されていない場合は「終日」とみなす
        const hasTime = !!initialData.startTime;
        
        setFormData({
          title: initialData.title || '',
          date: initialData.date || '',
          startTime: initialData.startTime || '09:00',
          endTime: initialData.endTime || calculateEndTime(initialData.startTime || '09:00'),
          isAllDay: !hasTime, // ★ 時間がないなら終日
          location: initialData.location || '',
          description: initialData.description || '',
          color: initialData.color || '#6366f1',
          colorLabel: initialData.colorLabel || ''
        });
      } else {
        // 新規作成モード: デフォルト値をセット
        setFormData(prev => ({
          ...prev,
          title: '',
          date: initialDate || '',
          startTime: initialStartTime || '09:00',
          endTime: calculateEndTime(initialStartTime || '09:00'),
          isAllDay: false, // ★ デフォルトは時間指定あり
          location: '',
          description: '',
          color: '#6366f1',
          colorLabel: ''
        }));
      }
    }
  }, [isOpen, initialDate, initialStartTime, initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Checkboxの場合はcheckedを使用
    const val = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: val };
      
      // 開始時間が変わったら終了時間も連動 (終日モードでなく、編集中でもない場合)
      if (name === 'startTime' && !isEditMode && !newData.isAllDay) { 
        newData.endTime = calculateEndTime(value);
      }
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 終日の場合は時間をnullにする
    // バックエンドは time_span_begin/end が null の場合、日付のみのタスクとして扱う想定
    let startStr = null;
    let endStr = null;

    if (!formData.isAllDay) {
        startStr = formData.startTime ? `${formData.date}T${formData.startTime}` : null;
        endStr = formData.endTime ? `${formData.date}T${formData.endTime}` : null;
    }

    const submitPayload = {
      title: formData.title,
      date: formData.date,
      start: startStr,
      end: endStr,
      location: formData.location,
      description: formData.description,
    };

    onSubmit(submitPayload);
  };

  // 削除ハンドラ
  const handleDelete = () => {
    if (window.confirm('本当にこのタスクを削除しますか？')) {
      if (onDelete) {
        onDelete(initialData);
      }
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>

      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative z-10 flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-lg font-bold text-slate-800">
            {isEditMode ? 'タスクを編集' : '新規予定を作成'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* タイトル */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">タイトル <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              required
              autoFocus={!isEditMode}
              className="w-full rounded-lg border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-indigo-500 font-bold text-slate-900 placeholder:font-normal"
              placeholder="タイトルを入力"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          {/* カラー設定 (実装中) */}
          <div className="opacity-50 pointer-events-none relative">
            <div className="absolute -top-1 right-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
              ※ 現在開発中です
            </div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">カラー設定</label>
            <div className="flex flex-wrap gap-3 items-center">
              {COLORS.map((c) => (
                <div
                  key={c.value}
                  className={`w-8 h-8 rounded-full border-2 border-transparent`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              <input type="text" disabled placeholder="ラベル" className="ml-2 flex-1 rounded-md border-slate-300 text-sm py-1.5 px-3 bg-slate-50" />
            </div>
          </div>

          {/* 日時入力エリア */}
          <div className="grid grid-cols-12 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 items-center">
            {/* 日付: 5カラム */}
            <div className="col-span-12 sm:col-span-5">
              <label className="block text-xs font-bold text-slate-500 mb-1">日付</label>
              <input
                type="date"
                name="date"
                required
                className="w-full rounded-md border-slate-300 text-sm"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            {/* 終日チェックボックス: 2カラム */}
            <div className="col-span-12 sm:col-span-2 flex justify-start sm:justify-center pt-6 sm:pt-4">
               <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                  <input 
                      type="checkbox" 
                      name="isAllDay"
                      checked={formData.isAllDay}
                      onChange={handleChange}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  終日
               </label>
            </div>

            {/* 時間入力: 5カラム (終日の場合は薄くして操作不可に) */}
            <div className={`col-span-12 sm:col-span-5 grid grid-cols-2 gap-2 transition-opacity duration-200 ${formData.isAllDay ? 'opacity-40 pointer-events-none' : ''}`}>
                <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">開始</label>
                <input
                    type="time"
                    name="startTime"
                    required={!formData.isAllDay} // 終日でなければ必須
                    step="300"
                    className="w-full rounded-md border-slate-300 text-sm"
                    value={formData.startTime}
                    onChange={handleChange}
                    disabled={formData.isAllDay}
                />
                </div>
                <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">終了</label>
                <input
                    type="time"
                    name="endTime"
                    step="300"
                    className="w-full rounded-md border-slate-300 text-sm"
                    value={formData.endTime}
                    onChange={handleChange}
                    disabled={formData.isAllDay}
                />
                </div>
            </div>
          </div>

          {/* 場所 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">場所</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">📍</span>
              <input
                type="text"
                name="location"
                className="w-full rounded-md border-slate-300 pl-9 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="場所を入力"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* 詳細 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">詳細・メモ</label>
            <textarea
              name="description"
              rows="3"
              className="w-full rounded-md border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="詳細を記入"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
        </form>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          {/* 左側: 削除ボタン (編集モードかつonDeleteがあり、かつ管理者の場合のみ) */}
          <div>
            {isEditMode && onDelete && isAdmin && ( // ★ Changed: isAdmin判定を追加
                <button
                    type="button"
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-700 text-sm font-bold px-2 py-2 transition-colors flex items-center gap-1"
                >
                    <span className="text-lg">🗑</span> 削除
                </button>
            )}
          </div>

          {/* 右側: アクションボタン */}
          <div className="flex gap-3">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
                キャンセル
            </button>
            <button
                onClick={handleSubmit}
                className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
                <span>{isEditMode ? '更新する' : '作成する'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CreateEventModal;