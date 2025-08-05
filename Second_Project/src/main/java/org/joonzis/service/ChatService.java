package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.ReportHistoryVO;

public interface ChatService {
	//채팅 신고
	public void reportHistory(ReportHistoryVO reportHistory);
	
	// 채팅 신고 목록
	public List<ReportHistoryVO> getReportHistory(int offset, int size);
	
	// 전체 카운트
	public int getReportHistoryCount();
	
}
