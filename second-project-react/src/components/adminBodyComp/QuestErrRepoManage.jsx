import React, { useState, useEffect } from 'react';
import styles from '../../css/adminPage/QuestErrRepoManage.css'; // CSS 모듈 임포트

const QuestErrRepoManage = () => {
  // 예시 데이터
  const [reports, setReports] = useState([
    { id: 1, reporter: 'user123', reportedAt: '2025-07-01 10:00', title: '로그인 버튼 작동 오류', status: '미확인', 담당자: '-', lastUpdated: '2025-07-01 10:00', type: '버그', content: '로그인 페이지에서 로그인 버튼을 눌러도 반응이 없습니다.', attachments: ['login_error.png'] },
    { id: 2, reporter: 'dev_user', reportedAt: '2025-06-28 14:30', title: '게시물 작성 시 사진 업로드 지연', status: '확인 중', 담당자: '김개발', lastUpdated: '2025-07-02 11:00', type: '성능', content: '게시물을 작성할 때 사진을 여러 장 업로드하면 매우 느려집니다.', attachments: [] },
    { id: 3, reporter: 'admin_test', reportedAt: '2025-06-25 09:15', title: '마이페이지 오탈자 발견', status: '처리 완료', 담당자: '박수정', lastUpdated: '2025-06-26 16:00', type: '오탈자', content: '마이페이지의 "회원정보수정" 버튼 문구가 "회원정보수정정"으로 되어있습니다.', attachments: [] },
    { id: 4, reporter: 'user123', reportedAt: '2025-07-05 17:00', title: '검색 기능 개선 요청', status: '미확인', 담당자: '-', lastUpdated: '2025-07-05 17:00', type: '기능개선', content: '검색 시 연관 검색어를 추천해주면 좋겠습니다.', attachments: [] },
    { id: 5, reporter: 'spam_user', reportedAt: '2025-07-03 23:00', title: '광고성 게시물 제보', status: '반려', 담당자: '이관리', lastUpdated: '2025-07-04 09:30', type: '스팸', content: '지속적으로 광고성 게시물을 올리는 사용자가 있습니다. (반려 사유: 정책 위반이 아님)', attachments: [] },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('전체');
  const [filterType, setFilterType] = useState('전체');
  const [selectedReports, setSelectedReports] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage, setReportsPerPage] = useState(10);

  // 필터링된 제보 목록
  const filteredReports = reports.map(report => {
    const statusMatch = filterStatus === '전체' || report.status === filterStatus;
    const typeMatch = filterType === '전체' || report.type === filterType;
    const searchMatch = searchTerm === '' ||
                        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        report.reporter.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch ? report : null;
  }).filter(Boolean);

  // 페이지네이션
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleCheckboxChange = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleAllCheckboxChange = (e) => {
    if (e.target.checked) {
      setSelectedReports(currentReports.map(report => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleBulkStatusChange = (newStatus) => {
    const updatedReports = reports.map(report =>
      selectedReports.includes(report.id)
        ? { ...report, status: newStatus, lastUpdated: new Date().toLocaleString() }
        : report
    );
    setReports(updatedReports);
    setSelectedReports([]);
    alert(`${selectedReports.length}개의 제보 상태가 '${newStatus}'로 변경되었습니다.`);
  };

  const handleRowClick = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleDetailSave = () => {
    const updatedReports = reports.map(report =>
      report.id === selectedReport.id ? { ...selectedReport, lastUpdated: new Date().toLocaleString() } : report
    );
    setReports(updatedReports);
    setShowDetailModal(false);
    alert('제보 상세 정보가 업데이트되었습니다.');
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setSelectedReport(prev => ({ ...prev, [name]: value }));
  };

  // 상태에 따른 CSS 클래스 반환 함수
  const getStatusClassName = (status) => {
    switch (status) {
      case '미확인': return styles.unconfirmed;
      case '확인 중': return styles.checking;
      case '처리 완료': return styles.completed;
      case '반려': return styles.rejected;
      default: return '';
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h1>문제 오류 제보 관리</h1>
      <p>사용자들의 문제 오류 제보를 관리하는 페이지입니다.</p>

      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="검색 (제목, 내용, 제보자)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="전체">상태: 전체</option>
          <option value="미확인">상태: 미확인</option>
          <option value="확인 중">상태: 확인 중</option>
          <option value="처리 완료">상태: 처리 완료</option>
          <option value="반려">상태: 반려</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="전체">유형: 전체</option>
          <option value="버그">유형: 버그</option>
          <option value="기능개선">유형: 기능 개선</option>
          <option value="오탈자">유형: 오탈자</option>
          <option value="성능">유형: 성능</option>
          <option value="스팸">유형: 스팸</option>
          <option value="기타">유형: 기타</option>
        </select>
        <button onClick={() => { setSearchTerm(''); setFilterStatus('전체'); setFilterType('전체'); }}>초기화</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.reportTable}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleAllCheckboxChange}
                  checked={currentReports.length > 0 && selectedReports.length === currentReports.filter(r => selectedReports.includes(r.id)).length}
                />
              </th>
              <th>제보 ID</th>
              <th>제보자</th>
              <th>접수일시</th>
              <th>제목/요약</th>
              <th>현재 상태</th>
              <th>담당자</th>
              <th>최종 업데이트</th>
              <th>조치</th>
            </tr>
          </thead>
          <tbody>
            {currentReports.length > 0 ? (
              currentReports.map(report => (
                <tr key={report.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => handleCheckboxChange(report.id)}
                    />
                  </td>
                  <td>{report.id}</td>
                  <td>{report.reporter}</td>
                  <td>{report.reportedAt}</td>
                  <td className={styles.titleCell} onClick={() => handleRowClick(report)}>
                    {report.title}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClassName(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>{report.담당자}</td>
                  <td>{report.lastUpdated}</td>
                  <td>
                    <button className={styles.actionButton} onClick={() => handleRowClick(report)}>상세 보기</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center' }}>제보가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedReports.length > 0 && (
        <div>
          <p>선택된 제보: {selectedReports.length}건</p>
          <button className={styles.bulkActionButton} onClick={() => handleBulkStatusChange('미확인')}>선택 항목 미확인으로</button>
          <button className={styles.bulkActionButton} onClick={() => handleBulkStatusChange('확인 중')}>선택 항목 확인 중으로</button>
          <button className={styles.bulkActionButton} onClick={() => handleBulkStatusChange('처리 완료')}>선택 항목 처리 완료로</button>
          <button className={styles.bulkActionButton} onClick={() => handleBulkStatusChange('반려')}>선택 항목 반려로</button>
        </div>
      )}

      <div className={styles.paginationContainer}>
        <span>총 {filteredReports.length}건</span>
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
        <select value={reportsPerPage} onChange={(e) => {
          setReportsPerPage(Number(e.target.value));
          setCurrentPage(1); // 페이지당 항목 수 변경 시 첫 페이지로 이동
        }}>
          <option value={10}>10개씩 보기</option>
          <option value={20}>20개씩 보기</option>
          <option value={50}>50개씩 보기</option>
        </select>
      </div>

      {showDetailModal && selectedReport && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h2>제보 상세 보기/수정</h2>
            <div className={styles.formGroup}>
              <label>제보 ID:</label>
              <input type="text" value={selectedReport.id} readOnly />
            </div>
            <div className={styles.formGroup}>
              <label>제보자:</label>
              <input type="text" value={selectedReport.reporter} readOnly />
            </div>
            <div className={styles.formGroup}>
              <label>접수일시:</label>
              <input type="text" value={selectedReport.reportedAt} readOnly />
            </div>
            <div className={styles.formGroup}>
              <label>최종 업데이트:</label>
              <input type="text" value={selectedReport.lastUpdated} readOnly />
            </div>
            <hr />
            <div className={styles.formGroup}>
              <label>제목:</label>
              <input type="text" name="title" value={selectedReport.title} onChange={handleDetailChange} />
            </div>
            <div className={styles.formGroup}>
              <label>제보 유형:</label>
              <select name="type" value={selectedReport.type} onChange={handleDetailChange}>
                <option value="버그">버그</option>
                <option value="기능개선">기능 개선</option>
                <option value="오탈자">오탈자</option>
                <option value="성능">성능</option>
                <option value="스팸">스팸</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>상세 내용:</label>
              <textarea name="content" value={selectedReport.content} onChange={handleDetailChange}></textarea>
            </div>
            {selectedReport.attachments && selectedReport.attachments.length > 0 && (
              <div className={styles.formGroup}>
                <label>첨부 파일:</label>
                <ul>
                  {selectedReport.attachments.map((file, index) => (
                    <li key={index}><a href="#" onClick={(e) => { e.preventDefault(); alert(`파일 다운로드: ${file}`); }}>{file}</a></li>
                  ))}
                </ul>
              </div>
            )}
            <hr />
            <div className={styles.formGroup}>
              <label>현재 상태:</label>
              <select name="status" value={selectedReport.status} onChange={handleDetailChange}>
                <option value="미확인">미확인</option>
                <option value="확인 중">확인 중</option>
                <option value="처리 완료">처리 완료</option>
                <option value="반려">반려</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>담당자:</label>
              <input type="text" name="담당자" value={selectedReport.담당자} onChange={handleDetailChange} />
            </div>
            <div className={styles.formGroup}>
              <label>처리 내용/코멘트:</label>
              <textarea name="processingContent" value={selectedReport.processingContent || ''} onChange={handleDetailChange}></textarea>
            </div>
            {selectedReport.status === '반려' && (
              <div className={styles.formGroup}>
                <label>반려 사유:</label>
                <textarea name="rejectionReason" value={selectedReport.rejectionReason || ''} onChange={handleDetailChange} required></textarea>
              </div>
            )}

            <div className={styles.modalActions}>
              <button className={styles.actionButton} onClick={handleDetailSave}>저장</button>
              <button className={styles.actionButton} onClick={() => setShowDetailModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestErrRepoManage;