package org.joonzis.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.ReportHistoryVO;

public interface ChatMapper {
	//채팅 신고
	public void reportHistory(ReportHistoryVO reportHistory);
	
	// 채팅 신고 목록
	public List<ReportHistoryVO> getReportHistory(@Param("offset") int offset, @Param("size") int size);
	
	// 전체 카운트
	public int getReportHistoryCount();
}
