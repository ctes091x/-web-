// frontend/src/pages/group/[groupId]/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../../lib/api';

import EventModal from '../../calendar/EventModal';
import CreateEventModal from '../CreateEventModal';

const GroupCalendarPage = () => {
  const { groupId } = useParams();
  
  const [events, setEvents] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  // 1. 権限チェックとユーザー情報取得
  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const [meRes, membersRes] = await Promise.all([
          // 修正: バックエンドの現状に合わせて /users を削除
          api.get('/me'),
          api.get(`/groups/${groupId}/members`) // 管理者チェックにはこれが一番確実
        ]);

        const myUser = meRes.data;
        setCurrentUser(myUser);

        // メンバー一覧から自分を探す
        const myMembership = membersRes.data.find(m => {
          // Aパターン: フラット構造
          if (m.user_id === myUser.user_id) return true;
          // Bパターン: ネスト構造
          if (m.user && m.user.user_id === myUser.user_id) return true;
          return false;
        });

        // デバッグ用ログ
        console.log("Myself:", myUser);
        console.log("My Membership in Group:", myMembership);

        // is_representative が true なら管理者
        if (myMembership && myMembership.is_representative === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    
    if (groupId) { // groupIdがある時のみ実行
      fetchUserStatus();
    }
  }, [groupId]);

  // 2. タスク取得 (API連携)
  const fetchTasks = useCallback(async () => {
    try {
      // 既存API: グループタスク一覧
      const response = await api.get(`/groups/${groupId}/tasks`);
      
      const mappedEvents = response.data.map(task => ({
        id: task.task_id,
        title: task.title,
        start: task.time_span_begin || task.date,
        end: task.time_span_end,
        color: '#6366f1',
        extendedProps: {
          groupName: 'Current Group', 
          location: task.location,
          description: task.description,
          task_id: task.task_id,
          // リアクション情報 (TaskUserRelation) を含める
          task_user_relations: task.task_user_relations || []
        }
      }));
      setEvents(mappedEvents);
    } catch (error) {
      console.error("Fetch tasks failed:", error);
    }
  }, [groupId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // --- イベントハンドラ ---

  // 日付クリック (管理者のみ新規作成)
  const handleDateSelect = (selectInfo) => {
    if (!isAdmin) return;
    setSelectedDateStr(selectInfo.startStr);
    setIsCreateModalOpen(true);
  };

  // イベントクリック
  const handleEventClick = (info) => {
    const eventObj = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      backgroundColor: info.event.backgroundColor,
      extendedProps: info.event.extendedProps
    };
    setSelectedEvent(eventObj);
    setIsDetailModalOpen(true);
  };

  // ドラッグ＆ドロップ (管理者のみ)
  const handleEventDrop = async (info) => {
    if (!isAdmin) {
      info.revert();
      return;
    }
    if (!window.confirm(`「${info.event.title}」の日程を変更しますか？`)) {
      info.revert();
      return;
    }

    try {
      // 日付/時間の更新
      const newDate = info.event.start.toISOString().split('T')[0];
      const newStart = info.event.start ? info.event.start.toISOString() : null;
      const newEnd = info.event.end ? info.event.end.toISOString() : null;

      // 既存API: PUT /groups/{id}/tasks/{taskId}
      await api.put(`/groups/${groupId}/tasks/${info.event.id}`, {
        date: newDate,
        time_span_begin: newStart,
        time_span_end: newEnd
      });
    } catch (error) {
      console.error("Update failed:", error);
      alert("更新に失敗しました");
      info.revert();
    }
  };

  // 新規作成実行
  const handleCreateSubmit = async (formData) => {
    try {
      // 既存API: POST /groups/{id}/tasks/
      await api.post(`/groups/${groupId}/tasks/`, {
        title: formData.title,
        date: selectedDateStr,
        time_span_begin: formData.startTime ? `${selectedDateStr}T${formData.startTime}:00` : null,
        time_span_end: formData.endTime ? `${selectedDateStr}T${formData.endTime}:00` : null,
        location: formData.location,
        description: formData.description,
        is_task: true,
        status: "未着手"
      });
      setIsCreateModalOpen(false);
      fetchTasks();
    } catch (error) {
      alert("作成に失敗しました");
    }
  };

  // リアクション更新
  const handleReactionUpdate = async (taskId, reactionType) => {
    try {
      // 既存API: PUT .../reaction
      await api.put(`/groups/${groupId}/tasks/${taskId}/reaction`, {
        reaction: reactionType,
        comment: "" 
      });
      fetchTasks(); // 最新情報を再取得
      setIsDetailModalOpen(false);
    } catch (error) {
      alert("更新できませんでした");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">グループカレンダー</h1>
          <p className="text-sm text-slate-500">
             {isAdmin ? "あなたは管理者です。予定の追加・編集が可能です。" : "予定の確認と参加表明ができます。"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedDateStr(new Date().toISOString().split('T')[0]);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700"
          >
            ＋ 新規作成
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="h-[750px]">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
            locale="ja"
            firstDay={1}
            height="100%"
            events={events}
            
            // 操作系
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}   // 移動
            eventResize={handleEventDrop} // 期間変更
            
            // 作成系
            selectable={isAdmin}
            dateClick={handleDateSelect}
            
            editable={isAdmin} // 管理者のみ編集可能
          />
        </div>
      </div>

      <EventModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        event={selectedEvent}
        currentUser={currentUser}
        onReactionUpdate={handleReactionUpdate}
        readOnly={false} // グループ画面ではリアクション可能
      />

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        initialDate={selectedDateStr}
      />
    </div>
  );
};

export default GroupCalendarPage;