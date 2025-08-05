import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../css/adminPage/QuestRegiCallManage.module.css';

const QuestRegiCallManage = () => {
    // 예시 데이터 대신 실제 데이터를 담을 상태
    const [calls, setCalls] = useState([]);
    const [totalCalls, setTotalCalls] = useState(0); // 전체 데이터 수
    const [loading, setLoading] = useState(false); // 로딩 상태
    const [error, setError] = useState(null); // 에러 상태
    const [saving, setSaving] = useState(false);

    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('전체');
    const [filterType, setFilterType] = useState('전체');
    const [selectedCalls, setSelectedCalls] = useState([]);
    // const [showDetailModal, setShowDetailModal] = useState(false); // 모달 상태 제거
    const [selectedCall, setSelectedCall] = useState(null); // 선택된 문제 요청 상세 데이터

    const [currentPage, setCurrentPage] = useState(1);
    const [callsPerPage, setCallsPerPage] = useState(10); // 페이지당 표시 개수

    const token = localStorage.getItem('token');

    // 데이터 로드 함수 (API 호출)
    const fetchCalls = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: callsPerPage, // 백엔드 컨트롤러의 @RequestParam "limit"에 맞춤
                searchTerm: searchTerm,
                filterStatus: filterStatus === '전체' ? '' : filterStatus,
                // filterType: filterType === '전체' ? '' : filterType, // 현재 DB 컬럼에 직접 매핑되지 않으므로, 백엔드 로직에 따라 활성화 또는 삭제
            }).toString();

            // 백엔드 엔드포인트에 맞게 URL 수정
            const response = await fetch(`/admin/questRequests?${queryParams}`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`데이터 로드 실패: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            setCalls(data.requests); // 백엔드에서 'requests' 속성에 데이터 배열이 있다고 가정
            setTotalCalls(data.totalCount); // 백엔드에서 'totalCount' 속성에 전체 개수가 있다고 가정
            setSelectedCalls([]); // 새 목록 로드 시 선택 해제
        } catch (err) {
            console.error("데이터 로드 중 오류 발생:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentPage, callsPerPage, searchTerm, filterStatus]); // filterType 제거 또는 백엔드와 맞춰 수정

    // 컴포넌트 마운트 또는 필터/페이지네이션 변경 시 데이터 로드
    useEffect(() => {
        fetchCalls();
    }, [fetchCalls]);

    // 페이지네이션 로직
    const totalPages = Math.ceil(totalCalls / callsPerPage);

    const handlePageChange = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleCheckboxChange = (callId) => {
        setSelectedCalls(prev =>
            prev.includes(callId)
                ? prev.filter(id => id !== callId)
                : [...prev, callId]
        );
    };

    const handleAllCheckboxChange = (e) => {
        if (e.target.checked) {
            setSelectedCalls(calls.map(call => call.id));
        } else {
            setSelectedCalls([]);
        }
    };

    // 벌크 상태 변경 (기존과 동일)
    const handleBulkStatusChange = async (newStatus) => {
        if (selectedCalls.length === 0) {
            alert('변경할 제보를 선택해주세요.');
            return;
        }

        try {
            // 선택된 각 제보에 대해 PUT 요청 보내기 (백엔드에 벌크 처리 API가 없다면 개별 호출)
            // 백엔드에 벌크 API를 만들면 더 효율적입니다.
            await Promise.all(selectedCalls.map(async (callId) => {
                const callToUpdate = calls.find(call => call.id === callId);
                if (callToUpdate) {
                    const response = await fetch(`/admin/questRequests/${callId}`, { // API 엔드포인트 수정
                        method: 'PUT',
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ ...callToUpdate, status: newStatus }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`벌크 업데이트 실패 (ID: ${callId}): ${errorText}`);
                    }
                }
            }));

            alert(`${selectedCalls.length}개의 제보 상태가 '${newStatus}'로 변경되었습니다.`);
            setSelectedCalls([]); // 상태 변경 후 선택 해제
            fetchCalls(); // 변경 후 데이터 다시 로드
        } catch (error) {
            console.error("벌크 상태 변경 중 오류:", error);
            alert(`상태 변경 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    // 상세 미리보기 로드 함수
    const handleRowClick = async (callId) => {
        // 이미 선택된 항목이면 토글 (선택 해제)
        if (selectedCall && selectedCall.id === callId) {
            setSelectedCall(null);
            return;
        }

        setLoading(true); // 상세 정보 로딩 중 표시
        try {
            // 백엔드 엔드포인트에 맞게 URL 수정
            const response = await fetch(`/admin/questRequests/${callId}`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`상세 정보 로드 실패: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            setSelectedCall(data); // 선택된 제보의 상세 정보 설정
        } catch (error) {
            console.error("제보 상세 정보 로드 중 오류:", error);
            alert(`상세 정보 로드 중 오류가 발생했습니다: ${error.message}`);
            setSelectedCall(null); // 에러 시 상세 정보 비움
        } finally {
            setLoading(false); // 로딩 완료
        }
    };

    // 상세 미리보기에서 저장 버튼 클릭 시 (수정)
    const handleDetailSave = async () => {
        if (!selectedCall) return;
        setSaving(true);

        try {
            if (selectedCall.status === '처리 완료') {
                // 1) 문제 등록
                const registerResponse = await fetch(`/admin/questions`, {
                    method: 'POST',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(selectedCall),
                });

                if (!registerResponse.ok) {
                    const errorText = await registerResponse.text();
                    throw new Error(`문제 등록 실패: ${registerResponse.status} ${errorText}`);
                }

                // 2) 상태 업데이트
                const response = await fetch(`/admin/questRequests/${selectedCall.id}`, {
                    method: 'PUT',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(selectedCall),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`상세 정보 저장 실패: ${response.status} ${errorText}`);
                }
            } 
            else if (selectedCall.status === '반려') {
                // 반려 처리 전용 API 호출
                const rejectResponse = await fetch(`/admin/questRequests/${selectedCall.id}/reject`, {
                    method: 'PUT',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(selectedCall),
                });

                if (!rejectResponse.ok) {
                    const errorText = await rejectResponse.text();
                    throw new Error(`반려 처리 실패: ${rejectResponse.status} ${errorText}`);
                }
            } 
            else {
                // 그 외 상태일 경우 일반 상태 업데이트만
                const response = await fetch(`/admin/questRequests/${selectedCall.id}`, {
                    method: 'PUT',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(selectedCall),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`상세 정보 저장 실패: ${response.status} ${errorText}`);
                }
            }

            alert('제보 상세 정보가 업데이트되었습니다.');
            setSelectedCall(null);
            fetchCalls();
        } catch (error) {
            console.error("제보 상세 정보 저장 중 오류:", error);
            alert(`상세 정보 저장 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            setSaving(false); // 저장 중 상태 종료
        }
    };


    // 상세 미리보기 필드 값 변경 핸들러
    const handleDetailChange = (e) => {
        const { name, value } = e.target;
        setSelectedCall(prev => ({ ...prev, [name]: value }));
    };

    // 상태에 따른 CSS 클래스 반환 함수 (변경 없음)
    const getStatusClassName = (status) => {
        switch (status) {
            case '미확인': return styles.unconfirmed;
            case '확인 중': return styles.checking;
            case '처리 완료': return styles.completed;
            case '반려': return styles.rejected;
            default: return '';
        }
    };

    if (loading && !selectedCall) { // 초기 로딩 또는 목록 로딩 중
        return <div className={styles.pageContainer}>로딩 중...</div>;
    }

    if (error) {
        return <div className={styles.pageContainer} style={{ color: 'red' }}>오류: {error}</div>;
    }
    console.log(selectedCall);
    

    return (
        <div className={styles.pageContainer}>
            <h1>문제 등록 요청 관리</h1>

            {/* 메인 콘텐츠 영역: 좌우로 분할 */}
            <div className={styles.splitViewContainer}> {/* 이 컨테이너에 CSS Grid/Flexbox 적용 */}
                {/* 왼쪽 패널: 검색 및 결과 리스트 */}
                <div className={styles.leftPanel}>
                    <div className={styles.filterSection}>
                        <input
                            type="text"
                            placeholder="검색 (본문, 제보자 ID)"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="전체">상태: 전체</option>
                            <option value="미확인">상태: 미확인</option>
                            <option value="확인 중">상태: 확인 중</option>
                            <option value="처리 완료">상태: 처리 완료</option>
                            <option value="반려">상태: 반려</option>
                        </select>
                        <button onClick={() => {
                            setSearchTerm(searchInput);
                            setFilterStatus('전체'); // 필요 시 초기화
                            setCurrentPage(1);
                            }}>검색</button>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.callTable}>
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            onChange={handleAllCheckboxChange}
                                            checked={calls.length > 0 && selectedCalls.length === calls.length}
                                        />
                                    </th>
                                    <th>No</th>
                                    <th>작성자 (ID)</th> {/* user_id로 표시 */}
                                    <th>요청일시</th>
                                    <th>본문 미리보기</th>
                                    <th>현재 상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calls.length > 0 ? (
                                    calls.map(call => (
                                        <tr key={call.id}
                                            className={selectedCall && selectedCall.id === call.id ? styles.selectedRow : ''} // 선택된 행 하이라이트
                                            onClick={() => handleRowClick(call.id)}> {/* 행 클릭 시 상세 미리보기 */}
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCalls.includes(call.id)}
                                                    onChange={(e) => { e.stopPropagation(); handleCheckboxChange(call.id); }} // 체크박스 클릭 시 행 클릭 이벤트 방지
                                                />
                                            </td>
                                            <td>{call.id}</td>
                                            <td>{call.user_id || call.user_no}</td> {/* user_id가 있다면 사용, 없으면 user_no */}
                                            <td>{new Date(call.created_at).toLocaleString()}</td>
                                            <td className={styles.titleCell}>
                                                {call.question_text.length > 50 ? call.question_text.substring(0, 50) + '...' : call.question_text} {/* 본문 미리보기 */}
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${getStatusClassName(call.status)}`}>
                                                    {call.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center' }}>제보가 없습니다.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {selectedCalls.length > 0 && (
                        <div className={styles.bulkActionSection}>
                            <p>선택된 제보: {selectedCalls.length}건</p>
                            <button className={styles.bulkActionButton} onClick={() => handleBulkStatusChange('미확인')}>미확인으로</button>
                            <button className={styles.bulkActionButton} onClick={() => handleBulkStatusChange('확인 중')}>확인 중으로</button>
                            <button className={styles.bulkActionButton} onClick={() => handleBulkStatusChange('처리 완료')}>처리 완료로</button>
                            <button className={styles.bulkActionButton} onClick={() => handleBulkStatusChange('반려')}>반려로</button>
                        </div>
                    )}

                    <div className={styles.paginationContainer}>
                        <span>총 {totalCalls}건</span>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>이전</button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => handlePageChange(i + 1)}
                                className={currentPage === i + 1 ? styles.active : ''}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>다음</button>
                        {/* <select value={callsPerPage} onChange={(e) => {
                            setCallsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}>
                            <option value={10}>10개씩 보기</option>
                            <option value={20}>20개씩 보기</option>
                            <option value={50}>50개씩 보기</option>
                        </select> */}
                    </div>
                </div>

                {/* 오른쪽 패널: 상세 미리보기 (selectedCall이 있을 때만 표시) */}
                <div className={styles.rightPanel}>
                    <div>
                        {selectedCall ? (
                            <div style={{ marginBottom: '40px',  paddingBottom: '20px' }}>
                                <h3>{selectedCall.question_text}</h3>

                                {selectedCall.image_data && (
                                    <div style={{ margin: '10px 0' }}>
                                    <img
                                        src={`data:image/png;base64,${selectedCall.image_data}`}
                                        alt="문제 이미지"
                                        style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd' }}
                                    />
                                    </div>
                                )}

                                <div>
                                    {[1, 2, 3, 4].map(num => (
                                    <div key={num}>
                                        <label>
                                        <input
                                            type="radio"
                                            name={`q${selectedCall.id}`}
                                            value={num}
                                            />{selectedCall[`option_${num}`]}
                                        </label>
                                    </div>
                                    ))}
                                </div>
                                <div>
                                    <span> 정답 : {selectedCall.correct_answer} </span>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>현재 상태:</label>
                                    <select name="status" value={selectedCall.status || ''} onChange={handleDetailChange}>
                                        <option value="미확인">미확인</option>
                                        <option value="확인 중">확인 중</option>
                                        <option value="처리 완료">처리 완료</option>
                                        <option value="반려">반려</option>
                                    </select>
                                </div>
                                <div className={styles.detailActions}>
                                    <button
                                        className={styles.actionButton}
                                        onClick={handleDetailSave}
                                        disabled={saving} // 저장 중이면 비활성화
                                    >
                                        {saving ? '저장 중...' : '저장'}
                                    </button>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => setSelectedCall(null)}
                                        disabled={saving} // 저장 중일 땐 닫기 버튼도 비활성화 (선택 사항)
                                    >
                                        미리보기 닫기
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.noSelectionMessage}>
                               왼쪽 목록에서 문제 요청을 선택하여 상세 정보를 확인하세요.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
// {selectedCall ? (
//                         <div className={styles.detailView}>
//                             <h2>요청 상세 정보</h2>
//                             <div className={styles.formGroup}>
//                                 <label>요청 ID:</label>
//                                 <input type="text" value={selectedCall.id || ''} readOnly />
//                             </div>
//                             <div className={styles.formGroup}>
//                                 <label>제보자:</label>
//                                 <input type="text" value={selectedCall.user_id || selectedCall.user_no || ''} readOnly />
//                             </div>
//                             <div className={styles.formGroup}>
//                                 <label>접수일시:</label>
//                                 <input type="text" value={selectedCall.created_at ? new Date(selectedCall.created_at).toLocaleString() : ''} readOnly />
//                             </div>
//                             <hr />
//                             <div className={styles.formGroup}>
//                                 <label>과목:</label>
//                                 <input type="text" value={selectedCall.subject || ''} readOnly />
//                             </div>
//                             <div className={styles.formGroup}>
//                                 <label>문제 본문:</label>
//                                 <textarea name="question_text" value={selectedCall.question_text || ''} onChange={handleDetailChange}></textarea>
//                             </div>
//                             {[1, 2, 3, 4].map(idx => (
//                                 <div className={styles.formGroup} key={idx}>
//                                     <label>{idx}번 선택지:</label>
//                                     <input type="text" name={`option_${idx}`} value={selectedCall[`option_${idx}`] || ''} onChange={handleDetailChange} />
//                                 </div>
//                             ))}
//                             <div className={styles.formGroup}>
//                                 <label>정답:</label>
//                                 <input type="text" name="correct_answer" value={selectedCall.correct_answer || ''} onChange={handleDetailChange} />
//                             </div>
//                             {selectedCall.image_data_base64 && ( // 백엔드에서 Base64로 인코딩하여 보내준 이미지 데이터
//                                 <div className={styles.formGroup}>
//                                     <label>첨부 이미지:</label>
//                                     <img src={`data:image/jpeg;base64,${selectedCall.image_data_base64}`} alt="첨부 이미지" style={{ maxWidth: '100%', height: 'auto' }} />
//                                 </div>
//                             )}
//                             <hr />
//                             <div className={styles.formGroup}>
//                                 <label>현재 상태:</label>
//                                 <select name="status" value={selectedCall.status || ''} onChange={handleDetailChange}>
//                                     <option value="미확인">미확인</option>
//                                     <option value="확인 중">확인 중</option>
//                                     <option value="처리 완료">처리 완료</option>
//                                     <option value="반려">반려</option>
//                                 </select>
//                             </div>
//                             <div className={styles.formGroup}>
//                                 <label>담당자:</label>
//                                 {/* admin_in_charge는 이전에 제외하기로 했으므로, 필요 없으면 제거 */}
//                                 <input type="text" name="admin_in_charge" value={selectedCall.admin_in_charge || ''} onChange={handleDetailChange} />
//                             </div>
//                             <div className={styles.formGroup}>
//                                 <label>처리 내용/코멘트:</label>
//                                 {/* process_comment는 이전에 제외하기로 했으므로, 필요 없으면 제거 */}
//                                 <textarea name="process_comment" value={selectedCall.process_comment || ''} onChange={handleDetailChange}></textarea>
//                             </div>
//                             {selectedCall.status === '반려' && (
//                                 <div className={styles.formGroup}>
//                                     <label>반려 사유:</label>
//                                     {/* rejection_reason은 이전에 제외하기로 했으므로, 필요 없으면 제거 */}
//                                     <textarea name="rejection_reason" value={selectedCall.rejection_reason || ''} onChange={handleDetailChange} required></textarea>
//                                 </div>
//                             )}

//                             <div className={styles.detailActions}>
//                                 <button className={styles.actionButton} onClick={handleDetailSave}>저장</button>
//                                 <button className={styles.actionButton} onClick={() => setSelectedCall(null)}>미리보기 닫기</button> {/* 미리보기 닫기 버튼 */}
//                             </div>
//                         </div>
//                     ) : (
//                         <div className={styles.noSelectionMessage}>
//                             왼쪽 목록에서 문제 요청을 선택하여 상세 정보를 확인하세요.
//                         </div>
//                     )}
export default QuestRegiCallManage;