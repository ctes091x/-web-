// frontend/src/pages/calendar/index.jsx
import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../lib/api'; 

import EventModal from './EventModal';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const calendarRef = useRef(null);

  // マウント時に一括でデータ取得を行う（APIの仕様上、月ごとの取得ではなく全件取得になるため）
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. 自分のユーザー情報を取得
        const meRes = await api.get('/me');
        const myUser = meRes.data;
        setCurrentUser(myUser);

        // 2. 自分が所属しているグループ一覧を取得
        const groupsRes = await api.get('/me/groups');
        const myGroups = groupsRes.data;

        // 3. 各グループのタスク詳細を並列で取得
        const tasksPromises = myGroups.map(async (group) => {
          try {
            // グループごとのタスク取得APIは詳細情報(relation)を含んでいる
            const res = await api.get(`/groups/${group.group_id}/tasks`);
            // タスクデータにグループ名を付与して返す
            return res.data.map(task => ({ ...task, group_name: group.group_name }));
          } catch (error) {
            console.error(`Failed to fetch tasks for group ${group.group_id}`, error);
            return []; // エラー時は空配列を返す
          }
        });

        // 全グループのタスクを結合
        const results = await Promise.all(tasksPromises);
        const allTasks = results.flat();

        // 4. 「自分が参加(join)しているタスク」のみにフィルタリング
        const joinedTasks = allTasks.filter(task => {
          const relations = task.task_user_relations || [];
          const myRelation = relations.find(r => r.user_id === myUser.user_id);
          // バックエンドの定義に合わせて 'join' で判定
          return myRelation && myRelation.reaction === 'join';
        });

        // 5. FullCalendar用にマッピング
        const mappedEvents = joinedTasks.map(task => ({
          id: task.task_id,
          title: task.title,
          start: task.time_span_begin || task.date, 
          end: task.time_span_end,
          color: '#6366f1',
          extendedProps: {
            groupName: task.group_name,
            location: task.location,
            description: task.description || '詳細なし',
            task_user_relations: task.task_user_relations,
            status: task.status
          }
        }));

        setEvents(mappedEvents);

      } catch (error) {
        console.error("Fetch data failed:", error);
      }
    };

    fetchAllData();
  }, []);

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
    setIsModalOpen(true);
  };

  return (
    <>
      <title>マイカレンダー</title>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">マイカレンダー</h2>
          <p className="text-sm text-slate-500">
            あなたが「参加」を表明した全グループの予定を表示しています
          </p>
        </div>

        <div className="h-[750px]">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek'
            }}
            locale="ja"
            firstDay={1}
            height="100%"
            
            events={events}
            // datesSet は削除 (useEffectで一括取得するため不要)
            eventClick={handleEventClick}
            
            editable={false}
            selectable={false}
            dayMaxEvents={true}
          />
        </div>

        <EventModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          event={selectedEvent}
          currentUser={currentUser}
          readOnly={true} // マイカレンダーからは編集不可
        />
      </div>
    </>
  );
};

export default CalendarPage;
