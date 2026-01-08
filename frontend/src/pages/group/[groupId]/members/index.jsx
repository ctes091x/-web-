// frontend/src/pages/group/[groupId]/members/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../../lib/api';

const GroupMembersPage = () => {
  const { groupId } = useParams();
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ▼ 追加: 管理者権限を管理するState
  const [isAdmin, setIsAdmin] = useState(false);

  // データ取得
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 自分の情報 (権限チェック用)
      // 2. メンバー一覧 (accepted_only=true)
      // 3. 申請一覧 (accepted_only=false) ※管理者のみ閲覧前提だが、一旦取得してみる
      const [meRes, membersRes, requestsRes] = await Promise.all([
        api.get('/me'), // 修正: /users/me ではなく /me を使用
        api.get(`/groups/${groupId}/members`, { params: { accepted_only: true } }),
        api.get(`/groups/${groupId}/members`, { params: { accepted_only: false } })
      ]);

      const myUser = meRes.data;
      const membersData = membersRes.data;
      
      // ▼ 管理者判定ロジック
      const myMembership = membersData.find(m => {
        // フラット構造(m.user_id) か ネスト構造(m.user.user_id) か両対応
        if (m.user_id === myUser.user_id) return true;
        if (m.user && m.user.user_id === myUser.user_id) return true;
        return false;
      });
      const isRepresentative = myMembership && myMembership.is_representative === true;
      setIsAdmin(isRepresentative);

      // メンバーリスト更新
      setMembers(membersData);

      // 承認待ちリスト更新 (APIが全件返す場合に備えて !accepted でフィルタリング)
      const pendingRequests = requestsRes.data.filter(m => !m.accepted);
      setRequests(pendingRequests);

    } catch (error) {
      console.error("Fetch members failed:", error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 承認・拒否ハンドラ
  const handleRequestAction = async (targetEmail, action) => {
    if (!window.confirm(`${action === 'approve' ? '承認' : '拒否'}してよろしいですか？`)) return;

    try {
      await api.put(`/groups/${groupId}/join_requests`, {
        target_identifier: targetEmail,
        action: action
      });
      alert('処理が完了しました');
      fetchData(); // リロード
    } catch (error) {
      console.error("Action failed:", error);
      alert('処理に失敗しました');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* タブヘッダー */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${
            activeTab === 'members' 
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          メンバー ({members.length})
        </button>
        {/* ▼ 管理者のみ承認待ちタブを表示（任意: 非管理者には見せない場合） */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${
              activeTab === 'requests' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            承認待ち ({requests.length})
          </button>
        )}
      </div>

      {/* コンテンツ */}
      <div className="p-0">
        {loading ? (
          <div className="p-8 text-center text-slate-400">読み込み中...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* リスト表示の切り替え */}
            {(activeTab === 'members' ? members : requests).length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">該当するユーザーはいません</div>
            ) : (
              (activeTab === 'members' ? members : requests).map((member) => (
                <div key={member.user_id || member.email} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                      {member.user_name ? member.user_name[0] : 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        {member.user_name}
                        {member.is_representative && (
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded border border-indigo-200">管理者</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>

                  {/* アクションボタンエリア */}
                  <div>
                    {activeTab === 'requests' && isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestAction(member.email, 'approve')}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-700"
                        >
                          承認
                        </button>
                        <button
                          onClick={() => handleRequestAction(member.email, 'reject')}
                          className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded shadow-sm hover:bg-slate-50"
                        >
                          拒否
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupMembersPage;