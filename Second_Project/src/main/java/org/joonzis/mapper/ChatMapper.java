package org.joonzis.mapper;

import org.joonzis.domain.ReportHistoryVO;

public interface ChatMapper {
	//채팅 신고
	public void reportHistory(ReportHistoryVO reportHistory);
}
