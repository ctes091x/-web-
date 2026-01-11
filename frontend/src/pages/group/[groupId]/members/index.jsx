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
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // データ取得
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, membersRes] = await Promise.all([
        api.get('/me'),
        api.get(`/groups/${groupId}/members`, { params: { accepted_only: true } })
      ]);

      const myUser = meRes.data;
      setCurrentUser(myUser);

      const membersData = membersRes.data;

      // 管理者判定
      const myMembership = membersData.find(m => {
        if (m.user_id === myUser.user_id) return true;
        if (m.user && m.user.user_id === myUser.user_id) return true;
        return false;
      });
      const isRepresentative = myMembership && myMembership.is_representative === true;
      setIsAdmin(isRepresentative);
      setMembers(membersData);

      // 承認待ちリスト取得 (管理者の場合のみ)
      let pendingRequests = [];
      if (isRepresentative) {
        try {
          const requestsRes = await api.get(`/groups/${groupId}/members`, { params: { accepted_only: false } });
          pendingRequests = requestsRes.data.filter(m => !m.accepted);
        } catch (reqError) {
          console.warn("Requests fetch failed (likely not admin):", reqError);
        }
      }
      setRequests(pendingRequests);

    } catch (error) {
      console.error("Fetch members failed:", error);
      alert("メンバー情報の取得に失敗しました");
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
      fetchData(); 
    } catch (error) {
      console.error("Action failed:", error);
      alert('処理に失敗しました');
    }
  };

  // ▼▼▼ 修正: あらゆる可能性を考慮した「全部入り」リクエスト送信 ▼▼▼
  const handleRoleUpdate = async (targetUserId, isCurrentlyAdmin) => {
    if (!targetUserId) {
      alert("エラー: ユーザーIDが不明です");
      return;
    }

    const actionName = isCurrentlyAdmin ? '解除' : '付与';
    if (!window.confirm(`このユーザーの管理者権限を${actionName}してよろしいですか？`)) return;

    try {
      // 1. パスパラメータ用のURL (API定義準拠)
      const url = `/groups/${groupId}/members/${targetUserId}`;

      // 2. Bodyデータ (accepted: true を明示)
      //念のため body にも target_identifier を含めておく
      const payload = {
        accepted: true,
        is_representative: !isCurrentlyAdmin,
        target_identifier: targetUserId 
      };

      // 3. クエリパラメータ (エラー回避用)
      // "query.target_identifier: Field required" エラーへの対策として、クエリにもIDを付与する
      const config = {
        params: {
          target_identifier: targetUserId
        }
      };

      console.log(`Sending PUT to ${url} with params:`, config.params, "body:", payload);

      await api.put(url, payload, config);
      
      alert(`管理者権限を${actionName}しました`);
      fetchData(); 
    } catch (error) {
      console.error("Role update failed:", error);
      
      let message = '権限の変更に失敗しました';
      if (error.response && error.response.data) {
        const { detail } = error.response.data;
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail)) {
          message = "入力形式エラー:\n" + detail.map(d => {
            const field = d.loc ? d.loc.join('.') : 'field';
            return `- ${field}: ${d.msg}`;
          }).join('\n');
        } else if (typeof detail === 'object') {
          message = JSON.stringify(detail, null, 2);
        }
      }
      alert(message);
    }
  };

  return (
    <>
      <title>メンバー一覧 | Syncle</title>
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
                        {(isAdmin || (currentUser && currentUser.user_id === member.user_id)) && (
                          <p className="text-xs text-slate-500">{member.email}</p>
                        )}
                      </div>
                    </div>

                    {/* アクションボタンエリア */}
                    <div>
                      {/* 承認待ちタブ (管理者のみ) */}
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

                      {/* メンバー一覧タブ (管理者のみ & 自分以外) */}
                      {activeTab === 'members' && isAdmin && currentUser && member.user_id !== currentUser.user_id && (
                        <div className="flex gap-2">
                          {member.is_representative ? (
                            <button
                              onClick={() => handleRoleUpdate(member.user_id, true)}
                              className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-bold rounded shadow-sm hover:bg-red-50"
                            >
                              管理者解除
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleUpdate(member.user_id, false)}
                              className="px-3 py-1.5 border border-indigo-200 text-indigo-600 text-xs font-bold rounded shadow-sm hover:bg-indigo-50"
                            >
                              管理者に設定
                            </button>
                          )}
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
    </>
  );
};

export default GroupMembersPage;
