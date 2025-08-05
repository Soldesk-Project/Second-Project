package org.joonzis.service;

import org.joonzis.domain.ReportHistoryVO;

public interface ChatService {
	//채팅 신고
	public void reportHistory(ReportHistoryVO reportHistory);
}
